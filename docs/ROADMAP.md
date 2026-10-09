# MVP Roadmap: Sorot

Terakhir diperbarui: 5 Oktober 2026

## MVP Definition

MVP selesai kalau chip odds Panta muncul di bawah tweet relevan dengan presisi minimal 80% di set uji, dan minimal satu trade mainnet dilakukan dari chip lengkap dengan posisi yang tercatat.

## Gate eligibility

| Jawaban Meteora soal syarat Colosseum | Keputusan Sorot |
| --- | --- |
| Tidak wajib | Lanjut. Sorot jadi submission Colosseum, Kuota standalone di Meteora |
| Wajib, atau belum menjawab Kamis 8 Okt pagi | Hentikan Sorot. Waktu dipindah ke Kuota dan Rem |

## Timeline Overview

| Fase | Tanggal | Tujuan |
| --- | --- | --- |
| 0. Persiapan ringan | Sen 5 Okt | API key, tarik katalog, cek judul kosong |
| Jeda | Sel 6 sampai Rab 7 Okt | Tidak ada kerja Sorot (fokus Kuota dan Rem) |
| 1. Foundation | Kam 8 Okt | Gate, content script, chip statis, sinkronisasi katalog |
| 2. Core | Jum 9 sampai Sab 10 Okt | Pencocokan, eval, halaman trade, posisi, klaim |
| 3. Polish dan submit | Min 11 sampai Sel 13 Okt | Video, README, Colosseum, Panta |

---

## Fase 0: Persiapan ringan
**Durasi**: 2 jam (Sen 5 Okt)

### Tasks
- [ ] Daftar API key Panta
- [ ] Tarik `GET /markets/`, catat jumlah market aktif dan berapa yang judulnya kosong
- [ ] DM Meteora soal syarat submission Colosseum

---

## Fase 1: Foundation
**Durasi**: 1 hari (Kam 8 Okt)

### Tasks
- [ ] Pagi: putuskan gate
- [ ] Setup monorepo (extension Vite MV3, Next.js, Drizzle)
- [ ] Content script: observer tweet, batching, chip statis
- [ ] Catalog job: sinkronisasi + hidrasi judul + entity index

---

## Fase 2: Core Features
**Durasi**: 2 hari (Jum 9 sampai Sab 10 Okt)

### Tasks
- [ ] Jum 9: pipeline pencocokan (prefilter, embedding, verifikasi LLM)
- [ ] Jum 9: kumpulkan dan label 50 tweet, `pnpm eval`
- [ ] Jum 9: submit Chrome Web Store unlisted + rilis GitHub
- [ ] Sab 10: halaman trade: quote, build, sign, confirm
- [ ] Sab 10: halaman posisi + klaim
- [ ] Sab 10: trade mainnet pertama dari dalam X

---

## Fase 3: Polish dan Submit
**Durasi**: 3 hari (Min 11 sampai Sel 13 Okt)

### Tasks
- [ ] Min 11: video 30 detik dari dalam X + video demo lengkap
- [ ] Min 11: README bahasa Inggris, angka presisi, proof links
- [ ] Min 11: bagikan ke Discord Panta untuk tester
- [ ] Sen 12: submit Colosseum (pitch video + technical demo)
- [ ] Sel 13 sebelum 13:59 WIB: submit Panta sidetrack

---

## Kill Criteria

- Kam 8 Okt pagi: Meteora belum menjawab atau menjawab wajib → hentikan Sorot.
- Sab 10 Okt: presisi di bawah 60% → persempit ke kategori crypto dan perketat ambang verifikasi.
- Sab 10 Okt malam: trade dari chip belum jalan → demo memakai deep link ke halaman market Panta, trade P0 diganti posisi baca-saja.

---

## Parking Lot (Post-MVP)

- Draft dan pembuatan market dari tweet dengan persetujuan biaya
- Overlay di situs berita
- Notifikasi saat market dari tweet yang pernah dilihat resolved
- Mode baca-saja per wilayah
- Firefox

---

## Definition of Done

- Fitur terlihat bekerja di x.com produksi
- Trade dan klaim punya link tx mainnet
- `pnpm eval` lulus ambang presisi
- API key Panta tidak pernah muncul di bundle extension (dicek dengan grep pada `dist/`)
