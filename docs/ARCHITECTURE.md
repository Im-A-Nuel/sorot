# System Architecture: Sorot

Last updated: Oct 5, 2026

## Overview

Sorot has three parts: a Manifest V3 extension that only reads tweets and renders chips, a Next.js backend that owns the Panta API key and the matching pipeline, and a hosted trade page where Phantom signs. The extension never touches keys or the Panta key.

## System Diagram

```
  x.com tab                                   Sorot backend (Next.js)                 Panta API
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
| `apps/extension` content script | Observe tweets with `MutationObserver`, batch, render chips, open trade popup |
| `apps/extension` service worker | Session cache, backend calls, dedupe |
| `apps/web` `/api/match` | Matching pipeline and cache |
| `apps/web` catalog job | Sync `GET /markets/` every 5 min, hydrate titles, refresh embeddings |
| `apps/web` trade routes | Proxy quote, build, positions, claim to Panta with server-side key |
| `apps/web` `/t/[marketId]` | Trade page with wallet adapter |
| `apps/web` `/positions` | Positions and claims |
| `packages/core/match` | Prefilter, embedding similarity, LLM verification |
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

The catalog is small (about 86 markets during research), so every market title is embedded and kept in memory on the server.

## Tech Stack

### Extension
- Chrome Manifest V3, TypeScript, Vite build
- Permissions: `storage`, host `https://x.com/*`, Sorot backend origin

### Backend and pages
- Next.js App Router, route handlers, Zod validation
- Solana wallet adapter with Phantom on the trade page
- Tailwind CSS

### Matching
- Embedding API for title and tweet vectors
- Small LLM for yes/no verification, called only for candidates that pass similarity

### Database
- Postgres via Drizzle: catalog, embeddings, match cache, trade attempts, eval runs

### Infrastructure
- Vercel for backend and pages; a cron route for catalog sync
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
