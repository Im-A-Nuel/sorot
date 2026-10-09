# Eval set

`tweets.jsonl` holds 50 manually labeled tweets (one JSON object per line). Aim for about 30 tweets that should match a Panta market and 20 that should not.

Format:

```json
{"tweetId": "...", "text": "...", "expectedMarketId": "abc"}
{"tweetId": "...", "text": "...", "expectedMarketId": null}
```

Run `pnpm eval` from the repo root. Results are written to `eval/results.json` and the numbers go into the main README.
