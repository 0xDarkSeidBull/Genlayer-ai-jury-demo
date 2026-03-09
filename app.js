import { BrowserProvider, Contract, isAddress } from 'https://cdn.jsdelivr.net/npm/ethers@6.13.2/+esm';

const DEFAULT_ABI = `[
  {
    "type": "function",
    "name": "join_room",
    "stateMutability": "nonpayable",
    "inputs": [
      { "name": "room_id", "type": "string" },
      { "name": "wallet", "type": "address" }
    ],
    "outputs": []
  },
  {
    "type": "function",
    "name": "get_question",
    "stateMutability": "view",
    "inputs": [{ "name": "room_id", "type": "string" }],
    "outputs": [{ "name": "", "type": "string" }]
  },
  {
    "type": "function",
    "name": "submit_answer",
    "stateMutability": "nonpayable",
    "inputs": [
      { "name": "room_id", "type": "string" },
      { "name": "wallet", "type": "address" },
      { "name": "answer", "type": "string" }
    ],
    "outputs": []
  },
  {
    "type": "function",
    "name": "judge_and_distribute",
    "stateMutability": "nonpayable",
    "inputs": [{ "name": "room_id", "type": "string" }],
    "outputs": []
  },
  {
    "type": "function",
    "name": "xp",
    "stateMutability": "view",
    "inputs": [{ "name": "wallet", "type": "address" }],
    "outputs": [{ "name": "", "type": "uint256" }]
  }
]`;

const el = (id) => document.getElementById(id);
const walletStatus = el('walletStatus');
const contractStatus = el('contractStatus');
const txStatus = el('txStatus');

let account = null;
let provider = null;
let signer = null;
let contract = null;

el('abi').value = DEFAULT_ABI;

function setStatus(target, text, type = '') {
  target.className = `status ${type}`.trim();
  target.textContent = text;
}

function explainError(error) {
  const code = error?.code;
  if (code === 4001) return 'User rejected in MetaMask.';
  if (code === -32002) return 'MetaMask request already pending. Open extension and finish it.';
  return error?.shortMessage || error?.reason || error?.message || 'Unknown error';
}

function requireEth() {
  if (!window.ethereum) {
    setStatus(walletStatus, 'MetaMask not found. Install extension first.', 'err');
    return false;
  }
  return true;
}

async function connectWallet() {
  if (!requireEth()) return;
  try {
    provider = new BrowserProvider(window.ethereum);
    await provider.send('eth_requestAccounts', []);
    signer = await provider.getSigner();
    account = await signer.getAddress();
    const network = await provider.getNetwork();
    setStatus(walletStatus, `Connected: ${account} on chain 0x${network.chainId.toString(16)}`, 'ok');
  } catch (error) {
    setStatus(walletStatus, explainError(error), 'err');
  }
}

async function ensureChain() {
  const target = el('network').value;
  const current = await window.ethereum.request({ method: 'eth_chainId' });
  if (current === target) return true;

  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: target }],
    });
    return true;
  } catch (error) {
    setStatus(txStatus, `Chain switch failed: ${explainError(error)}`, 'err');
    return false;
  }
}

function parseAbi() {
  try {
    return JSON.parse(el('abi').value);
  } catch {
    throw new Error('Invalid ABI JSON.');
  }
}

function getRoomId() {
  const roomId = el('roomId').value.trim();
  if (!roomId) throw new Error('Room ID is required.');
  return roomId;
}

function getPlayerWallet() {
  const fromInput = el('playerWallet').value.trim();
  const player = fromInput || account;
  if (!player) throw new Error('Connect wallet first or enter player wallet.');
  if (!isAddress(player)) throw new Error('Player wallet address invalid.');
  return player;
}

async function loadContract() {
  if (!provider || !signer) {
    setStatus(contractStatus, 'Connect wallet before loading contract.', 'warn');
    return;
  }

  const address = el('contractAddress').value.trim();
  if (!isAddress(address)) {
    setStatus(contractStatus, 'Contract address is invalid.', 'err');
    return;
  }

  try {
    const abi = parseAbi();
    contract = new Contract(address, abi, signer);
    setStatus(contractStatus, `Contract loaded: ${address}`, 'ok');
  } catch (error) {
    setStatus(contractStatus, `Load failed: ${explainError(error)}`, 'err');
  }
}

async function runTx(fn, ...args) {
  if (!contract) {
    setStatus(txStatus, 'Load contract first.', 'warn');
    return;
  }

  const ready = await ensureChain();
  if (!ready) return;

  try {
    setStatus(txStatus, 'Waiting for MetaMask confirmation...', 'warn');
    const tx = await contract[fn](...args);
    setStatus(txStatus, `Submitted: ${tx.hash}. Waiting to confirm...`, 'warn');
    const receipt = await tx.wait();
    setStatus(txStatus, `${fn} success. Tx: ${receipt.hash}`, 'ok');
  } catch (error) {
    setStatus(txStatus, `${fn} failed: ${explainError(error)}`, 'err');
  }
}

async function runRead(fn, ...args) {
  if (!contract) {
    setStatus(txStatus, 'Load contract first.', 'warn');
    return;
  }

  try {
    const result = await contract[fn](...args);
    setStatus(txStatus, `${fn} result: ${result?.toString?.() ?? JSON.stringify(result)}`, 'ok');
  } catch (error) {
    setStatus(txStatus, `${fn} failed: ${explainError(error)}`, 'err');
  }
}

el('connectBtn').addEventListener('click', connectWallet);
el('loadContractBtn').addEventListener('click', loadContract);

el('joinBtn').addEventListener('click', async () => {
  try {
    await runTx('join_room', getRoomId(), getPlayerWallet());
  } catch (error) {
    setStatus(txStatus, error.message, 'err');
  }
});

el('questionBtn').addEventListener('click', async () => {
  try {
    await runRead('get_question', getRoomId());
  } catch (error) {
    setStatus(txStatus, error.message, 'err');
  }
});

el('submitBtn').addEventListener('click', async () => {
  try {
    const answer = el('answer').value.trim();
    if (!answer) throw new Error('Answer is required.');
    await runTx('submit_answer', getRoomId(), getPlayerWallet(), answer);
  } catch (error) {
    setStatus(txStatus, error.message, 'err');
  }
});

el('judgeBtn').addEventListener('click', async () => {
  try {
    await runTx('judge_and_distribute', getRoomId());
  } catch (error) {
    setStatus(txStatus, error.message, 'err');
  }
});

el('xpBtn').addEventListener('click', async () => {
  try {
    await runRead('xp', getPlayerWallet());
  } catch (error) {
    setStatus(txStatus, error.message, 'err');
  }
});

if (requireEth()) {
  window.ethereum.on('accountsChanged', (accounts) => {
    account = accounts?.[0] || null;
    setStatus(walletStatus, account ? `Connected: ${account}` : 'Wallet disconnected', account ? 'ok' : 'warn');
  });
  window.ethereum.on('chainChanged', (chainId) => {
    if (account) setStatus(walletStatus, `Connected: ${account} on chain ${chainId}`, 'ok');
  });
}
