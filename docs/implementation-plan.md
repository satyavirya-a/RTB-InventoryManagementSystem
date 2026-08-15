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
| Fase 1 — Setup Project React + Vite | ✅ Selesai | 2026-08-08 |
| Fase 2 — Koneksi Supabase | ✅ Selesai | 2026-08-12 |
| Fase 3 — Katalog Barang | ✅ Selesai | 2026-08-12 |
| Fase 4 — Cart System & FAB | ✅ Selesai | 2026-08-13 |
| Fase 4.5 — Item Detail Modal | ✅ Selesai | 2026-08-13 |
| Fase 5 — Logika Transaksi & UI Wizard | ✅ Selesai | 2026-08-14 |
| Fase 6 — Kompresi Gambar, Multi-Upload & Subfolder Drive | ✅ Selesai | 2026-08-15 |
| Fase 6.8 — Deep Linking Detail Peminjam ke Riwayat | ✅ Selesai | 2026-08-15 |
| Fase 6.9 — Edit Data Barang, Foto Katalog & Koreksi Stok | ✅ Selesai | 2026-08-15 |
| Fase 6.10 — Redesign Form Kompak & Dropdown Responsif | ✅ Selesai | 2026-08-15 |
| Fase 7 — Autentikasi & RLS | ⬜ Belum dimulai | — |
| Fase 8 — Testing & Polish UI | ⬜ Belum dimulai | — |
| Fase 9 — Deployment ke Vercel | ⬜ Belum dimulai | — |

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

### Ringkasan Langkah Fase 2

| # | Langkah | Siapa | Status |
|---|---|---|---|
| 2.A | Install `@supabase/supabase-js` | 🤖 Agent | ⬜ |
| 2.B | Buat `docs/sql-schema.sql` (DDL 3 tabel) | 🤖 Agent | ⬜ |
| 2.C | Buat `src/lib/supabaseClient.js` | 🤖 Agent | ⬜ |
| 2.D | Buat `src/lib/constants.js` (enum event & transaksi) | 🤖 Agent | ⬜ |
| 2.E | **Buat project Supabase** (dashboard) | 👤 Manual | ⬜ |
| 2.F | **Jalankan SQL** di Supabase SQL Editor | 👤 Manual | ⬜ |
| 2.G | **Buat `.env.local`** dan isi URL + key | 👤 Manual | ⬜ |
| 2.H | Test koneksi di browser console | 👤 Manual | ⬜ |
| 2.I | Git commit + push | 🤖 Agent | ⬜ |

---

### Step 2.A — Install Supabase JS Client

```bash
npm install @supabase/supabase-js
```

Library ini adalah "jembatan" antara kode React kamu dan database Supabase.
Tanpa ini, kamu tidak bisa memanggil `supabase.from('items').select('*')`.

---

### Step 2.B — SQL Schema (docs/sql-schema.sql)

File ini berisi **DDL (Data Definition Language)** — perintah SQL untuk membuat:
- Tabel `items` (katalog barang)
- Tabel `transactions` (header setiap transaksi)
- Tabel `transaction_details` (detail barang per transaksi)
- Semua `CHECK constraint` untuk validasi data
- Fungsi `process_checkout_transaction()` (kerangka, dilengkapi di Fase 5)

> ⚠️ File ini **hanya dokumentasi** — harus dijalankan **manual** di Supabase SQL Editor.

---

### Step 2.C — Supabase Client (src/lib/supabaseClient.js)

```js
// Yang akan dibuat:
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)
```

Perhatikan: `import.meta.env` adalah cara **Vite** membaca env variables.
Berbeda dengan `process.env` yang dipakai di Node.js.
Prefix `VITE_` wajib ada — tanpanya Vite tidak akan expose variable ke browser.

---

### Step 2.D — Constants (src/lib/constants.js)

Menyimpan nilai tetap seperti nama event dan jenis transaksi agar tidak hardcode di banyak tempat.

---

### Step 2.E — Langkah Manual: Buat Project Supabase

1. Buka https://app.supabase.com
2. Klik **"New Project"**
3. Nama project: `gudang-rtb` (atau sesuai preferensi)
4. Pilih region terdekat: **Southeast Asia (Singapore)**
5. Set database password (simpan baik-baik!)
6. Tunggu project selesai provisioning (~2 menit)

---

### Step 2.F — Langkah Manual: Jalankan SQL di Supabase

1. Di dashboard Supabase → klik **SQL Editor** di sidebar kiri
2. Klik **"New query"**
3. Copy-paste isi file `docs/sql-schema.sql`
4. Klik **"Run"** (atau Ctrl+Enter)
5. Verifikasi: buka **Table Editor** → pastikan 3 tabel muncul

---

### Step 2.G — Langkah Manual: Setup .env.local

```bash
# Di terminal, dari root project:
copy .env.example .env.local
```

Lalu buka `.env.local` dan isi:
- `VITE_SUPABASE_URL` → dari Supabase Dashboard → Settings → API → **Project URL**
- `VITE_SUPABASE_ANON_KEY` → dari Supabase Dashboard → Settings → API → **anon public**

> ❌ JANGAN commit file ini ke Git. Sudah ada di `.gitignore`.

---

### Step 2.H — Test Koneksi (Manual)

Setelah `.env.local` diisi dan `npm run dev` berjalan, buka browser console dan ketik:

```js
// Buka http://localhost:5173 → F12 → Console → ketik:
const { data, error } = await window.__supabase.from('items').select('*')
console.log({ data, error })
```

Atau lihat output di console yang sudah ada (App.jsx akan menampilkannya).

**Ekspektasi:**
- ✅ `data: []` (array kosong) → koneksi berhasil, tabel kosong
- ❌ `error: { message: 'Failed to fetch' }` → URL salah
- ❌ `error: { code: '401' }` → key salah atau RLS terlalu ketat

---

### Checklist Verifikasi Fase 2

- [ ] `npm install @supabase/supabase-js` berhasil tanpa error
- [ ] 3 tabel muncul di Supabase Table Editor setelah SQL dijalankan
- [ ] `.env.local` sudah diisi dengan nilai asli (bukan placeholder)
- [ ] Browser console: tidak ada error saat fetch ke Supabase
- [ ] `supabaseClient.js` TIDAK mengandung hardcode URL/key
- [ ] `git status` → `.env.local` TIDAK muncul

### Git Commit Fase 2

```bash
git add docs/sql-schema.sql src/lib/supabaseClient.js src/lib/constants.js package.json package-lock.json
git commit -m "feat: install Supabase dan setup SQL schema"
git commit -m "feat: buat supabaseClient.js dan constants.js"
git push origin main
```

---

## Fase 3 — Komponen Katalog Barang ✅

**Tujuan:** Menampilkan barang dari database dalam tampilan galeri yang responsif (mobile-first).

### File yang Dibuat

| File | Keterangan |
|---|---|
| `src/hooks/useItems.js` | Custom hook: fetch barang aktif + client-side search filter |
| `src/components/ItemCard.jsx` | Kartu barang: foto (lazy load), badge stok berwarna, badge tipe |
| `src/components/ItemCard.css` | Style ItemCard: hover animation, skeleton-ready |
| `src/pages/CatalogPage.jsx` | Grid responsif + search bar + skeleton loading + empty state |

### Riwayat Commit Fase 3

| Hash | Pesan |
|---|---|
| `1b3b2c2` | `feat: buat useItems custom hook (fetch + client-side filter)` |
| `9cfe080` | `feat: buat komponen ItemCard (foto, nama, stok badge, tipe barang)` |
| `b25003b` | `feat: buat CatalogPage (grid responsif, search, skeleton loading, empty state)` |
| `eb291fa` | `fix: tambah properti standar line-clamp untuk kompatibilitas CSS` |

### Catatan Penting: Penyimpanan Foto Barang

Kolom `photo_url` di tabel `items` hanya menyimpan **URL teks**, bukan file gambar.
File gambar fisik akan disimpan di **Supabase Storage** (diimplementasi di Fase 6).

**Kenapa tidak pakai Google Drive?**
- Google Drive memblokir browser website lain memuat gambar (CORS policy)
- URL Google Drive tidak stabil untuk embed di web
- Supabase Storage: 1GB gratis, dirancang untuk web, bisa dikontrol via RLS

### Query SQL Sample Data (untuk test tampilan)

Jalankan di Supabase SQL Editor jika ingin test tampilan kartu barang:

```sql
-- INSERT: 6 barang sample dengan kondisi stok berbeda
-- Semua ditandai event_name = 'SAMPLE_TEST' untuk mudah dihapus
INSERT INTO items (name, description, is_consumable, stock_available, stock_in_use, unit, event_name, photo_url) VALUES
  ('Double Tape', 'Ukuran 1 inch', true, 12, 0, 'roll', 'SAMPLE_TEST',
   'https://images.unsplash.com/photo-1612198188060-c7c2a3b66eae?w=400&q=80'),
  ('Kabel Ties', 'Panjang 30cm', true, 3, 0, 'pcs', 'SAMPLE_TEST',
   'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80'),
  ('Spidol Boardmarker', 'Warna hitam', true, 0, 0, 'pcs', 'SAMPLE_TEST',
   'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=400&q=80'),
  ('Proyektor', 'Epson EB-X05', false, 2, 1, 'unit', 'SAMPLE_TEST',
   'https://images.unsplash.com/photo-1626379953822-baec19c3accd?w=400&q=80'),
  ('Kabel HDMI', '3 meter', false, 0, 3, 'pcs', 'SAMPLE_TEST',
   'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&q=80'),
  ('Lakban Hitam', null, true, 8, 0, 'roll', 'SAMPLE_TEST', null);

-- DELETE: Hapus semua data sample sekaligus
DELETE FROM items WHERE event_name = 'SAMPLE_TEST';
```

### Checklist Verifikasi ✅

- [x] Alur data `fetch → useState → render` bisa dijelaskan
- [x] JSDoc ada di semua fungsi (sesuai AGENTS.md)
- [x] Skeleton loading tampil saat data belum tiba
- [x] Empty state berbeda: "belum ada barang" vs "tidak ditemukan"
- [x] Grid responsif: `repeat(auto-fill, minmax(160px, 1fr))`
- [x] CSS warning `line-clamp` sudah diperbaiki

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

- Buat CartContext.jsx: addToC## Fase 5 — Logika Transaksi & Database Otomatis (Refaktor 3 Menu)

**Tujuan:** Mengimplementasikan logika pembaruan stok yang atomik (mencegah *race condition*) sekaligus menyederhanakan alur transaksi menjadi 3 menu utama (berdasarkan feedback lapangan).

### Konsep 3 Menu Utama
1. **Pemakaian**: Menggabungkan pengambilan barang habis pakai (stok berkurang) dan peminjaman barang non-habis pakai (stok dipinjam). Sistem backend otomatis membedakan perlakuannya berdasarkan tipe barang.
2. **Pengembalian**: Hanya untuk barang yang berstatus dipinjam. Menambah `stock_available` dan mengurangi `stock_in_use`.
3. **Penitipan**: Digunakan untuk menitipkan barang di luar katalog. Hanya membuat rekaman header transaksi, tanpa mengunci atau mengubah stok barang di katalog.

### Pelacakan Peminjam (SQL View)
Untuk mengetahui "siapa meminjam apa", kita membuat SQL View `active_loans`. View ini menghitung selisih kuantitas antara transaksi **Pemakaian** dan **Pengembalian** per user per barang. Jika selisih > 0, artinya user tersebut masih memegang barang tersebut.

### Rencana Kode SQL

Kode ini akan dieksekusi di Supabase SQL Editor.

```sql
-- 1. Perbarui Constraint Jenis Transaksi
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_transaction_type_check;
ALTER TABLE transactions ADD CONSTRAINT transactions_transaction_type_check 
  CHECK (transaction_type IN ('pemakaian', 'pengembalian', 'penitipan'));

-- 2. Fungsi RPC process_checkout_transaction
CREATE OR REPLACE FUNCTION process_checkout_transaction(
  p_transaction_type text,
  p_actor_name       text,
  p_event_name       text,
  p_proof_photo_url  text,
  p_notes            text,
  p_cart_items       jsonb  -- Format: [{"item_id": "uuid", "quantity": 2}, ...]
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  v_transaction_id uuid;
  v_cart_item      jsonb;
  v_item_id        uuid;
  v_quantity       integer;
  v_is_consumable  boolean;
  v_stock_avail    integer;
  v_stock_in_use   integer;
BEGIN
  IF p_transaction_type NOT IN ('pemakaian', 'pengembalian', 'penitipan') THEN
    RAISE EXCEPTION 'Jenis transaksi tidak valid: %', p_transaction_type;
  END IF;

  -- 1. Buat header transaksi
  INSERT INTO transactions (transaction_type, actor_name, event_name, proof_photo_url, notes)
  VALUES (p_transaction_type, p_actor_name, p_event_name, p_proof_photo_url, p_notes)
  RETURNING id INTO v_transaction_id;

  -- 2. Khusus Penitipan, tidak perlu proses item katalog
  IF p_transaction_type = 'penitipan' THEN
    RETURN v_transaction_id;
  END IF;

  IF jsonb_array_length(p_cart_items) = 0 THEN
    RAISE EXCEPTION 'Cart tidak boleh kosong untuk transaksi ini';
  END IF;

  -- 3. Loop setiap item di cart (untuk Pemakaian & Pengembalian)
  FOR v_cart_item IN SELECT * FROM jsonb_array_elements(p_cart_items)
  LOOP
    v_item_id  := (v_cart_item->>'item_id')::uuid;
    v_quantity := (v_cart_item->>'quantity')::integer;

    -- Lock row untuk menghindari race condition
    SELECT is_consumable, stock_available, stock_in_use
    INTO v_is_consumable, v_stock_avail, v_stock_in_use
    FROM items
    WHERE id = v_item_id
    FOR UPDATE; 

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Barang dengan id % tidak ditemukan', v_item_id;
    END IF;

    -- Insert detail
    INSERT INTO transaction_details (transaction_id, item_id, quantity)
    VALUES (v_transaction_id, v_item_id, v_quantity);

    -- Logika update stok
    IF p_transaction_type = 'pemakaian' THEN
      IF v_stock_avail < v_quantity THEN
        RAISE EXCEPTION 'Stok tidak cukup untuk barang %', v_item_id;
      END IF;
      
      IF v_is_consumable THEN
        -- Barang Habis Pakai
        UPDATE items SET stock_available = stock_available - v_quantity WHERE id = v_item_id;
        IF (v_stock_avail - v_quantity) = 0 THEN
          UPDATE items SET status = 'archived' WHERE id = v_item_id;
        END IF;
      ELSE
        -- Barang Pinjaman
        UPDATE items 
        SET stock_available = stock_available - v_quantity,
            stock_in_use = stock_in_use + v_quantity
        WHERE id = v_item_id;
      END IF;

    ELSIF p_transaction_type = 'pengembalian' THEN
      IF v_is_consumable THEN
        RAISE EXCEPTION 'Barang consumable tidak bisa dikembalikan.';
      END IF;
      
      -- Catatan: Validasi jumlah yang bisa dikembalikan bisa dilakukan via view active_loans
      UPDATE items 
      SET stock_available = stock_available + v_quantity,
          stock_in_use = stock_in_use - v_quantity
      WHERE id = v_item_id;

      IF v_stock_avail = 0 THEN
        UPDATE items SET status = 'active' WHERE id = v_item_id;
      END IF;
    END IF;
  END LOOP;

  RETURN v_transaction_id;
END;
$$;

-- 3. View active_loans untuk melacak peminjam
CREATE OR REPLACE VIEW active_loans AS
SELECT 
    t.actor_name,
    t.event_name,
    td.item_id,
    i.name AS item_name,
    SUM(CASE WHEN t.transaction_type = 'pemakaian' THEN td.quantity ELSE 0 END) -
    SUM(CASE WHEN t.transaction_type = 'pengembalian' THEN td.quantity ELSE 0 END) AS unreturned_quantity
FROM transactions t
JOIN transaction_details td ON t.id = td.transaction_id
JOIN items i ON td.item_id = i.id
WHERE i.is_consumable = false
GROUP BY t.actor_name, t.event_name, td.item_id, i.name
HAVING (
    SUM(CASE WHEN t.transaction_type = 'pemakaian' THEN td.quantity ELSE 0 END) -
    SUM(CASE WHEN t.transaction_type = 'pengembalian' THEN td.quantity ELSE 0 END)
) > 0;
```nsumable
   - Aksi: Kurangi `stock_available`, tambah `stock_in_use`.
3. **Pengembali (Return)**
   - Sasaran: Barang Non-Consumable
   - Aksi: Tambah `stock_available`, kurangi `stock_in_use`.
4. **Penaruh (Restock)**
   - Sasaran: Semua Barang
   - Aksi: Tambah `stock_available`.

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

## Fase 6 — Kompresi Gambar & Input Data Barang (Penitipan & PIC)

**Tujuan:** 
1. Mengimplementasikan kompresi gambar sisi klien (~200KB) menggunakan Web Worker untuk menghemat kuota dan mempercepat upload.
2. Mengintegrasikan upload foto ke **Supabase Storage** (`transaction-proofs` dan `item-photos`).
3. Memperbarui form **Penitipan Barang** (Langkah 2) agar meminta data spesifik barang titipan beserta foto bukti.
4. Membuat fitur **Tambah Barang Baru** bagi PIC/Admin untuk menambah inventaris katalog langsung dari aplikasi.

---

### 1. Arsitektur & File yang akan Dibuat / Diperbarui

| # | File / Komponen | Tipe | Keterangan |
|---|---|---|---|
| 1 | `src/lib/imageCompression.js` | Utility | Fungsi `compressImageFile(file)` berbasis `browser-image-compression` |
| 2 | `src/lib/storageService.js` | Service | Fungsi helper upload file ke Supabase Storage dan generate public URL |
| 3 | `src/components/PhotoUpload.jsx` | Komponen | UI Upload foto + preview + progress kompresi (ukuran asli vs terkompresi) |
| 4 | `src/components/PhotoUpload.css` | Styling | Styling modern drag-and-drop / preview foto |
| 5 | `src/pages/TransactionWizard.jsx` | Halaman | Update Step 2 khusus Penitipan (Nama Barang, Deskripsi, Foto Bukti) |
| 6 | `src/components/AddItemModal.jsx` | Komponen | Modal form PIC untuk input barang baru ke tabel `items` + upload foto katalog |
| 7 | `src/components/AddItemModal.css` | Styling | Styling modal input barang baru |
| 8 | `src/pages/CatalogPage.jsx` | Halaman | Tambah tombol aksi "+ Tambah Barang Baru" untuk PIC |

---

### 2. Konfigurasi Supabase Storage (Manual di Dashboard)

Sebelum upload berjalan, bucket penyimpanan foto harus disiapkan di Supabase:
1. Masuk ke **Supabase Dashboard** → **Storage** → **New Bucket**:
   - Bucket 1: `transaction-proofs` (Public bucket) → untuk foto bukti transaksi & penitipan.
   - Bucket 2: `item-photos` (Public bucket) → untuk foto barang katalog.
2. Setup RLS Policy Storage:
   - `SELECT`: Public (semua orang bisa melihat foto).
   - `INSERT`: Public (MVP) / Authenticated (Fase 7).

---

### 3. Alur Form 1: Penitipan Barang (Oleh Panitia)

```
Langkah 1 (Identitas)
  ├── Nama Panitia
  └── Nama Event / Divisi
       ↓ Klik Lanjut
Langkah 2 (Detail Barang Titipan)
  ├── Nama Barang Titipan * (wajib)
  ├── Rincian / Deskripsi / Jumlah
  └── Upload Foto Bukti * (otomatis dikompresi ~150KB)
       ↓ Klik Lanjut
Langkah 3 (Konfirmasi & Submit)
  ├── Upload foto ke bucket 'transaction-proofs'
  └── Eksekusi RPC process_checkout_transaction ('penitipan')
```

---

### 4. Alur Form 2: Input Barang Baru (Oleh PIC Gudang)

```
Tombol "+ Tambah Barang" di Katalog
  ↓ Klik
Modal Input Barang Baru
  ├── Nama Barang * (wajib)
  ├── Deskripsi Barang (opsional)
  ├── Jumlah Stok Awal * (angka, min 1)
  ├── Satuan / Unit * (pcs, roll, unit, box, dll)
  └── Upload Foto Barang (opsional, otomatis dikompresi)
  ↓ Klik Simpan
Upload foto ke bucket 'item-photos' → INSERT ke tabel 'items' → Refresh Katalog otomatis
```

---

### 5. Target Teknis Kompresi Gambar

- **Library**: `browser-image-compression`
- **Max Size**: `0.2` MB (~200KB)
- **Max Dimension**: `1024px` (lebar/tinggi, mempertahankan aspect ratio)
- **Web Worker**: `true` (kompresi berjalan di background thread, UI tidak freeze)
- **Output**: `File` object siap dikirim ke `supabase.storage.from(bucket).upload()`

---

### Checklist Verifikasi Fase 6

- [ ] `browser-image-compression` terinstall dan berfungsi
- [ ] Bucket `transaction-proofs` dan `item-photos` aktif di Supabase Storage
- [ ] Upload foto 5MB terbukti menyusut menjadi < 200KB di console
- [ ] Form Penitipan (Langkah 2) meminta nama barang, deskripsi, dan foto bukti
- [ ] Tombol "+ Tambah Barang" berhasil memasukkan barang baru ke tabel `items` dan tampil di katalog
- [ ] Foto barang baru langsung muncul di kartu `ItemCard` katalog tanpa reload halaman

---

---

## Fase 6.5 — 4 Menu Transaksi, Tampilan Barang Titipan Aktif, & Pengambilan Barang

**Tujuan:**
1. Menyempurnakan pembagian transaksi menjadi **4 Menu Utama**: Pemakaian, Pengembalian, Penitipan, dan Pengambilan Barang Titipan.
2. Menyediakan **Tab Switcher di Dashboard** untuk memilih antara melihat **Katalog Barang Gudang** atau **Barang Titipan Aktif**.
3. Membuat alur **Wizard Pengambilan Barang Titipan** untuk mencatat serah terima barang titipan yang diambil kembali oleh pemiliknya.
4. Membuat SQL View `active_deposits` untuk menyaring barang titipan yang belum diambil.

---

### Alur Wizard: Pengambilan Barang Titipan

```
Langkah 1 (Identitas Pengambil)
  ├── Nama Pengambil *
  └── Nama Event / Divisi *
       ↓ Klik Lanjut
Langkah 2 (Pilih Barang Titipan)
  ├── Pilih kartu barang titipan yang aktif
  └── Upload Foto Bukti Pengambilan / Serah Terima (opsional)
       ↓ Klik Lanjut
Langkah 3 (Konfirmasi & Submit)
  ├── Ringkasan: Penitip Awal vs Pengambil
  └── Submit Transaksi 'pengambilan' (related_transaction_id = ID Penitipan)
       ↓
  Barang otomatis hilang dari daftar "Barang Titipan Aktif" dan tercatat di Riwayat
```

---

## Fase 6.6 — Integrasi Auto-Backup Google Sheets & Google Drive

**Tujuan:**
1. Menyediakan pencadangan otomatis (*secondary backup*) ke Google Spreadsheet setiap kali terjadi transaksi inventaris di web.
2. Otomatis mengunduh dan menyalin foto bukti transaksi dari Supabase ke Folder khusus di **Google Drive** panitia (`Gudang RTB - Foto Bukti`).
3. Menggunakan pola arsitektur **Fire-and-Forget (Non-blocking)** agar proses backup di latar belakang tidak memperlambat respon aplikasi web.

---

### File yang Dibuat & Dimodifikasi

| # | File | Status | Keterangan |
|---|---|---|---|
| 1 | `docs/google-apps-script.js` | ✅ | Script webhook Google Apps Script untuk dipasang di Google Sheets |
| 2 | `src/lib/googleSyncService.js` | ✅ | Service helper non-blocking `fetch` ke Google Apps Script |
| 3 | `.env.example` | ✅ | Menambahkan variabel `VITE_GOOGLE_APPS_SCRIPT_URL` |
| 4 | `src/pages/TransactionWizard.jsx` | ✅ | Panggilan sync otomatis saat submit transaksi |
| 5 | `src/components/AddItemModal.jsx` | ✅ | Panggilan sync otomatis saat penambahan barang baru oleh PIC |

---

### Git Commit Rencana

```bash
git commit -m "feat: integrasi auto-backup transaksi ke Google Sheets & Google Drive (Fase 6.6)"
```

---

## Fase 6.7 — Multi-Foto Upload & Subfolder Google Drive Auto-Backup ✅

**Tujuan:**
1. Mendukung pengunggahan **lebih dari 1 foto (hingga 5 foto)** per transaksi (khususnya Penitipan barang yang memiliki banyak kardus/kemasan).
2. Kompresi paralel di background Web Worker untuk semua foto yang dipilih.
3. Otomatis membuat **Subfolder Khusus per Transaksi** di Google Drive (`YYYY-MM-DD_HHmm_JENIS_NAMA`) agar file tidak tercecer atau berantakan.
4. Menyediakan tampilan mini galeri foto pada tab Barang Titipan dan modal Riwayat Transaksi dengan zoom foto.

### File yang Dibuat & Dimodifikasi

| # | File | Status | Keterangan |
|---|---|---|---|
| 1 | `src/lib/storageService.js` | ✅ | Fungsi `uploadMultipleImagesToStorage(files, bucket)` via `Promise.all` |
| 2 | `src/components/PhotoUpload.jsx` | ✅ | Dukungan `isMultiple={true}`, drag-drop multi-file, preview grid & badge |
| 3 | `src/components/PhotoUpload.css` | ✅ | Grid preview multi-foto dan tombol hapus individual |
| 4 | `src/pages/TransactionWizard.jsx` | ✅ | Integrasi multi-foto pada alur penitipan, serah terima, dan preview konfirmasi |
| 5 | `src/components/DepositedItemsList.jsx` | ✅ | Parsing URL multi-foto dan badge jumlah foto |
| 6 | `src/components/HistoryModal.jsx` | ✅ | Galeri multi-foto pada detail transaksi |
| 7 | `docs/google-apps-script.js` | ✅ | Pembuatan subfolder rapi per transaksi di Google Drive |

## Fase 6.8 — Cross-Component Deep Linking (Detail Peminjam ➔ Riwayat) ✅

**Tujuan:**
1. Menghubungkan daftar nama panitia di bagian "Sedang Dibawa Oleh" pada modal detail barang langsung ke modal Riwayat Transaksi.
2. Filter otomatis jenis transaksi `pemakaian` dan nama panitia terpilih agar PIC dapat memeriksa bukti serah terima foto dalam 1 klik.

### File yang Dimodifikasi:
- `src/components/HistoryModal.jsx` (menerima `initialSearchQuery` & `initialFilter`)
- `src/pages/Dashboard.jsx` (mengelola state global filter riwayat)
- `src/pages/CatalogPage.jsx` (meneruskan callback `onOpenHistory`)
- `src/components/ItemDetailModal.jsx` & `ItemDetailModal.css` (item peminjam interaktif & clickable)

---

## Fase 6.9 — Fitur Edit Data Barang & Ganti Foto Katalog (PIC Gudang) ✅

**Tujuan:**
1. Memungkinkan PIC Gudang mengubah nama, deskripsi, satuan, sifat barang, **koreksi stok tersedia (Stock Opname)**, dan **mengganti foto barang** di katalog inventaris.
2. Mengunggah foto baru terkompresi ke bucket `item-photos` di Supabase Storage (dengan fallback cerdas).
3. Otomatis memperbarui data barang di database, mencatat audit log penyesuaian stok, me-refresh tampilan katalog secara instan, dan menyinkronkan data master ke Google Spreadsheet.

### File yang Dibuat & Dimodifikasi:
- `src/components/EditItemModal.jsx` & `EditItemModal.css` [NEW]: Modal form edit dengan pre-filled data, input koreksi stok, banner stok terpakai, kompresi foto, dan upload
- `src/components/ItemDetailModal.jsx` & `ItemDetailModal.css` [MODIFY]: Integrasi tombol edit dan sinkronisasi state lokal `currentItem`
- `src/components/PhotoUpload.jsx` & `PhotoUpload.css` [MODIFY]: Peningkatan antarmuka single-photo preview dengan aksi ganti/hapus foto
- `src/lib/storageService.js` [MODIFY]: Fallback otomatis upload antar-bucket Supabase Storage
- `src/pages/CatalogPage.jsx` [MODIFY]: Callback `onItemUpdated` memicu `refetch()` katalog

---

## Fase 6.10 — Redesign Form Kompak, Stepper Pro, & Dropdown Responsif Mobile ✅

**Tujuan:**
1. Menyempurnakan antarmuka modal **Tambah Barang Baru** dan **Edit Data Barang** agar proporsional, kompak, dan muat dalam satu layar tanpa *scroll trap*.
2. Mengganti input angka browser dengan komponen **Quantity Stepper Pro (`−` [ angka ] `+`)** terkunci 140px berdampingan dengan kolom Satuan (`1fr`).
3. Mengubah pilihan Sifat Barang menjadi **Segmented Control Tab Bar (44px)** bergaya iOS/macOS untuk menghemat ruang vertikal modal.
4. Mengganti tombol tab switcher di Dashboard yang panjang dan terpotong di layar HP (< 640px) dengan **Dropdown View Selector** yang responsif dan elegan.

### File yang Dimodifikasi:
- `src/components/AddItemModal.jsx` & `AddItemModal.css` [MODIFY]: Tata letak 2 kolom kompak (stok + satuan), tab segmen 44px, dan border ambient glow
- `src/components/EditItemModal.jsx` & `EditItemModal.css` [MODIFY]: Sinkronisasi desain form kompak dan border glow
- `src/pages/Dashboard.jsx` & `Dashboard.css` [MODIFY]: Selector tampilan responsif (tab di desktop, dropdown di mobile)
- `src/index.css` [MODIFY]: Token CSS untuk `.compact-stock-unit-grid`, `.quantity-stepper`, `.compact-segmented-control`, dan `.compact-quick-units`
- `docs/catatan-belajar.md` [MODIFY]: Dokumentasi Bab 11 tentang Desain Form Kompak & Responsif

---

## Fase 7 — Autentikasi & RLS

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
