# Database and API Design: Sorot

Last updated: Oct 5, 2026

USDC amounts are `bigint` base units (6 decimals). Prices are kept as strings exactly as returned by Panta.

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
| market_id | text | PK, FK markets.id | |
| model | text | NOT NULL | Embedding model id |
| vector | real[] | NOT NULL | Embedding of `title` |
| title_hash | text | NOT NULL | Recompute only when the title changes |

### market_entities
| Field | Type | Constraint | Description |
| --- | --- | --- | --- |
| market_id | text | FK markets.id | |
| entity | text | NOT NULL | Lowercased ticker, name, or date token |
| PRIMARY KEY | | (market_id, entity) | |

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
| tweet_id | text | NULL | Origin tweet |
| market_id | text | FK markets.id | |
| wallet | text | NOT NULL | |
| side | text | CHECK in ('yes','no') | |
| amount | bigint | NOT NULL | USDC base units |
| quote | jsonb | NOT NULL | Raw Panta quote |
| signature | text | NULL, UNIQUE | Set after send |
| status | text | CHECK in ('quoted','built','sent','confirmed','failed') | |
| created_at | timestamptz | DEFAULT now() | |

### wallet_labels
| Field | Type | Constraint | Description |
| --- | --- | --- | --- |
| wallet | text | PRIMARY KEY | |
| is_team | boolean | NOT NULL | Excluded from traction counts |

---

## Sorot Backend API

Base URL: `https://sorot.<domain>/api`. Requests from the extension include `X-Sorot-Client: <install id>` for per-client rate limiting.

**POST /match**
- Request: `{ "tweets": [{ "tweetId": "1840...", "text": "...", "lang": "en" }] }` (max 20 per batch)
- Response:
```json
{ "results": [{ "tweetId": "1840...", "match": { "marketId": "abc", "title": "Will SOL close above $300 on Oct 31?", "yesPrice": "0.62", "noPrice": "0.38", "url": "https://..." } }] }
```
`match` is `null` when no chip should be shown.

**GET /markets/:id**
- Response: market row plus recent trades from Panta.

**POST /trade/quote**
- Request: `{ "marketId": "abc", "side": "yes", "amountUsdc": "5000000", "wallet": "...", "tweetId": "1840..." }`
- Response: `{ "attemptId": "uuid", "quote": { "...": "raw Panta quote" } }`

**POST /trade/build**
- Request: `{ "attemptId": "uuid" }`
- Response: `{ "transaction": "<base64>" }` (attribution attached server-side)

**POST /trade/confirm**
- Request: `{ "attemptId": "uuid", "signature": "..." }`
- Response: `{ "status": "confirmed" }`. Forwards a report to Panta if the API requires one.

**GET /positions?wallet=**
- Response: positions from Panta plus claimability.

**POST /claim/build**
- Request: `{ "wallet": "...", "marketId": "abc" }`
- Response: `{ "transaction": "<base64>" }`

### Error Response Format
```json
{ "error": { "code": "PANTA_UPSTREAM", "message": "Panta returned 429", "retryAfterMs": 2000 } }
```
Codes: `INVALID_PARAMS`, `NOT_FOUND`, `MARKET_CLOSED`, `PANTA_UPSTREAM`, `RATE_LIMITED`.

---

## Panta API mapping

Base URL `https://live-api.panta.market/api/v1`, trailing slash required, auth header `X-Api-Key`. Route names come from other participants' public repos; verify each at docs.panta.market when the API key is issued.

| Sorot route | Panta route | Notes |
| --- | --- | --- |
| catalog job | `GET /markets/` | Cursor pagination, filter by status and category |
| `GET /markets/:id` | `GET /markets/{id}/`, `GET /markets/{id}/trades/` | Prices may be null |
| `POST /trade/quote` | `POST /primaryorderquote/` | |
| `POST /trade/build` | `POST /primaryorderbuild/` | Attach attribution id |
| `GET /positions` | `GET /positions/?wallet=` | Also used to hydrate titles |
| `POST /claim/build` | Claim build endpoint | Name to confirm in docs |
| P1 draft market | `POST /markets/create/quote/` | Creation costs 50 USDC (40 fee + 10 liquidity) |

Known quirks to handle: empty titles for app-created markets, `null` prices for secondary or resolved markets, `null` volume, `pk_test_` and `pk_live_` keys both accepted on production, around 100 requests per minute before 429.

---

## Extension message protocol

| Direction | Message | Payload |
| --- | --- | --- |
| content to SW | `MATCH_REQUEST` | `{ tweets: [{ tweetId, text, lang }] }` |
| SW to content | `MATCH_RESULT` | `{ tweetId, match \| null }` |
| content to SW | `OPEN_TRADE` | `{ marketId, tweetId, side? }` |
| SW | `chrome.windows.create` | `{ url: APP_URL + "/t/" + marketId + "?tweet=" + tweetId, type: "popup", width: 420, height: 640 }` |

---

## Eval set format (`eval/tweets.jsonl`)

```json
{"tweetId": "1840000000000000001", "text": "SOL is going to rip past 300 before Halloween", "expectedMarketId": "abc"}
{"tweetId": "1840000000000000002", "text": "gm, coffee first", "expectedMarketId": null}
```
Precision = correct non-null matches / all non-null matches. Recall = correct non-null matches / all rows with a non-null expected market.
