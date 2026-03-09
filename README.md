# AI Jury Web dApp (Vercel + MetaMask)

Sorry for the previous generic sender page — this version is now focused on the **AI Jury game workflow**.

## What this app does

This web app gives direct UI actions for the AI Jury contract flow:
- Connect MetaMask
- Load AI Jury contract (address + ABI)
- `join_room` (transaction)
- `get_question` (read)
- `submit_answer` (transaction)
- `judge_and_distribute` (transaction)
- `xp(wallet)` (read)

## Files

- `index.html` — AI Jury UI
- `styles.css` — styling
- `app.js` — MetaMask + contract logic using ethers v6
- `vercel.json` — static deploy config for Vercel

## Deploy to Vercel

1. Push this repo to GitHub.
2. Import to Vercel.
3. Framework: **Other**.
4. Deploy (no build command needed).

## Local run

```bash
python3 -m http.server 4173
```

Open `http://localhost:4173`.

## Important contract note

The default ABI in the UI is a starter ABI for common AI Jury method names.
If your deployed contract ABI differs, paste the real ABI in the app before clicking **Load Contract**.

## MetaMask reliability checks included

- Detect missing MetaMask
- Validate contract and wallet address format
- Network switch with `wallet_switchEthereumChain`
- Clear handling for common wallet errors (`4001`, `-32002`)
- Await on-chain confirmation for write transactions
