# Requirements: Sorot

Terakhir diperbarui: 5 Oktober 2026

## Problem Statement

Prediction market biasanya dialami sebagai destinasi: orang harus sengaja membuka situsnya. Padahal perdebatan tentang event yang dihargai market itu terjadi di X. Market Panta saat ini terutama hidup di permukaan milik Panta dan beberapa terminal, Telegram bot, dan Blinks buatan peserta lain. Belum ada overlay di timeline X untuk Panta.

Sorot menaruh odds Panta tepat di bawah tweet yang membahas event yang sama, dan memungkinkan trade langsung dari konteks itu.

## Syarat eligibility (gate)

Panta mewajibkan submission ke Colosseum, dan Colosseum hanya menerima satu produk per builder. Sorot hanya dikerjakan serius kalau Sorot menjadi submission Colosseum. Keputusan diambil Kamis 8 Oktober pagi berdasarkan jawaban Meteora soal syarat Colosseum untuk track Meteora.

## Goals (In Scope)

- G-01: Chip odds muncul di tweet yang relevan dengan presisi minimal 80% pada set uji 50 tweet berlabel.
- G-02: Minimal 1 siklus trade nyata di mainnet dari dalam X: quote, build, sign, posisi tercatat.
- G-03: Trade YES atau NO bisa selesai dalam kurang dari 4 klik dari chip.
- G-04: Minimal 10 instalasi extension oleh user non-tim sebelum 13 Oktober 2026.
- G-05: Sorot memakai minimal 7 kemampuan Panta API: katalog, detail, trades, quote, build, posisi, klaim, plus atribusi.

## Non-Goals (Out of Scope)

- Menyimpan private key atau seed phrase di extension.
- Membuat market otomatis tanpa persetujuan biaya oleh user.
- Overlay di situs selain X (P1, bukan MVP).
- Market di luar Panta.
- Menargetkan user Indonesia untuk trade uang sungguhan.
- Browser selain Chrome dan turunan Chromium.

## Functional Requirements

### FR-01: Observasi tweet
- Deskripsi: content script harus membaca tweet yang tampil di timeline, thread, dan halaman detail tweet.
- Input: DOM x.com.
- Output: batch `{ tweetId, text, lang }` ke service worker.
- Priority: High
- Selesai kalau: scroll timeline 100 tweet tidak menimbulkan jank yang terasa dan setiap tweet hanya dikirim sekali per sesi.

### FR-02: Sinkronisasi katalog
- Deskripsi: backend harus menyinkronkan market aktif dari `GET /markets/` setiap 5 menit dan menghidrasi judul yang kosong.
- Output: tabel `markets` dengan judul terhidrasi, kategori, status, harga, volume.
- Priority: High

### FR-03: Pencocokan
- Deskripsi: backend harus mencocokkan tweet ke paling banyak satu market.
- Pipeline: prefilter entitas, similarity embedding top-1 di atas ambang, verifikasi LLM ya/tidak.
- Output: `match` atau `null`.
- Priority: High
- Selesai kalau: presisi ≥ 80% di `eval/tweets.jsonl`.

### FR-04: Chip odds
- Deskripsi: content script harus menyisipkan chip di bawah tweet yang cocok.
- Isi chip: judul pendek market, harga YES dan NO atau "see odds" kalau null, label "Powered by Panta".
- Priority: High

### FR-05: Halaman trade
- Deskripsi: klik chip membuka popup halaman trade hosted: pilih sisi dan jumlah, quote, build, sign dengan Phantom, kirim, tampilkan posisi.
- Priority: High
- Selesai kalau: trade mainnet pertama tercatat dengan link tx dan atribusi.

### FR-06: Posisi dan klaim
- Deskripsi: halaman posisi menampilkan posisi wallet dan tombol klaim untuk market yang sudah bisa diklaim.
- Priority: High

### FR-07: Evaluasi
- Deskripsi: skrip `pnpm eval` menghitung presisi dan recall dari 50 tweet berlabel dan menulis hasilnya ke `eval/results.json`.
- Priority: High

### FR-08: Draft market dari tweet (P1)
- Deskripsi: kalau tidak ada market yang cocok, user bisa membuat draft: pertanyaan, aturan resolusi, sumber kebenaran, fee quote dari `POST /markets/create/quote/`. Pembuatan nyata hanya setelah user menyetujui biaya.
- Priority: Low

### FR-09: Mode baca-saja (P1)
- Deskripsi: opsi untuk menyembunyikan tombol trade dan hanya menampilkan odds.
- Priority: Low

## Non-Functional Requirements

- Performance: respons `/api/match` di bawah 1,5 detik p95 untuk tweet baru, di bawah 100 ms untuk tweet yang sudah di-cache.
- Performance: content script tidak boleh menambah lebih dari 16 ms kerja per frame saat scroll.
- Security: API key Panta hanya di server. Backend hanya mem-proxy allowlist route Panta.
- Security: permission extension hanya `https://x.com/*`, domain backend Sorot, dan `storage`.
- Reliability: request ke Panta dibatasi sekitar 100 per menit dengan backoff saat 429.
- Honesty: chip tidak pernah menampilkan angka yang tidak berasal dari API.

## Constraints

- Solo builder, paralel dengan Kuota dan Rem.
- Panta hanya di mainnet, tidak ada testnet: trade uji memakai USDC sungguhan.
- Submission Panta wajib dalam bahasa Inggris.
- Review Chrome Web Store bisa memakan beberapa hari.
- Deadline Panta sidetrack: 13 Oktober 2026 13:59 WIB; Colosseum 12 Oktober 2026.

## Assumptions

- Endpoint Panta yang dipakai peserta lain masih sama di dokumentasi resmi.
- Katalog cukup besar untuk menghasilkan cukup banyak kecocokan di kategori crypto.
- Phantom tersedia di halaman trade hosted yang dibuka sebagai popup.
- Panta API menyediakan mekanisme atribusi trade untuk integrator.
