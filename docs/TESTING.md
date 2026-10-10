# Testing without real money

Three levels, from fully offline to a free devnet transaction. Nothing here spends USDC.

## 1. Demo data (built-in fixtures)

Run the whole app with fake markets. Nothing is sent to Panta.

```bash
PANTA_FORCE_FIXTURES=1 pnpm dev          # macOS, Linux, Git Bash
$env:PANTA_FORCE_FIXTURES=1; pnpm dev    # PowerShell
```

Open `http://localhost:3000/t/open`. Connect Phantom, get a quote, press **Approve in Phantom**. Phantom signs a harmless text message, not a transaction. The page says **Demo data** at the top and **Demo trade confirmed** at the end.

Failure paths can be forced with `?sim=` on the trade page: `rate-limit`, `slippage`, `tx-failed`, `short-quote`, `market-error`.

## 2. Panta sandbox (`pk_test_` key)

A `pk_test_` key makes Panta answer with sandbox fixtures: one fake market, fake quotes, empty instructions. It never touches mainnet. Create one with `pnpm panta:setup` (the default is a `test` key). The app labels it **Demo data** with the sandbox explanation.

## 3. Devnet wallet check (free Solana devnet transaction)

Proves that Phantom can sign and send a transaction built by the same code real trades use (`approveInWallet`), without Panta and without USDC. It sends a Memo transaction on devnet.

1. Phantom → Settings → Developer Settings → **Testnet Mode** on → choose **Solana Devnet**.
2. Get free devnet SOL at https://faucet.solana.com.
3. `pnpm dev`, then open `http://localhost:3000/dev/wallet-check`.
4. Connect Phantom, press **Send a devnet memo**. Phantom should show only a Memo and no balance change. Approve it.
5. The page shows each step and a Solana Explorer (devnet) link.

The page returns 404 in production builds. To include it in a private preview, set `ENABLE_DEV_TOOLS=1` at build time.

Turn Testnet Mode off again before using Sorot with real markets.

## What is not covered without money

Only a real mainnet trade proves the last steps: Panta accepting the submitted signature and reporting the trade for attribution. Panta has no devnet, so this cannot be tested for free. The smallest amount Panta quotes is 0.01 USDC.

## Automated tests

| Command | What it covers |
| --- | --- |
| `pnpm --filter @sorot/core test` | Panta client, response shapes captured from the live API, matching, service layer |
| `pnpm --filter @sorot/db test` | Postgres store and migrations on an embedded Postgres |
| `pnpm --filter extension test` | Extension logic and the packaging script |
| `pnpm --filter extension test:e2e` | Extension in Chromium against a fake X timeline (needs the dev server and `npx playwright-core install chromium`) |
| `pnpm --filter frontend test:api` | API contract against a running server with `PANTA_FORCE_FIXTURES=1` |
| `pnpm --filter frontend test:e2e` | Trade and positions pages in Chrome with a fake Phantom, plus accessibility (axe). Needs Chrome and the fixtures dev server |
| `pnpm --filter frontend test:wallet` | The devnet wallet-check page: transaction shape, rejection and RPC failure |
| `pnpm --filter frontend test:deploy -- <url>` | Post-deploy checks |
