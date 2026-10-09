# Sorot

Panta prediction market odds, right under the tweets people are arguing about. See the market, trade YES or NO, and claim winnings without leaving X.

> Built for the Panta API sidetrack, Colosseum Crypto World's Fair (Oct 13, 2026).

## Overview

Prediction markets are usually experienced as a destination: you have to go to the site. The arguments about the events those markets price happen somewhere else, mostly on X. Sorot brings Panta markets to the argument.

Sorot is a Chrome extension. It reads the tweets in your timeline, matches each one against the Panta market catalog, and only when a match passes verification it shows a small odds chip under the tweet. Clicking the chip opens a trade window where you get a quote, sign with Phantom, and see your position. Every trade carries Sorot's attribution through the Panta API.

The same pattern is proven on Polymarket by extensions like PMs4X. Sorot is the first we found for Panta, and it goes further by letting you trade from the tweet.

## How it works

1. The content script reads each tweet as it appears in the timeline.
2. The API matches the tweet against the Panta catalog: entity prefilter, embedding similarity, LLM yes/no verification.
3. If the match passes, a chip shows the market and its odds under the tweet. If not, nothing is shown.
4. Clicking the chip opens a hosted trade page: quote, build, sign with Phantom, send.
5. The positions page shows open positions and lets you claim winnings.

## Mainnet proof

| Item | Link |
| --- | --- |
| Trade placed from a tweet | TODO |
| Claim | TODO |
| Match precision on 50 labeled tweets | TODO% (see `eval/`) |
| Extension download | TODO (GitHub release / Chrome Web Store) |

## Panta API usage

| Endpoint | Used for |
| --- | --- |
| `GET /markets/` | Catalog sync |
| `GET /markets/{id}/` | Chip odds and market detail |
| `GET /markets/{id}/trades/` | Recent activity on the trade page |
| `POST /primaryorderquote/` | Quote before buying |
| `POST /primaryorderbuild/` | Transaction to sign |
| `GET /positions/?wallet=` | Positions and claim status |
| Claim build | Claim winnings |
| Trade attribution | Every trade attributed to Sorot |

## Tech stack

| Layer | Choice |
| --- | --- |
| Extension | Chrome Manifest V3, TypeScript, Vite |
| App + API | Next.js (App Router), route handlers |
| Matching | Embedding API + small LLM for verification |
| Wallet | Solana wallet adapter (Phantom) on the hosted trade page |
| Database | Postgres |
| Deploy | Vercel |

## Quick start

Prerequisites: Node 20.12+, pnpm 9+, Chrome. A Panta key, an embedding/LLM key and Postgres are optional: without them Sorot runs on labeled demo fixtures.

```bash
git clone https://github.com/<you>/sorot && cd sorot
pnpm install
cp .env.example .env              # optional: Panta key, LLM key, DATABASE_URL
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
