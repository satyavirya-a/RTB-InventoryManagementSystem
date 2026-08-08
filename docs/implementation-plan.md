# 📋 Implementation Plan — Gudang RTB
### Rencana Kerja Step-by-Step per Fase

> File ini adalah dokumen hidup (living document).
> Setiap fase yang selesai akan di-update statusnya.
> Baca ini sebelum memulai fase baru agar tahu konteks lengkapnya.

---

## Daftar Isi
1. [Status Saat Ini](#status-saat-ini)
2. [Fase 1 — Setup Project React + Vite](#fase-1--setup-project-react--vite)
3. [Fase 2 — Koneksi ke Supabase](#fase-2--koneksi-ke-supabase)
4. [Fase 3 — Komponen Katalog Barang](#fase-3--komponen-katalog-barang)
5. [Fase 4 — Cart System](#fase-4--cart-system)
6. [Fase 5 — Logika Transaksi & Database](#fase-5--logika-transaksi--database)
7. [Fase 6 — Kompresi Gambar](#fase-6--kompresi-gambar)
8. [Fase 7 — Autentikasi & RLS](#fase-7--autentikasi--rls)
9. [Fase 8 — Testing & Polish UI](#fase-8--testing--polish-ui)
10. [Fase 9 — Deployment ke Vercel](#fase-9--deployment-ke-vercel)
11. [Konvensi Commit Message](#konvensi-commit-message)

---

## Status Saat Ini

| Fase | Status | Tanggal Selesai |
|---|---|---|
| Fase 0 — Fondasi (AGENTS.md, akun Supabase/Vercel) | ✅ Selesai | — |
| Fase 1 — Setup Project React + Vite | 🟡 Perlu verifikasi | — |
| Fase 2 — Koneksi Supabase | ⬜ Belum dimulai | — |
| Fase 3 — Katalog Barang | ⬜ Belum dimulai | — |
| Fase 4 — Cart System | ⬜ Belum dimulai | — |
| Fase 5 — Logika Transaksi | ⬜ Belum dimulai | — |
| Fase 6 — Kompresi Gambar | ⬜ Belum dimulai | — |
| Fase 7 — Autentikasi & RLS | ⬜ Belum dimulai | — |
| Fase 8 — Testing & Polish UI | ⬜ Belum dimulai | — |
| Fase 9 — Deployment | ⬜ Belum dimulai | — |

**Legend:** ✅ Selesai · 🟡 Dalam proses · 🔴 Blocked · ⬜ Belum dimulai

---

## Fase 1 — Setup Project React + Vite

**Tujuan:** Fondasi project yang bersih — struktur folder, konfigurasi Vite, design system dasar, dan keamanan environment variables.

### File yang Dibuat

| # | File / Folder | Status | Keterangan |
|---|---|---|---|
| 1 | `package.json` | ✅ | `"type": "module"` + scripts `dev`, `build`, `preview` |
| 2 | `vite.config.js` | ✅ | Konfigurasi Vite + plugin React |
| 3 | `index.html` | ✅ | Entry point HTML, meta SEO, `<div id="root">` |
| 4 | `src/main.jsx` | ✅ | Entry point React, `createRoot`, `StrictMode` |
| 5 | `src/App.jsx` | ✅ | Komponen root, placeholder status Fase 1 |
| 6 | `src/index.css` | ✅ | Design tokens (CSS Variables), dark mode, Inter font |
| 7 | `src/components/` | ✅ | Folder + placeholder + dokumentasi konvensi |
| 8 | `src/pages/` | ✅ | Folder + placeholder + dokumentasi konvensi |
| 9 | `src/lib/` | ✅ | Folder + placeholder + dokumentasi konvensi |
| 10 | `src/hooks/` | ✅ | Folder + placeholder + dokumentasi konvensi |
| 11 | `.gitignore` | ✅ | Exclude `.env.local`, `node_modules/`, `dist/` |
| 12 | `.env.example` | ✅ | Template env vars dengan instruksi pengisian |
| 13 | `docs/catatan-belajar.md` | ✅ | Jurnal belajar Fase 1 |
| 14 | `docs/implementation-plan.md` | ✅ | File ini |

### Checklist Verifikasi (Wajib Sebelum Commit)

- [ ] `npm run dev` berjalan tanpa error di terminal
- [ ] Browser tampilkan header "📦 Gudang RTB" + status dot hijau berkedip
- [ ] Ubah teks di `src/App.jsx` → save → browser update TANPA refresh penuh (HMR)
- [ ] Buka DevTools → Elements → semua konten ada di dalam `<div id="root">`
- [ ] `git status` → `.env.local` TIDAK muncul (terlindungi .gitignore)

### Git Commit

```bash
git add .
git commit -m "chore: setup fondasi project Fase 1

- Inisialisasi React + Vite dengan struktur folder standar
- Setup design system: CSS Variables, dark mode, Inter font
- Buat src/components, src/pages, src/lib, src/hooks
- Tambah .gitignore (exclude .env.local, node_modules, dist)
- Tambah .env.example sebagai template environment variables
- Buat docs/catatan-belajar.md dan docs/implementation-plan.md"
```

---

## Fase 2 — Koneksi ke Supabase

**Tujuan:** Menghubungkan frontend React ke backend Supabase. Ini adalah langkah yang membuat aplikasi kamu dari "statis" menjadi "punya data nyata".

> ⚠️ **Sebelum mulai Fase 2, kamu harus melakukan ini secara manual:**
> 1. Buat project di https://app.supabase.com (jika belum ada)
> 2. Buka **SQL Editor** di dashboard Supabase
> 3. Jalankan script dari `docs/sql-schema.sql` untuk membuat 3 tabel
> 4. Copy `.env.example` → `.env.local`, isi dengan URL & key asli

### File yang akan Dibuat

| # | File | Keterangan |
|---|---|---|
| 1 | `docs/sql-schema.sql` | DDL lengkap 3 tabel + constraint (untuk dijalankan manual) |
| 2 | `src/lib/supabaseClient.js` | Inisialisasi koneksi Supabase dengan JSDoc |
| 3 | `.env.local` | Dibuat manual oleh kamu — TIDAK di-commit! |

### Checklist Verifikasi

- [ ] `.env.local` sudah diisi dengan nilai asli (bukan placeholder)
- [ ] `console.log(await supabase.from('items').select('*'))` → tidak error di browser console
- [ ] Tidak ada error `401 Unauthorized` atau `Failed to fetch`
- [ ] Kode `supabaseClient.js` TIDAK mengandung hardcode URL/key — hanya `import.meta.env`

### Git Commit

```bash
git add .
# JANGAN: git add .env.local
git commit -m "feat: setup koneksi Supabase client (Fase 2)

- Tambah @supabase/supabase-js sebagai dependency
- Buat src/lib/supabaseClient.js dengan JSDoc lengkap
- Buat docs/sql-schema.sql sebagai referensi skema database"
```

---

## Fase 3 — Komponen Katalog Barang

**Tujuan:** Menampilkan barang dari database dalam tampilan galeri yang responsif (mobile-first).

### File yang akan Dibuat

| # | File | Keterangan |
|---|---|---|
| 1 | `src/components/ItemCard.jsx` | Kartu satu barang: foto, nama, stok, badge status |
| 2 | `src/components/ItemCard.css` | Style khusus ItemCard |
| 3 | `src/pages/CatalogPage.jsx` | Halaman utama: fetch data + render grid ItemCard |
| 4 | `src/hooks/useItems.js` | Custom hook untuk fetch & filter barang dari Supabase |

### Checklist Verifikasi

- [ ] Bisa jelaskan alur data: `fetch → useState → render` dengan kata-kata sendiri
- [ ] Ada JSDoc di setiap fungsi (sesuai standar AGENTS.md)
- [ ] Loading state tampil saat data belum tiba (bukan layar kosong)
- [ ] Empty state tampil saat tidak ada barang (bukan error)
- [ ] Grid responsif: 1 kolom di HP, 2–3 kolom di tablet/desktop
- [ ] Test di layar HP asli (bukan hanya DevTools emulator)

### Git Commit

```bash
git commit -m "feat: komponen katalog barang (Fase 3)

- Buat ItemCard.jsx: foto, nama, stok, badge status
- Buat CatalogPage.jsx: fetch data + grid responsif
- Buat useItems.js: custom hook fetch & filter items
- Tambah loading state dan empty state"
```

---

## Fase 4 — Cart System

**Tujuan:** Sistem keranjang multi-item menggunakan React Context API — fondasi untuk proses checkout.

### File yang akan Dibuat

| # | File | Keterangan |
|---|---|---|
| 1 | `src/contexts/CartContext.jsx` | Context + Provider + fungsi cart |
| 2 | `src/hooks/useCart.js` | Custom hook shortcut akses CartContext |
| 3 | `src/components/CartDrawer.jsx` | Panel keranjang (slide dari kanan) |
| 4 | `src/components/CartDrawer.css` | Style CartDrawer |

### Fungsi yang Wajib Ada di CartContext

| Fungsi | Perilaku |
|---|---|
| `addToCart(item, quantity)` | Tambah barang, validasi tidak melebihi `stock_available` |
| `removeFromCart(itemId)` | Hapus barang dari keranjang |
| `updateQuantity(itemId, quantity)` | Ubah kuantitas, validasi min=1 max=stock_available |
| `clearCart()` | Kosongkan semua isi keranjang |

### Aturan Kritis Cart

- Cart **TIDAK** disimpan ke `localStorage` (shared device saat event = cart harus reset per sesi)
- Kuantitas tidak boleh melebihi `stock_available` barang tersebut

### Checklist Verifikasi

- [ ] Bisa jelaskan cara `useContext` + `useState`/`useReducer` bekerja di CartContext
- [ ] Coba tambah quantity melebihi stok → harus ditolak
- [ ] Buka DevTools → Application → Local Storage → pastikan cart TIDAK ada di sana
- [ ] Refresh halaman → cart kosong (tidak persist)

### Git Commit

```bash
git commit -m "feat: cart system dengan React Context API (Fase 4)

- Buat CartContext.jsx: addToCart, removeFromCart, updateQuantity, clearCart
- Validasi: quantity tidak boleh melebihi stock_available
- Cart tidak disimpan ke localStorage (reset per sesi)
- Buat CartDrawer.jsx: panel keranjang responsif
- Buat useCart.js: custom hook untuk akses CartContext"
```

---

## Fase 5 — Logika Transaksi & Database

**Tujuan:** Implementasi logika inti bisnis — update stok yang atomik dan benar sesuai jenis transaksi.

> ⚠️ **Ini fase paling krusial.** Kesalahan di sini = data inventaris berantakan.
> Jangan lanjut sebelum benar-benar memahami logika di bawah ini.

### Logika Stok per Jenis Transaksi

| Jenis | `stock_available` | `stock_in_use` | Catatan |
|---|---|---|---|
| `penaruh` | ↑ tambah | tidak berubah | Stok masuk |
| `pengambil` | ↓ kurang | tidak berubah | Jika hasil = 0 → `status = 'archived'` |
| `peminjam` | ↓ kurang | ↑ tambah | Total (available + in_use) tetap sama |
| `pengembali` | ↑ tambah | ↓ kurang | Total (available + in_use) tetap sama |

### File yang akan Dibuat

| # | File | Keterangan |
|---|---|---|
| 1 | `docs/sql-rpc-function.sql` | Postgres function `process_checkout_transaction` |
| 2 | `src/pages/TransactionPage.jsx` | Form checkout: pilih jenis, isi detail, upload foto |
| 3 | `src/lib/transactionService.js` | Fungsi JS untuk panggil RPC Supabase |

### Checklist Verifikasi (WAJIB semua dicentang)

- [ ] Gambar ulang alur logika di kertas TANPA melihat kode — kalau bisa, berarti paham
- [ ] Test: checkout barang dengan stok tepat habis → status jadi `archived`
- [ ] Test: checkout melebihi stok → GAGAL (error) dan stok tidak berubah (rollback)
- [ ] Test: pinjam barang → `available` turun, `in_use` naik, total sama
- [ ] Test: kembalikan barang → kebalikannya
- [ ] Test race condition: buka 2 tab, checkout barang yang sama bersamaan

### Git Commit

```bash
git commit -m "feat: logika transaksi atomik via Postgres RPC (Fase 5)

- Buat process_checkout_transaction() di Supabase
- Handle 4 jenis: penaruh, pengambil, peminjam, pengembali
- Auto-archive saat stock_available consumable = 0
- Validasi stok cukup sebelum transaksi diproses (rollback jika gagal)
- Buat TransactionPage.jsx: form checkout multi-item
- Buat transactionService.js: wrapper panggil RPC"
```

---

## Fase 6 — Kompresi Gambar

**Tujuan:** Kompresi foto bukti transaksi di sisi klien sebelum upload ke Supabase Storage (hemat kuota free-tier).

### File yang akan Dibuat

| # | File | Keterangan |
|---|---|---|
| 1 | `src/lib/imageCompression.js` | Fungsi `compressImageFile` dengan web worker |
| 2 | `src/components/PhotoUpload.jsx` | Komponen upload + preview + progress |

### Target Kompresi

- Ukuran akhir: ≤ 200KB
- Max dimensi: 1024px (lebar atau tinggi)
- Gunakan Web Worker agar UI tidak freeze saat kompresi

### Checklist Verifikasi

- [ ] `console.log(file.size)` sebelum dan sesudah kompresi — bedanya nyata
- [ ] Upload foto 5MB asli → hasil mendekati 200KB, kualitas masih layak
- [ ] UI tidak freeze/hang saat kompresi berjalan

### Git Commit

```bash
git commit -m "feat: kompresi gambar sisi klien sebelum upload (Fase 6)

- Install browser-image-compression
- Buat imageCompression.js: target 200KB, maxWidth 1024px, web worker
- Buat PhotoUpload.jsx: upload + preview + indicator ukuran
- Integrasi ke TransactionPage sebelum supabase.storage.upload()"
```

---

## Fase 7 — Autentikasi & RLS

**Tujuan:** Batasi akses data — hanya user yang login yang bisa INSERT/UPDATE.

### Yang Perlu Dilakukan di Supabase Dashboard (manual)

1. Aktifkan **Email Magic Link** di Authentication → Providers
2. Buat RLS Policy untuk setiap tabel:
   - `SELECT`: semua orang (public read)
   - `INSERT`/`UPDATE`: hanya `auth.role() = 'authenticated'`

### File yang akan Dibuat

| # | File | Keterangan |
|---|---|---|
| 1 | `docs/sql-rls-policies.sql` | Script RLS policies (untuk dokumentasi) |
| 2 | `src/contexts/AuthContext.jsx` | Context untuk status login user |
| 3 | `src/hooks/useAuth.js` | Custom hook akses AuthContext |
| 4 | `src/pages/LoginPage.jsx` | Halaman login dengan Magic Link |
| 5 | `src/components/ProtectedRoute.jsx` | Guard komponen: redirect ke login jika belum auth |

### Checklist Verifikasi

- [ ] Test: akses data via `curl` TANPA token → SELECT berhasil, INSERT ditolak (403)
- [ ] Test: login dengan Magic Link di email → berhasil masuk
- [ ] Test: login dari device lain → sesi tidak tercampur

### Git Commit

```bash
git commit -m "feat: autentikasi Magic Link + RLS Supabase (Fase 7)

- Setup Supabase Auth dengan Email Magic Link
- Aktifkan RLS: SELECT public, INSERT/UPDATE hanya authenticated
- Buat AuthContext.jsx + useAuth.js
- Buat LoginPage.jsx dan ProtectedRoute.jsx"
```

---

## Fase 8 — Testing & Polish UI

**Tujuan:** Pastikan semua edge case tertangani dan UI terasa premium di HP asli.

### Skenario Wajib Diuji Manual

| Skenario | Ekspektasi |
|---|---|
| Checkout dengan cart kosong | Tombol checkout disabled / error toast |
| Checkout stok = 0 | Ditolak, pesan error jelas |
| Upload foto > 10MB | Dikompresi, tidak error |
| Checkout kuantitas negatif | Input tidak bisa negatif |
| Koneksi internet putus saat checkout | Error toast, data tidak korup |
| Dua user checkout barang terakhir bersamaan | Salah satu berhasil, satu mendapat error stok habis |

### Tambahan UI yang Wajib Ada

- [ ] Loading spinner saat proses async berjalan
- [ ] Toast notification (sukses hijau / gagal merah) setelah setiap transaksi
- [ ] Konfirmasi dialog sebelum submit checkout

### Git Commit

```bash
git commit -m "feat: polish UI + edge case handling (Fase 8)

- Tambah loading spinner untuk semua operasi async
- Tambah toast notification sukses/gagal
- Tambah konfirmasi dialog sebelum checkout
- Fix: [daftar bug yang ditemukan dan diperbaiki]"
```

---

## Fase 9 — Deployment ke Vercel

**Tujuan:** Dari kode di laptop → bisa diakses semua panitia lewat URL publik.

> ⚠️ **Seluruh langkah Git di fase ini harus dilakukan manual oleh kamu** — ini skill yang harus melekat, bukan didelegasikan ke agent.

### Langkah Manual (Tidak Bisa Didelegasikan ke Agent)

```bash
# 1. Pastikan semua perubahan sudah di-commit
git status   # harus bersih (no changes)

# 2. Push ke GitHub
git push origin main

# 3. Buka https://vercel.com → Import Git Repository
# 4. Set Environment Variables di Vercel:
#    - VITE_SUPABASE_URL = [dari Supabase dashboard]
#    - VITE_SUPABASE_ANON_KEY = [dari Supabase dashboard]
# 5. Deploy → tunggu build selesai
# 6. Test URL production dari HP via jaringan seluler (bukan WiFi)
```

### Checklist Verifikasi

- [ ] `git log --oneline` — riwayat commit rapi dan deskriptif
- [ ] `.env.local` TIDAK ada di riwayat commit (`git log --all -- .env.local` harus kosong)
- [ ] Build berhasil tanpa warning di Vercel dashboard
- [ ] Test seluruh alur transaksi dari HP via jaringan seluler
- [ ] Waktu load katalog < 2 detik di jaringan 4G

---

## Konvensi Commit Message

Kita menggunakan format [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>: <deskripsi singkat> (<Fase N>)

[body opsional — penjelasan lebih detail]
```

| Type | Kapan dipakai |
|---|---|
| `feat:` | Fitur atau fungsionalitas baru |
| `fix:` | Perbaikan bug |
| `chore:` | Setup, konfigurasi, tidak ada kode logika |
| `docs:` | Perubahan dokumentasi saja |
| `refactor:` | Restrukturisasi kode tanpa mengubah perilaku |
| `style:` | Perubahan CSS/tampilan saja |
| `test:` | Tambah atau perbaiki test |

**Contoh commit yang baik:**
```bash
feat: tambah validasi stok di CartContext (Fase 4)

- Quantity tidak boleh melebihi stock_available
- Tampilkan pesan error jika user coba masukkan lebih
```

**Contoh commit yang buruk:**
```bash
update file       # ← Tidak informatif sama sekali
fix bug           # ← Bug apa?
WIP               # ← Jangan commit "Work In Progress" ke main branch
```
