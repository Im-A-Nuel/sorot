# Database and API Design: Sorot

Last updated: Oct 9, 2026

Panta and the Sorot API exchange USDC amounts and prices as decimal strings (for example `"20.00"`, `"0.62"`). Sorot parses them with integer math, never floats. Only `trade_attempts.amount` is stored as `bigint` base units (6 decimals).

## Database Schema

### markets
| Field | Type | Constraint | Description |
| --- | --- | --- | --- |
| id | text | PRIMARY KEY | Panta market id |
| title_raw | text | NULL | Title from `GET /markets/` (often empty) |
| title | text | NOT NULL | Hydrated title used for matching |
| category | text | NULL | |
| status | text | NOT NULL | Open, closed, resolved (as Panta reports) |
| yes_price | text | NULL | Null for secondary or resolved markets |
| no_price | text | NULL | |
| volume_usdc | text | NULL | Often null or zero |
| url | text | NOT NULL | Public market page |
| updated_at | timestamptz | NOT NULL | Last sync |

### market_embeddings
| Field | Type | Constraint | Description |
| --- | --- | --- | --- |
| market_id | text | PK (with model), FK markets.id | |
| model | text | PK (with market_id) | Embedding model id. Vectors are cached per model |
| vector | real[] | NOT NULL | Embedding of `title` |
| title_hash | text | NOT NULL | Recompute only when the title changes |

There is no `market_entities` table. Entities are derived from the title when the matcher indexes the catalog, which is cheap for a few hundred markets.

### tweet_matches
| Field | Type | Constraint | Description |
| --- | --- | --- | --- |
| tweet_id | text | PRIMARY KEY | |
| market_id | text | NULL, FK markets.id | Null means no chip |
| similarity | real | NULL | |
| verified | boolean | NOT NULL | LLM verdict |
| stage | text | CHECK in ('prefilter','similarity','verify','match') | Where the pipeline stopped |
| created_at | timestamptz | DEFAULT now() | Cache for 24 h |

### trade_attempts
| Field | Type | Constraint | Description |
| --- | --- | --- | --- |
| id | uuid | PRIMARY KEY | |
| quote_id | text | NOT NULL, UNIQUE | Panta quote id |
| tweet_id | text | NULL | Origin tweet |
| market_id | text | NOT NULL | |
| wallet | text | NOT NULL | |
| side | text | CHECK in ('yes','no') | |
| amount | bigint | NOT NULL | USDC base units |
| quote | jsonb | NOT NULL | Normalized quote |
| signature | text | NULL, UNIQUE | Set after submit |
| status | text | CHECK in ('quoted','built','sent','confirmed','failed') | |
| created_at | timestamptz | DEFAULT now() | |

### wallet_labels
| Field | Type | Constraint | Description |
| --- | --- | --- | --- |
| wallet | text | PRIMARY KEY | |
| is_team | boolean | NOT NULL | Excluded from traction counts |

### claims
| Field | Type | Constraint | Description |
| --- | --- | --- | --- |
| wallet | text | PK (with market_id) | |
| market_id | text | PK (with wallet) | |
| claimed_at | timestamptz | DEFAULT now() | Lets demo claims persist. Live claims are reflected by Panta itself |

### meta
| Field | Type | Constraint | Description |
| --- | --- | --- | --- |
| key | text | PRIMARY KEY | For example `catalog_synced_at` |
| value | text | NOT NULL | |

Migrations live in `packages/db/drizzle`. Run `pnpm db:migrate` with `DATABASE_URL` set.

---

## Sorot API

The API is Next.js route handlers in `frontend/app/api`, on the same origin as the trade page. The extension calls it at `https://<app>/api` with `X-Sorot-Client: <install id>` for per-client rate limiting. Without `PANTA_API_KEY` the API serves built-in fixtures and marks them `demo: true`.

**GET /api/health**
- Response: `{ ok, demo, panta: "live"|"fixture", embedder, verifier, threshold, database: "postgres"|"memory", markets, open, indexed, catalogSyncedAt }`. Never contains a key.

**POST /api/match**
- Request: `{ "tweets": [{ "tweetId": "1840...", "text": "...", "lang": "en" }] }` (1 to 20 tweets)
- Response:
```json
{ "results": [{ "tweetId": "1840...", "match": { "marketId": "abc", "title": "Will SOL close above $300 on Oct 31?", "yesPrice": "0.62", "noPrice": "0.38", "url": "https://...", "demo": true } }] }
```
`match` is `null` when no chip should be shown. Prices are `null` when Panta has none. `demo` is only present for fixtures. Results are cached per tweet for 24 hours.

**GET /api/markets/:id**
- Response: `{ id, title, category, status, yesPrice, noPrice, url, demo? }`. The title is hydrated when Panta's is empty.

**GET /api/markets/:id/trades**
- Response: array of `{ id, wallet, side, amountUsdc, at }`.

**POST /api/trade/quote**
- Request: `{ "marketId": "abc", "side": "yes", "amountUsdc": "5", "wallet": "...", "tweetId": "1840..." }`
- Response: `{ quoteId, marketId, side, amountUsdc, shares, avgPrice, feeUsdc, maxSlippageBps, expiresAt }`. A quote lives about 90 seconds.

**POST /api/trade/build**
- Request: `{ "quoteId": "...", "maxSlippageBps": 100, "wallet": "..." }`
- Response: `{ quoteId, instructions: [...], recentBlockhash }`. The client compiles a versioned transaction, signs and sends it with Phantom. Panta does not broadcast.

**POST /api/trade/submit**
- Request: `{ "signature": "...", "wallet": "...", "marketId": "abc", "quoteId": "..." }`
- Registers the signature with Panta (`/primaryordersubmit/`) and reports the trade for attribution (`POST /trades/`). A `quoteId` starting with `claim:` marks a claim.
- Response: `{ "ok": true }`

**GET /api/trade/verify?signature=**
- Response: `{ "status": "pending" | "confirmed" | "failed" }`

**GET /api/positions?wallet=**
- Response: array of `{ marketId, marketTitle, side, shares, avgPrice, costUsdc, status: "open"|"won"|"lost"|"claimed", claimable }`.

**POST /api/claim/build**
- Request: `{ "wallet": "...", "marketId": "abc" }`
- Response: `{ quoteId: "claim:<marketId>", instructions, recentBlockhash }`

**GET /api/cron/sync**
- Forces a catalog sync. Needs `Authorization: Bearer $CRON_SECRET` (required in production). Response: `{ ok, stats: { total, open, emptyTitles, hydrated, stillEmpty } }`.

### Error Response Format
```json
{ "error": { "code": "PANTA_UPSTREAM", "message": "Panta returned 429", "retryAfterMs": 2000 } }
```
| Code | HTTP | Meaning |
| --- | --- | --- |
| `INVALID_PARAMS` | 400 | Body or query failed validation |
| `NOT_FOUND` | 404 | Unknown market |
| `MARKET_CLOSED` | 409 | Market is not open |
| `QUOTE_EXPIRED` | 409 | Quote lived past its window |
| `SLIPPAGE` | 409 | Price moved beyond `maxSlippageBps` |
| `NOT_CLAIMABLE` | 409 | Position cannot be claimed |
| `TX_FAILED` | 422 | Transaction did not complete |
| `RATE_LIMITED` | 429 | Per-client limit, or Panta's. Has `Retry-After` |
| `PANTA_UPSTREAM` | 502 | Panta failed or is unreachable |

### Development failure simulation
Outside production (or with `ENABLE_SIM=1`) the header `x-sorot-sim` forces a failure, and the pages pass `?sim=` from their URL: `rate-limit`, `slippage`, `tx-failed`, `market-error`, `short-quote`.

---

## Panta API mapping

Base URL `https://live-api.panta.market/api/v1`, trailing slash required, auth header `X-Api-Key` (or `Authorization: Bearer`). Keys start with `pk_test_` or `pk_live_`. The base URL, auth, quote, build, submit, verify, claim build and trade report routes are confirmed in the Panta docs. The catalog, market detail and positions paths come from other participants' public repos and are confirmed when the key is issued (`pnpm --filter @sorot/core probe` prints the real shapes).

| Sorot route | Panta route | Notes |
| --- | --- | --- |
| catalog sync | `GET /markets/` | Cursor pagination. Titles are often empty |
| `GET /api/markets/:id` | `GET /markets/{id}/` | Prices may be null |
| `POST /api/trade/quote` | `POST /primaryorderquote/` | Amounts are decimal strings. Opens a `quoteId` session of about 90 seconds |
| `POST /api/trade/build` | `POST /primaryorderbuild/` | Returns `instructions` and `recentBlockhash`. Rejects past `maxSlippageBps` |
| `POST /api/trade/submit` | `POST /primaryordersubmit/` | Client broadcasts, Panta only registers the signature |
| `GET /api/trade/verify` | `POST /primaryorderverify/` | |
| `POST /api/trade/submit` (report) | `POST /trades/` | `signature`, `wallet`, `marketId`, optional `quoteId`, `userId`. Idempotent per signature. Also used for win claims |
| `GET /api/positions` | `GET /positions/?wallet=` | Has a `claimable` field |
| `POST /api/claim/build` | `POST /claim/build/` | `{ wallet, marketId }`. Errors include `NOT_CLAIMABLE` |
| P1 draft market | `POST /markets/create/quote/` | Creation costs 50 USDC (40 fee + 10 liquidity) |

Attribution: Sorot sends `userId` (or the `X-User-Id` header) set to `PANTA_ATTRIBUTION_ID`. Build may add an SPL Memo instruction when it is present.

Known quirks to handle: empty titles for app-created markets, `null` prices for secondary or resolved markets, `null` volume, `pk_test_` and `pk_live_` keys both accepted on production, about 100 requests per minute before 429.

---

## Extension message protocol

| Direction | Message | Payload |
| --- | --- | --- |
| content to SW | `MATCH_REQUEST` | `{ tweets: [{ tweetId, text, lang }] }` |
| SW to content | response | `{ ok: true, results: [{ tweetId, match \| null }] }` or `{ ok: false, error }` |
| content to SW | `OPEN_TRADE` | `{ marketId, tweetId, side? }` |
| SW | `chrome.windows.create` | `{ url: APP_URL + "/t/" + marketId + "?tweet=" + tweetId + "&side=" + side, type: "popup", width: 420, height: 640 }` |

---

## Eval set format (`eval/tweets.jsonl`)

```json
{"tweetId": "1840000000000000001", "text": "SOL is going to rip past 300 before Halloween", "expectedMarketId": "abc"}
{"tweetId": "1840000000000000002", "text": "gm, coffee first", "expectedMarketId": null}
```
Precision = correct non-null matches / all non-null matches. Recall = correct non-null matches / all rows with a non-null expected market. Rows with `expectedMarketId` set to `"TODO"` are placeholders and are skipped. Run `pnpm eval`; it writes `eval/results.json`.
