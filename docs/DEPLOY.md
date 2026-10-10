# Deploying Sorot

One Vercel project serves the landing page, the trade and positions pages, and the API (`/api`). The extension is a separate zip. Postgres lives on Neon.

Do the steps in order. Each ends with a check.

## 0. Before you start

- The repo is on GitHub and `main` has everything (`https://github.com/Im-A-Nuel/sorot`).
- You have a Panta key in `.env` (`pnpm panta:setup`). A `pk_live_` key serves real markets. A `pk_test_` key serves one fake sandbox market.

## 1. Neon database

1. Create a project at neon.com (the free plan is enough).
2. Copy the **pooled** connection string. It looks like `postgresql://user:pass@ep-xxxx-pooler.region.aws.neon.tech/neondb?sslmode=require`.
3. Put it in your local `.env` as `DATABASE_URL=...`, then create the tables:
   ```bash
   pnpm db:migrate
   ```
4. Check: in the Neon SQL editor, `select count(*) from markets;` runs without an error (it returns 0).

## 2. Vercel project

1. Vercel dashboard → **Add New → Project** → import `Im-A-Nuel/sorot`.
2. **Root Directory:** `frontend`. Leave "Include source files outside of the Root Directory" **on**, because the app imports `packages/core` and `packages/db`.
3. Framework preset: Next.js (detected). Install and build commands: leave the defaults.
4. **Environment Variables** (Production). Names only, set the values yourself:

   | Name | Value |
   | --- | --- |
   | `PANTA_API_BASE` | `https://live-api.panta.market/api/v1` |
   | `PANTA_API_KEY` | your `pk_live_...` key |
   | `PANTA_ATTRIBUTION_ID` | your `usr_...` id |
   | `DATABASE_URL` | the Neon pooled string |
   | `CRON_SECRET` | a long random string (for example `openssl rand -hex 32`) |
   | `LLM_API_KEY` | optional, an Anthropic key for LLM verification |
   | `LLM_MODEL` | optional, defaults to `claude-haiku-5-5` |

   Do **not** set `ENABLE_SIM` or `PANTA_FORCE_FIXTURES` in production. Do not prefix any of these with `NEXT_PUBLIC_`.
5. Deploy. The first build takes a few minutes.
6. `frontend/vercel.json` registers a daily cron that calls `/api/cron/sync` with `Authorization: Bearer $CRON_SECRET`. The catalog also refreshes by itself on `/api/match` when it is older than 5 minutes, so the daily cron is a safety net.

## 3. Check the deployment

```bash
node frontend/tests/deploy-check.mjs https://YOUR-APP.vercel.app
```

It prints PASS, WARN or FAIL per item. FAIL needs fixing. WARN means you are not fully live yet (for example the key is a sandbox key, or the database is still in memory). Open the site and click **Try the trade page**: it should open a real, open market.

## 4. Extension release

The extension must be built against the deployed API so chips use live data and the trade popup opens your site:

```bash
pnpm --filter extension package -- --api https://YOUR-APP.vercel.app/api
```

This writes `extension/release/sorot-extension-v0.1.0.zip`. Then:

1. GitHub → **Releases → Draft a new release**, tag `v0.1.0`, attach the zip.
2. Put the release link in the landing page `Install guide` section and in the README "Mainnet proof" table.
3. To try it: unzip, open `chrome://extensions`, turn on Developer mode, **Load unpacked**, choose the folder.

The package script refuses to run without `--api`, because that build would only use the demo matcher.

A Chrome Web Store listing needs a review that can take days, so it will not be ready for the deadlines. Upload the same zip later if you want one.

## 5. First real trade (the proof)

1. Open the deployed site, then **Try the trade page**. Pick YES or NO, enter a small amount, and connect Phantom.
2. Get a quote, press **Approve in Phantom**, and check the details in the wallet popup before signing. This spends real USDC.
3. After it confirms, copy the transaction link from the success panel into the README proof table.
4. Open **Positions** and check the trade appears. After the market resolves, claim and add that link too.

## Troubleshooting

| Symptom | Likely cause |
| --- | --- |
| Install fails with `ERR_PNPM_IGNORED_BUILDS` | `pnpm-workspace.yaml` needs `allowBuilds` entries set to `true` or `false` |
| `/api/health` says `panta: "sandbox"` | The key is `pk_test_`. Make a live key: `pnpm panta:setup -- --env live --force` |
| `/api/health` says `database: "memory"` | `DATABASE_URL` is missing in Vercel |
| Chips show "see odds" | Panta had no price for that market at that moment. It comes back by itself |
| Quote fails with "Panta could not read this market" | Panta cannot read the market on-chain right now. Retrying works |
| No chips at all | Only a few markets are open. Check `/api/health` for `open` and `indexed` |
