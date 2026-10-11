# Sorot

Panta prediction market odds, right under the tweets people are arguing about. See the market, trade YES or NO, and claim winnings without leaving X.

> Built for the Panta API sidetrack, Colosseum Crypto World's Fair (Oct 13, 2026).

## Overview

Prediction markets are usually experienced as a destination: you have to go to the site. The arguments about the events those markets price happen somewhere else, mostly on X. Sorot brings Panta markets to the argument.

Sorot is a Chrome extension. It reads the tweets in your timeline, matches each one against the Panta market catalog, and only when a match passes verification it shows a small odds chip under the tweet. Clicking the chip opens a trade window where you get a quote, sign with Phantom, and see your position. Every trade carries Sorot's attribution through the Panta API.

The same pattern is proven on Polymarket by extensions like PMs4X. Sorot is the first we found for Panta, and it goes further by letting you trade from the tweet.

## How it works

1. The content script reads each tweet as it appears in the timeline.
2. The API matches the tweet against the Panta catalog: entity prefilter, embedding similarity, then a yes/no verification (a local heuristic by default, or an LLM when `LLM_API_KEY` is set).
3. If the match passes, a chip shows the market and its odds under the tweet. If not, nothing is shown.
4. Clicking the chip opens a hosted trade page: quote, build, sign with Phantom, send.
5. The positions page shows open positions and lets you claim winnings.

## Try it

- Live site: https://sorot-three.vercel.app (landing, trade page, positions page, API)
- Extension: download `sorot-extension-v0.1.0.zip` from the [latest GitHub release](https://github.com/Im-A-Nuel/sorot/releases/latest), unzip it, open `chrome://extensions`, turn on Developer mode, choose Load unpacked and select the unzipped folder. It talks to the live site above.
- Or open the [trade page](https://sorot-three.vercel.app/t/open) directly: it redirects to a market that is open right now.

## Status and proof

Sorot is an early build. This table says what has been checked and what has not.

| Item | Status |
| --- | --- |
| Catalog sync, odds and matching on live Panta markets | Works. Checked against the live API. |
| Real quote and transaction build from Panta | Works. A real quote is shown on the trade page, and the built transaction compiles offline. |
| Chip on a timeline, click to open the trade page | Works in the browser test and in the demo video. The timeline in the video is a simulated X page. |
| Signing in Phantom and sending to Panta | Not yet run on mainnet. The signing code is tested with a stand-in wallet and on devnet, not with a real Panta trade. |
| Trade attribution and claims | Written, not yet exercised with a real trade. |
| Match precision | Not measured on real tweets yet. The target is at least 80% on 50 labeled tweets (`eval/`), and the number will come from `pnpm eval`. |
| Chrome Web Store | Not submitted. Install from the release zip. |

## Panta API usage

| Endpoint | Used for |
| --- | --- |
| `GET /markets/` | Catalog sync |
| `GET /markets/{id}/` | Chip odds and market detail |
| `GET /markets/{id}/trades/` | Recent activity on the trade page |
| `POST /primaryorderquote/` | Quote before buying |
| `POST /primaryorderbuild/` | Instructions to sign, with a slippage limit |
| `POST /primaryordersubmit/` | Register the signature |
| `POST /primaryorderverify/` | Check the trade status |
| `GET /positions/?wallet=` | Positions and claim status |
| `POST /claim/build/` | Instructions to claim winnings |
| `POST /trades/` | Report each trade so it is attributed to Sorot |

## Tech stack

| Layer | Choice |
| --- | --- |
| Extension | Chrome Manifest V3, TypeScript, Vite |
| App + API | Next.js (App Router), route handlers |
| Matching | Local embeddings by default (remote optional), heuristic or LLM verification |
| Wallet | Solana wallet adapter (Phantom) on the hosted trade page |
| Database | Postgres |
| Deploy | Vercel |

## Quick start

Prerequisites: Node 20.12+, pnpm 9+, Chrome. A Panta key, an embedding/LLM key and Postgres are optional: without them Sorot runs on labeled demo fixtures.

```bash
git clone https://github.com/Im-A-Nuel/sorot && cd sorot
pnpm install
pnpm panta:setup                  # creates .env, a Panta account and an API key (or: cp .env.example .env and fill it by hand)
pnpm db:migrate                   # only with DATABASE_URL (Neon)
pnpm dev                          # app, API and trade page on :3000
pnpm --filter extension build:local   # extension that talks to http://localhost:3000/api
```

Load the extension: open `chrome://extensions`, enable Developer mode, click "Load unpacked", select `extension/dist`. Open x.com.

Run the match evaluation:

```bash
pnpm eval                          # prints precision and recall on eval/tweets.jsonl
```

## Project structure

```
sorot/
  frontend/      Next.js app: landing page, trade page /t/[marketId], positions page, API routes (app/api)
  extension/     Chrome MV3: x.com content script and chip, service worker, popup
  packages/
    core/        types, Panta client (live and fixture), matching pipeline, service layer
    db/          Drizzle schema, Postgres store, migrations
  contracts/     placeholder, empty for now
  eval/          labeled tweets + scorer
  docs/          requirements, architecture, schema, roadmap, submission
```

## Security

- The Panta API key lives only on the server. The browser talks to Sorot's API (route handlers in the same app), which proxies an allowlist of Panta routes.
- The extension never stores wallet keys. Signing happens in Phantom on the hosted trade page.

## Docs

- [Requirements](docs/REQUIREMENTS.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Schema and API](docs/SCHEMA.md)
- [Roadmap](docs/ROADMAP.md)
- [Submission kit](docs/SUBMISSION.md)

## License

MIT
