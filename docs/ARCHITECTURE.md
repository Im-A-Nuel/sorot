# System Architecture: Sorot

Last updated: Oct 5, 2026

## Overview

Sorot has two deployables. A Manifest V3 extension only reads tweets and renders chips. One Next.js app serves the landing page, the hosted trade and positions pages where Phantom signs, and the API (route handlers under `/api`) that owns the Panta key and the matching pipeline. The extension never touches keys or the Panta key. The logic lives in `packages/core` and `packages/db`, so the API could move to its own service later without rewriting it.

## System Diagram

```
  x.com tab                                   Sorot app (Next.js, /api)               Panta API
 +---------------------+   MATCH batch    +------------------------------+   proxy   +-------------+
 | content script      |----------------->| /api/match                   |---------->| /markets/   |
 | observe tweets      |   via service    |   prefilter -> embed -> LLM  |           | /markets/id |
 | render chips        |<-----------------|   cache by tweetId (24 h)    |           | /trades/    |
 +----------+----------+   match | null   | catalog sync (5 min)         |           | /positions/ |
            | click chip                  | /api/trade/quote, /build     |---------->| quote, build|
            v                             | /api/positions, /api/claim   |           | claim       |
 +----------+----------+                  +--------------+---------------+           +-------------+
 | popup: /t/[marketId]|  quote / build          |
 | Phantom signs       |------------------------>|   Postgres: markets, embeddings, matches, trades
 | sends to Solana     |---------------------------------------------> Solana mainnet
 +---------------------+
```

## Components

| Component | Responsibility |
| --- | --- |
| `extension` content script | Observe tweets with `MutationObserver`, batch, render chips, open trade popup |
| `extension` service worker | Session cache, backend calls, dedupe |
| `frontend` `/api/match` | Matching pipeline and cache |
| `frontend` catalog sync | Sync `GET /markets/` when older than the TTL (lazily on `/api/match`) and daily through Vercel Cron, hydrate titles, refresh embeddings |
| `frontend` trade routes | Proxy quote, build, positions, claim to Panta with server-side key |
| `frontend` `/t/[marketId]` | Trade page with wallet adapter |
| `frontend` `/positions` | Positions and claims |
| `packages/core` | Panta client (live and fixture), matching pipeline, service layer, money helpers |
| `packages/db` | Drizzle schema, Postgres store, migrations |
| `eval/` | Labeled tweets and scorer |

## Matching pipeline

```
tweet text
  -> normalize (strip urls, handles, emojis)
  -> entity prefilter (tickers, names, dates vs catalog entity index)   stop if no overlap
  -> embedding similarity vs market titles                             keep top-1 >= threshold
  -> LLM verification: "same event? yes/no"                            stop unless clear yes
  -> match { marketId, title, yesPrice, noPrice }
```

The catalog is small (about 86 markets during research), so every market title is embedded once and the vectors are cached in Postgres per model. A cold serverless instance reloads them instead of recomputing.

## Tech Stack

### Extension
- Chrome Manifest V3, TypeScript, Vite build
- Permissions: `storage`, host `https://x.com/*`, Sorot backend origin

### Backend and pages
- Next.js App Router, route handlers, Zod validation, Tailwind CSS v4
- The injected Phantom provider on the trade and positions pages, and `@solana/web3.js` to compile Panta's instructions

### Matching
- Embedding API for title and tweet vectors
- Small LLM for yes/no verification, called only for candidates that pass similarity

### Database
- Neon Postgres via Drizzle (HTTP driver, built for serverless): catalog, embeddings, match cache, trade attempts, claims

### Infrastructure
- One Vercel project for the app and the API; a daily cron route for catalog sync
- Extension distributed as a GitHub release and an unlisted Chrome Web Store listing

## Key Design Decisions

- Decision: signing on a hosted page, not inside the extension.
  - Reason: Phantom injects its provider into normal web pages, not extension pages.
  - Alternatives: bundle a wallet in the extension. Rejected: custody and security burden.
- Decision: precision over recall.
  - Reason: one wrong chip destroys trust faster than ten tweets without a chip.
- Decision: LLM only after embedding similarity.
  - Reason: keeps cost and latency low; most tweets stop at the prefilter.
- Decision: server-side Panta proxy with a route allowlist.
  - Reason: the API key never reaches the browser and the proxy cannot be abused to hit arbitrary Panta routes.
- Decision: no automatic market creation.
  - Reason: each market costs real USDC; creation must be an explicit user choice (P1).

## Security Considerations

| Threat | Mitigation |
| --- | --- |
| Panta key leak | Key server-only, route allowlist, rate limit per client |
| Malicious backend response injecting HTML | Chip renders text nodes only, no `innerHTML` |
| Wrong market shown | Verification step, never show closed markets, eval set in CI |
| Overbroad extension permissions | Only x.com and Sorot backend hosts |
| User loses money on a misleading chip | Chip shows only API data and links to the full market page before trade |
| Legal exposure in Indonesia | Not promoted to Indonesian users for real-money trading; read-only mode (P1) |

## Scalability Plan

- Match cache per tweet id absorbs repeated views of viral tweets.
- Catalog embeddings recomputed only for changed markets.
- If the catalog grows past a few thousand markets, move vectors to pgvector.
