const connectBtn = document.getElementById('connectBtn');
const sendBtn = document.getElementById('sendBtn');

const walletStatus = document.getElementById('walletStatus');
const txStatus = document.getElementById('txStatus');

const toInput = document.getElementById('to');
const amountInput = document.getElementById('amount');
const dataInput = document.getElementById('data');
const networkInput = document.getElementById('network');

let selectedAccount = null;

function setStatus(el, message, type = '') {
  el.className = `status ${type}`.trim();
  el.textContent = message;
}

function requireEthereum() {
  if (!window.ethereum) {
    setStatus(walletStatus, 'MetaMask not found. Please install MetaMask extension first.', 'err');
    return null;
  }
  return window.ethereum;
}

function isAddress(value) {
  return /^0x[a-fA-F0-9]{40}$/.test(value);
}

function ethToWeiHex(ethString) {
  if (!/^\d+(\.\d{1,18})?$/.test(ethString)) {
    throw new Error('Amount must be a valid ETH value with up to 18 decimals.');
  }

  const [whole, frac = ''] = ethString.split('.');
  const wholeWei = BigInt(whole) * 10n ** 18n;
  const fracPadded = (frac + '0'.repeat(18)).slice(0, 18);
  const fracWei = BigInt(fracPadded || '0');
  const wei = wholeWei + fracWei;

  if (wei < 0n) {
    throw new Error('Amount cannot be negative.');
  }

  return `0x${wei.toString(16)}`;
}

async function connectWallet() {
  const ethereum = requireEthereum();
  if (!ethereum) return;

  try {
    const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
    if (!accounts || accounts.length === 0) {
      setStatus(walletStatus, 'No account returned from MetaMask.', 'err');
      return;
    }

    selectedAccount = accounts[0];
    const chainId = await ethereum.request({ method: 'eth_chainId' });
    setStatus(walletStatus, `Connected: ${selectedAccount} on chain ${chainId}`, 'ok');
  } catch (error) {
    setStatus(walletStatus, explainRpcError(error), 'err');
  }
}

async function ensureNetwork(targetChainId) {
  const ethereum = requireEthereum();
  if (!ethereum) return false;

  const currentChainId = await ethereum.request({ method: 'eth_chainId' });
  if (currentChainId === targetChainId) {
    return true;
  }

  try {
    await ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: targetChainId }],
    });
    return true;
  } catch (switchError) {
    setStatus(txStatus, `Failed to switch network: ${explainRpcError(switchError)}`, 'err');
    return false;
  }
}

function explainRpcError(error) {
  const code = error?.code;
  if (code === 4001) return 'User rejected the request.';
  if (code === -32002) return 'Request already pending in MetaMask. Open MetaMask and complete it.';
  if (code === -32603) return 'Internal provider error. Check MetaMask account/network and retry.';
  return error?.message || 'Unknown wallet error.';
}

async function sendTransaction() {
  const ethereum = requireEthereum();
  if (!ethereum) return;

  if (!selectedAccount) {
    setStatus(txStatus, 'Connect wallet first.', 'warn');
    return;
  }

  const to = toInput.value.trim();
  const amount = amountInput.value.trim();
  const data = dataInput.value.trim();
  const targetChainId = networkInput.value;

  if (!isAddress(to)) {
    setStatus(txStatus, 'Recipient address is invalid.', 'err');
    return;
  }

  let value;
  try {
    value = ethToWeiHex(amount || '0');
  } catch (error) {
    setStatus(txStatus, error.message, 'err');
    return;
  }

  if (data && !/^0x([a-fA-F0-9]{2})*$/.test(data)) {
    setStatus(txStatus, 'Data must be hex and start with 0x.', 'err');
    return;
  }

  sendBtn.disabled = true;
  setStatus(txStatus, 'Preparing transaction...', 'warn');

  try {
    const networkReady = await ensureNetwork(targetChainId);
    if (!networkReady) return;

    const txParams = {
      from: selectedAccount,
      to,
      value,
    };

    if (data) txParams.data = data;

    const txHash = await ethereum.request({
      method: 'eth_sendTransaction',
      params: [txParams],
    });

    const chainId = await ethereum.request({ method: 'eth_chainId' });
    setStatus(
      txStatus,
      `Transaction submitted successfully. Hash: ${txHash} (chain ${chainId})`,
      'ok'
    );
  } catch (error) {
    setStatus(txStatus, `Transaction failed: ${explainRpcError(error)}`, 'err');
  } finally {
    sendBtn.disabled = false;
  }
}

connectBtn.addEventListener('click', connectWallet);
sendBtn.addEventListener('click', sendTransaction);

const ethereum = requireEthereum();
if (ethereum) {
  ethereum
    .request({ method: 'eth_accounts' })
    .then((accounts) => {
      if (accounts && accounts.length > 0) {
        selectedAccount = accounts[0];
        return ethereum.request({ method: 'eth_chainId' });
      }
      return null;
    })
    .then((chainId) => {
      if (selectedAccount && chainId) {
        setStatus(walletStatus, `Connected: ${selectedAccount} on chain ${chainId}`, 'ok');
      }
    });

  ethereum.on('accountsChanged', (accounts) => {
    if (!accounts || accounts.length === 0) {
      selectedAccount = null;
      setStatus(walletStatus, 'Wallet disconnected in MetaMask.', 'warn');
      return;
    }

    selectedAccount = accounts[0];
    setStatus(walletStatus, `Connected: ${selectedAccount}`, 'ok');
  });

  ethereum.on('chainChanged', (chainId) => {
    if (selectedAccount) {
      setStatus(walletStatus, `Connected: ${selectedAccount} on chain ${chainId}`, 'ok');
    }
  });
}
