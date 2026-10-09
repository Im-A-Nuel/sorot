# Submission Kit: Sorot

Terakhir diperbarui: 5 Oktober 2026

Submission Panta wajib dalam bahasa Inggris. Panta juga wajib submit lewat platform Colosseum, jadi kit ini hanya dipakai kalau Sorot adalah submission Colosseum-mu.

## Deadlines

| Target | Deadline |
| --- | --- |
| Colosseum Crypto World's Fair | 12 Okt 2026 (cek jam pasti di dashboard Colosseum) |
| Panta API sidetrack | 13 Okt 2026, 13:59 WIB (06:59 UTC) |

## Proof links

| Bukti | Link |
| --- | --- |
| Trade dari chip | TODO |
| Klaim | TODO |
| Hasil `pnpm eval` (presisi, recall, n) | TODO |
| Rilis GitHub extension | TODO |
| Chrome Web Store (kalau lolos) | TODO |

## Team wallets

| Wallet | Label |
| --- | --- |
| TODO | Builder (trade uji) |

## Checklist

### README
- [ ] Satu kalimat + video 30 detik di paling atas
- [ ] Cara pasang 4 langkah (load unpacked)
- [ ] Tabel endpoint Panta yang dipakai
- [ ] Angka presisi dan recall
- [ ] Proof links terisi
- [ ] Catatan keamanan: key Panta hanya di server, tanpa key wallet di extension

### Colosseum
- [ ] Nama, deskripsi, latar belakang tim, repo GitHub
- [ ] Pitch video (maks. 3 menit)
- [ ] Technical demo (maks. 3 menit)

### Panta sidetrack
- [ ] Link project di Colosseum
- [ ] Penjelasan integrasi Panta API per endpoint
- [ ] Demo produk yang jalan

---

## 30-second teaser (English)

1. **0:00** Scroll X. A tweet about SOL price appears. A Sorot chip slides in: "Panta: SOL above $300 by Oct 31? YES 62%".
2. **0:08** Click the chip. Trade popup opens. Pick YES, 5 USDC, sign in Phantom.
3. **0:20** Position appears. "Odds where the argument is. Sorot, powered by Panta."

## Pitch video script (English, max 3 min)

**0:00 Hook.** "Nobody opens a prediction market to argue. They argue on X. Sorot puts Panta's odds right under the argument."

**0:15 Problem.** "Prediction markets are a destination. Every terminal, bot, and dashboard still asks people to go somewhere else."

**0:35 Product.** "Sorot is a Chrome extension. It reads your timeline, matches tweets to Panta markets, and only when the match is verified it shows the odds under the tweet. One click, sign in Phantom, done."

**1:00 Demo clip.** Chip appears, trade, position, claim.

**1:40 Why it works.** "Precision first. We measured it: TODO% precision on 50 labeled tweets. No match, no chip."

**2:00 Integration.** "Catalog, detail, trades, quote, build, positions, claims, and attribution: Sorot uses Panta end to end."

**2:20 Traction and close.** "TODO installs, TODO trades from tweets. Prediction markets should live where the conversation lives."

## Technical demo script (English, max 3 min)

1. **0:00** Architecture: extension reads, backend matches and holds the key, hosted page signs.
2. **0:30** Matching pipeline live: a tweet that stops at prefilter, one that fails verification, one that matches.
3. **1:10** `pnpm eval` output.
4. **1:30** Trade flow with network tab: quote, build, sign, confirm.
5. **2:20** Grep `dist/` for the Panta key: nothing found.

## Panta submission description (English)

> Sorot is a Chrome extension that brings Panta prediction markets to the place where people argue about events: the X timeline. It matches each tweet to the Panta catalog (entity prefilter, embedding similarity, LLM verification), shows verified odds under the tweet, and lets users quote, build, sign, and claim from a hosted trade page with every trade attributed to Sorot. Precision on 50 labeled tweets: TODO%. Mainnet trades: TODO.
