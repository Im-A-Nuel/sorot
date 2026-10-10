# Eval set

`tweets.jsonl` holds the labeled tweets (one JSON object per line). The target is 50 real tweets: about 30 that should match an open Panta market and 20 that should not.

```json
{"tweetId": "1840000000000001234", "text": "Haaland to get 8+ points in GW6, easy captain pick", "expectedMarketId": "GM2wvtGY5HaG3T4DiVnJTDXsScZLMc9JU9ABzSRGUvKn"}
{"tweetId": "1840000000000005678", "text": "gm, coffee first", "expectedMarketId": null}
```

Rows whose `expectedMarketId` is `"TODO"` are placeholders and are skipped.

## Which market ids to use

Markets close and new ones open, so labels are written against a saved snapshot of the open catalog:

```bash
pnpm eval -- --save-catalog      # writes eval/catalog-snapshot.json from the live catalog
```

The snapshot in this folder was saved on 2026-10-09 and lists two open markets:

| Market | `expectedMarketId` |
| --- | --- |
| Will BTC reach a new all-time high by December 31, 2026? | `CLQqZ7r6WYC5xNumWrmC7UAkQ1Z6pdCbjJSy7wQu1DgL` |
| Haaland 8+ points, GW6 (closes 2026-10-11) | `GM2wvtGY5HaG3T4DiVnJTDXsScZLMc9JU9ABzSRGUvKn` |

Run `--save-catalog` again before labeling if markets changed.

## How to label

- Use **real tweets**, copied as they are. Do not write them yourself, and do not tune the pipeline on the same tweets you score on.
- **Positive** (`expectedMarketId` = a market id): the tweet is clearly about the same event the market asks. For the BTC market that means a new all-time high; for Haaland, his points in GW6.
- **Negative** (`expectedMarketId` = `null`): everything else. Include hard negatives on purpose: tweets that mention Bitcoin or Haaland but are about something else ("BTC is pumping today", "Haaland is injured"), plus a few ordinary tweets.
- `tweetId` is the number at the end of the tweet URL.

## Scoring

```bash
pnpm eval -- --catalog           # scores against the snapshot, so it does not change when markets close
pnpm eval                        # scores against the live catalog
```

- Precision = correct non-null matches / all non-null matches.
- Recall = correct non-null matches / all rows with a non-null expected market.

Results are written to `eval/results.json`. The target is precision of at least 80%. Add `LLM_API_KEY` to `.env` to score with the LLM verifier, and run the eval both ways to see what it adds.
