# 📦 Gudang RTB — Project Blueprint
### PRD, Database Schema, Development Roadmap, & Coding Standard

---

## BAGIAN 1: PRODUCT REQUIREMENTS DOCUMENT (PRD)

### 1.1 Latar Belakang
Saat ini pengelolaan inventaris untuk ±60 panitia dari 6 event berbeda dilakukan secara manual via Google Sheets + upload foto bukti. Proses ini rawan human error (salah tulis, overwrite data), tidak real-time (dua orang bisa ambil barang yang sama tanpa tahu stok sudah habis), dan sulit di-audit.

### 1.2 Tujuan Produk
1. Menyediakan satu sumber kebenaran (*single source of truth*) untuk stok barang yang **real-time**.
2. Menyederhanakan proses transaksi (taruh/ambil/pinjam/kembali) menjadi alur yang jelas dan terstruktur, mirip pengalaman *checkout* e-commerce.
3. Mengurangi beban admin dalam verifikasi manual via foto/chat.
4. **(Tujuan sekunder, tapi penting buat kamu)**: jadi media belajar *full-stack development* end-to-end — dari database design sampai deployment.

### 1.3 Target Pengguna
| Role | Deskripsi | Kebutuhan Utama |
|---|---|---|
| Panitia (End User) | ±60 orang dari 6 event, melakukan transaksi harian | UI cepat, simpel, minim friksi (mereka buru-buru saat acara) |
| PIC Gudang (Admin) | Penanggung jawab inventaris | Visibilitas stok, riwayat transaksi, kemampuan koreksi data |

### 1.4 Ruang Lingkup (Scope)

**In-Scope (MVP):**
- 4 jenis transaksi: Penaruh, Pengambil, Peminjam, Pengembali
- Katalog barang real-time (Gallery View)
- Cart system multi-item per transaksi
- Kompresi gambar sisi klien sebelum upload
- Auto-update stok berbasis logika consumable vs non-consumable
- Soft delete otomatis saat stok consumable habis

**Out-of-Scope (Fase Selanjutnya / Nice-to-have):**
- Sistem approval/persetujuan berjenjang
- Notifikasi push/email
- Laporan analitik & export PDF/Excel otomatis
- Multi-tenant (dukungan organisasi lain di luar event ini)
- Sistem reservasi barang (booking di muka)

> 💡 **Catatan PM:** Sengaja saya pisahkan out-of-scope secara eksplisit. Ini kebiasaan penting — banyak proyek mahasiswa gagal selesai karena scope terus membengkak ("scope creep"). MVP dulu, baru iterasi.

### 1.5 User Stories per Fitur Utama

**Penaruh (Deposit/Restock)**
> Sebagai panitia, saya ingin menaruh barang baru atau menambah stok barang lama, agar inventaris tercatat dan tersedia untuk dipakai panitia lain.

**Pengambil (Take — Consumable)**
> Sebagai panitia, saya ingin mengambil barang habis pakai (misal: double tape, kabel ties) dari katalog, agar stok berkurang otomatis dan saya tidak perlu lapor manual.

**Peminjam (Borrow — Non-Consumable)**
> Sebagai panitia, saya ingin meminjam barang yang harus dikembalikan (misal: proyektor, kabel HDMI), agar sistem tahu barang tersebut sedang "dipakai" bukan "habis".

**Pengembali (Return)**
> Sebagai panitia, saya ingin mengembalikan barang yang saya pinjam, agar stok "Tersedia" bertambah kembali dan barang siap dipinjam orang lain.

### 1.6 Functional Requirements Ringkas

| ID | Requirement | Prioritas |
|---|---|---|
| FR-1 | Katalog menampilkan foto, nama, sisa stok real-time | Must |
| FR-2 | User bisa menambahkan >1 barang ke cart dengan kuantitas berbeda sebelum checkout | Must |
| FR-3 | Sistem membedakan alur consumable vs non-consumable secara otomatis dari data barang | Must |
| FR-4 | Stok consumable = 0 → status barang otomatis "archived" (tidak tampil di katalog aktif) | Must |
| FR-5 | Foto bukti transaksi dikompresi di frontend (~200KB) sebelum upload ke Supabase Storage | Must |
| FR-6 | Riwayat transaksi tersimpan dan bisa ditelusuri per barang/per user | Should |
| FR-7 | Filter/search katalog berdasarkan nama atau kategori | Should |
| FR-8 | Admin bisa koreksi manual stok jika terjadi selisih | Could |

### 1.7 Non-Functional Requirements
- **Performance:** Katalog harus load < 2 detik dengan koneksi 4G biasa.
- **Reliability:** Update stok harus atomik — jika ada 2 orang checkout bersamaan, tidak boleh terjadi *race condition* (stok minus).
- **Usability:** Mobile-first. Asumsikan mayoritas panitia akses dari HP saat acara berlangsung.
- **Cost-efficiency:** Kompresi gambar wajib ada karena kuota Supabase Storage free-tier terbatas.

### 1.8 Success Metrics (Definisi "Berhasil")
- 0 kasus stok minus (data konsisten) dalam 1 bulan pertama.
- Waktu rata-rata melakukan 1 transaksi < 30 detik.
- Tidak ada lagi entry manual di Google Sheets setelah go-live.

---

## BAGIAN 2: SKEMA RELASI DATABASE (Supabase / PostgreSQL)

### 2.1 Gambaran ERD (Text-based)

```
items                    transactions                transaction_details
┌─────────────────┐      ┌──────────────────┐        ┌──────────────────────┐
│ id (PK)          │      │ id (PK)           │        │ id (PK)               │
│ name             │      │ transaction_type  │        │ transaction_id (FK)   │──┐
│ description      │      │ actor_name        │◄──┐    │ item_id (FK)          │──┼──┐
│ photo_url        │      │ event_name        │   │    │ quantity              │  │  │
│ is_consumable    │      │ proof_photo_url    │   │    │ direction             │  │  │
│ stock_available   │      │ notes              │   │    │ created_at            │  │  │
│ stock_in_use      │      │ created_at         │   │    └──────────────────────┘  │  │
│ unit             │      └──────────────────┘   │                               │  │
│ status           │◄────────────────────────────┼───────────────────────────────┘  │
│ created_at        │                              └───────────────────────────────────┘
│ updated_at        │
└─────────────────┘
```

> Relasi: **1 transaksi → banyak transaction_details** (karena 1x checkout bisa berisi banyak barang dari cart). **1 item → banyak transaction_details** (histori pemakaian barang tersebut).

### 2.2 Tabel: `items`

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | `uuid` (PK, default `gen_random_uuid()`) | Primary key |
| `name` | `text`, not null | Nama barang |
| `description` | `text`, nullable | Deskripsi opsional |
| `photo_url` | `text`, nullable | URL foto dari Supabase Storage |
| `is_consumable` | `boolean`, not null, default `true` | `true` = habis pakai, `false` = pinjam-kembali |
| `stock_available` | `integer`, not null, default `0`, `CHECK (stock_available >= 0)` | Stok siap pakai/pinjam |
| `stock_in_use` | `integer`, not null, default `0`, `CHECK (stock_in_use >= 0)` | Khusus non-consumable: jumlah sedang dipinjam |
| `unit` | `text`, default `'pcs'` | Satuan barang |
| `status` | `text`, default `'active'`, `CHECK (status IN ('active','archived'))` | Untuk soft-delete |
| `event_name` | `text`, nullable | Barang ini milik/dipakai event yang mana (opsional, tergantung kebutuhan) |
| `created_at` | `timestamptz`, default `now()` | |
| `updated_at` | `timestamptz`, default `now()` | |

> 💡 **Kenapa `is_consumable` boolean, bukan tabel kategori terpisah?** Untuk MVP, boolean sudah cukup dan menghindari over-normalization. Kalau nanti butuh kategori lebih kompleks (misal: "elektronik", "ATK", dst), baru tambahkan kolom `category` terpisah — jangan desain berlebihan di awal.

### 2.3 Tabel: `transactions`

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | `uuid` (PK) | Primary key |
| `transaction_type` | `text`, not null, `CHECK (transaction_type IN ('penaruh','pengambil','peminjam','pengembali'))` | 4 jenis aksi |
| `actor_name` | `text`, not null | Nama panitia yang melakukan transaksi |
| `event_name` | `text`, nullable | Transaksi ini untuk event yang mana |
| `proof_photo_url` | `text`, nullable | Foto bukti (setelah dikompresi) |
| `notes` | `text`, nullable | Catatan tambahan |
| `created_at` | `timestamptz`, default `now()` | |

> Ini adalah tabel **header**. Satu baris di sini = satu kali proses "Checkout", meskipun isinya beberapa barang sekaligus.

### 2.4 Tabel: `transaction_details`

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | `uuid` (PK) | Primary key |
| `transaction_id` | `uuid`, FK → `transactions.id`, `ON DELETE CASCADE` | |
| `item_id` | `uuid`, FK → `items.id` | |
| `quantity` | `integer`, not null, `CHECK (quantity > 0)` | Jumlah barang di baris cart ini |
| `created_at` | `timestamptz`, default `now()` | |

> Ini adalah tabel **detail/isi keranjang** yang tersimpan. Kalau user checkout 3 barang sekaligus, akan ada 1 baris di `transactions` dan 3 baris di `transaction_details`.

### 2.5 Logika Otomatis (Automasi Stok)

Untuk requirement "Logic Database Otomatis", saya sarankan pakai **Postgres Function (RPC)**, bukan trigger biasa. Alasannya: 1x checkout bisa berisi banyak barang sekaligus (dari cart), dan proses insert transaksi + update semua stok itu **harus atomik** — kalau ada 1 barang gagal (misal stok kurang), semua proses harus dibatalkan (rollback), bukan setengah-setengah.

```sql
-- Ini akan dibahas detail di Roadmap Fase 5,
-- tapi gambaran besarnya seperti ini:

CREATE OR REPLACE FUNCTION process_checkout_transaction(
  p_transaction_type text,
  p_actor_name text,
  p_event_name text,
  p_proof_photo_url text,
  p_cart_items jsonb -- contoh: [{"item_id": "...", "quantity": 2}, ...]
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  v_transaction_id uuid;
  v_cart_item jsonb;
BEGIN
  -- 1. Buat header transaksi
  INSERT INTO transactions (transaction_type, actor_name, event_name, proof_photo_url)
  VALUES (p_transaction_type, p_actor_name, p_event_name, p_proof_photo_url)
  RETURNING id INTO v_transaction_id;

  -- 2. Loop setiap item di cart, insert detail + update stok
  FOR v_cart_item IN SELECT * FROM jsonb_array_elements(p_cart_items)
  LOOP
    INSERT INTO transaction_details (transaction_id, item_id, quantity)
    VALUES (
      v_transaction_id,
      (v_cart_item->>'item_id')::uuid,
      (v_cart_item->>'quantity')::integer
    );

    -- Logika stok berbeda tergantung jenis transaksi
    -- (detail lengkap ada di Fase 5 roadmap)
  END LOOP;

  RETURN v_transaction_id;
END;
$$;
```

> Ini baru kerangka besarnya saja — kita akan lengkapi logika `IF` per jenis transaksi bareng-bareng di Fase 5 roadmap, supaya kamu paham *step by step*, bukan cuma copy-paste.

### 2.6 Catatan Row Level Security (RLS)
Supabase mewajibkan RLS aktif untuk keamanan. Untuk MVP dengan 60 user internal, opsi paling sederhana:
- Aktifkan RLS di semua tabel.
- Buat 1 policy `SELECT` untuk semua orang (public read katalog).
- Buat policy `INSERT`/`UPDATE` hanya untuk user yang sudah login (pakai Supabase Auth, meskipun cuma simple magic-link/email login).

Kita bahas ini lebih detail di Fase 7 roadmap.

---

## BAGIAN 3: SETUP KERJA DENGAN ANTIGRAVITY

Karena kamu akan pakai **Google Antigravity** (IDE agent-first, forked dari VS Code, ditenagai Gemini) sebagai partner ngoding, peran kamu berubah dari "penulis kode baris-per-baris" menjadi **"Prompt Engineer + Code Reviewer + System Architect"**. Ini pergeseran yang wajar di 2026 — tapi risikonya, kalau kamu asal terima semua hasil generate tanpa mengerti, kamu cuma jadi "operator", bukan "engineer". PRD dan skema database di Bagian 1 & 2 tetap jadi acuan utama — itu nggak berubah walau alat ngoding-nya beda.

### 3.1 Mode Autonomy yang Direkomendasikan
Antigravity punya beberapa mode kerja agent. Untuk tujuan **belajar** (bukan cuma ngebut selesai), saya sarankan:

| Fase Proyek | Mode yang Disarankan | Alasan |
|---|---|---|
| Fase 0–2 (Setup & fondasi) | **Review-driven development** | Kamu masih perlu lihat & pahami tiap langkah — dari struktur folder sampai koneksi Supabase. |
| Fase 3–6 (Fitur inti) | **Review-driven development** | Ini jantung aplikasi kamu (cart, logic stok). Jangan biarkan agent jalan otonom penuh di bagian krusial. |
| Fase 7–9 (Auth, testing, deploy) | Boleh naik ke **Agent-driven** untuk task repetitif (misal generate test case), tapi tetap review sebelum deploy production. |

> ⚠️ **Jangan langsung pakai "Agent-driven" (otonom penuh) di seluruh proyek**, apalagi untuk logika stok di Fase 5. Ini bagian paling gampang salah kalau agent nggak paham konteks bisnis kamu (consumable vs non-consumable) — dan salah di sini artinya data inventaris kamu berantakan.

### 3.2 Setup File `AGENTS.md` (Wajib Sebelum Mulai)
Antigravity membaca file `AGENTS.md` di root project sebagai instruksi standar yang selalu diikuti agent di setiap task — ini pengganti peran "Coding Standard" yang biasanya saya jelaskan manual. Buat file ini **sebelum prompt pertama kamu**:

```markdown
# AGENTS.md — Gudang RTB

## Konteks Proyek
Aplikasi manajemen inventaris untuk ±60 panitia dari 6 event.
Tech stack: React (Vite) + Supabase (PostgreSQL & Storage) + Vercel.
Skema database: tabel `items`, `transactions`, `transaction_details` (lihat /docs/db-schema.md).

## Aturan Bisnis Krusial (JANGAN DILANGGAR)
- Barang punya 2 tipe: consumable (habis pakai) dan non-consumable (pinjam-kembali).
- Consumable: stok berkurang saat "Pengambil" ambil. Jika stock_available = 0 → status jadi 'archived'.
- Non-consumable: saat dipinjam, stock_available berkurang DAN stock_in_use bertambah.
  Saat dikembalikan, sebaliknya. Total (available + in_use) harus selalu konsisten.
- Semua perubahan stok WAJIB atomik (gunakan Postgres function/RPC, bukan multiple client-side calls terpisah).

## Standar Kode
- Nama variabel dan fungsi harus deskriptif dan eksplisit.
  Contoh benar: `handleCheckoutTransaction`, `isItemConsumable`.
  Contoh salah: `fn1`, `chk`, `data2`.
- Setiap fungsi wajib punya JSDoc comment (/** ... */) yang menjelaskan tujuan, parameter, dan return value.
- Inline comment (// ...) HANYA untuk logika yang kompleks, jelaskan "mengapa", bukan "apa".
- Jangan generate kode tanpa penjelasan singkat di chat tentang pendekatan yang diambil.

## Batasan
- Jangan install package baru tanpa menyebutkan alasannya di chat terlebih dahulu.
- Jangan ubah skema database tanpa konfirmasi eksplisit dari saya.
- Utamakan kesederhanaan (MVP) di atas fitur tambahan yang belum diminta.
```

Simpan sebagai `AGENTS.md` di root project. Setiap kali kamu buka task baru di Antigravity, agent akan otomatis membaca ini duluan — jadi kamu nggak perlu ketik ulang standar ini di setiap prompt.

### 3.3 Alur Kerja per Task (Pola yang Akan Kita Pakai di Tiap Fase)
1. **Kamu kasih prompt** (contoh disediakan per fase di Bagian 4).
2. **Agent merencanakan & generate kode** — perhatikan "Plan"-nya sebelum eksekusi kalau mode Review-driven.
3. **Kamu review pakai checklist** yang saya sediakan per fase — ini bagian paling penting biar kamu belajar, bukan cuma nerima.
4. **Tanya balik ke agent** hal yang belum kamu pahami — contoh: *"Jelaskan kenapa kamu pakai useEffect di sini, bukan useMemo"*. Ini gratis dan justru bagian dari proses belajar.
5. **Jalankan & test manual** — jangan cuma percaya laporan "berhasil" dari agent, terutama untuk Fase 5 (logika stok).

---

## BAGIAN 4: DEVELOPMENT ROADMAP (Prompt-Driven Learning)

Format tiap fase: **Tujuan Belajar** → **Prompt untuk Antigravity** → **Checklist Review** (wajib kamu cek sebelum lanjut) → **Tantangan Mandiri**.

### 🎯 Fase 0 — Fondasi Sebelum Ngoding
**Tujuan belajar:** Biasakan diri berpikir seperti engineer sebelum delegasi ke agent.
- Gambar ulang ERD di Bagian 2 pakai tangan/draw.io — jangan cuma baca, tulis ulang biar nempel.
- Install Node.js (LTS) dan Antigravity dari antigravity.google.
- Buat akun Supabase & Vercel (gratis).
- Buat file `AGENTS.md` sesuai Bagian 3.2.

**🧩 Tantangan mandiri:** Sebelum lanjut, jawab sendiri (jangan tanya agent): "Kenapa `transaction_details` perlu jadi tabel terpisah, bukan langsung kolom di `transactions`?"

---

### 🎯 Fase 1 — Setup Project React + Vite
**Tujuan belajar:** Memahami struktur project modern React, walau yang generate adalah agent.

**🗣️ Prompt untuk Antigravity:**
```
Buatkan project React dengan Vite bernama "gudang-rtb". Setup struktur folder:
src/components, src/pages, src/lib, src/hooks. Jangan install library UI/styling
dulu, saya mau tambahkan sendiri nanti. Jelaskan singkat fungsi tiap folder
setelah selesai.
```

**🔍 Checklist review:**
- [ ] Jalankan `npm run dev` sendiri di terminal — jangan minta agent yang jalankan lalu kamu skip.
- [ ] Buka `vite.config.js`, pastikan kamu paham minimal 3 baris isinya.
- [ ] Pastikan struktur folder sesuai permintaan (bukan struktur default yang beda).

**🧩 Tantangan mandiri:** Ubah manual (bukan lewat agent) satu teks di `App.jsx`, simpan, lihat Hot Module Replacement bekerja. Rasakan langsung feedback loop-nya.

---

### 🎯 Fase 2 — Koneksi ke Supabase
**Tujuan belajar:** Memahami cara frontend "berbicara" dengan backend-as-a-service.

- Buat project Supabase & jalankan SQL dari Bagian 2 **secara manual** lewat SQL Editor Supabase (bagian ini sengaja jangan diserahkan ke agent — kamu perlu paham betul skema database kamu sendiri).

**🗣️ Prompt untuk Antigravity (setelah tabel dibuat manual):**
```
Buatkan file src/lib/supabaseClient.js untuk inisialisasi koneksi Supabase
menggunakan @supabase/supabase-js. Gunakan environment variable
VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY. Ikuti standar JSDoc di AGENTS.md.
```

**🔍 Checklist review:**
- [ ] Pastikan agent TIDAK menaruh URL/key Supabase langsung di kode (harus dari `.env.local`).
- [ ] Cek `.env.local` sudah masuk `.gitignore` — ini sering terlewat, termasuk oleh AI agent.
- [ ] Test manual: `console.log` hasil `supabase.from('items').select('*')`.

**🧩 Tantangan mandiri:** Tanya ke agent: *"Apa bedanya anon key dan service role key di Supabase, dan kenapa kita cuma pakai anon key di frontend?"* — pastikan jawabannya masuk akal buat kamu sebelum lanjut.

---

### 🎯 Fase 3 — Komponen Katalog Barang (Gallery View)
**Tujuan belajar:** Component-based thinking, walau kodenya digenerate agent.

**🗣️ Prompt untuk Antigravity:**
```
Buatkan komponen ItemCard.jsx (menampilkan foto, nama, sisa stok) dan
ItemCatalog.jsx yang fetch data dari tabel items via Supabase lalu me-render
banyak ItemCard dalam grid responsif (mobile-first). Sertakan loading state
dan empty state. Ikuti standar kode di AGENTS.md.
```

Manfaatkan **Browser Subagent** Antigravity di sini — minta agent membuka aplikasi di browser bawaan, ambil screenshot, dan verifikasi tampilan grid benar-benar responsif di ukuran mobile.

**🔍 Checklist review:**
- [ ] Buka `ItemCard.jsx` dan `ItemCatalog.jsx`, pastikan kamu bisa jelaskan alur data dari fetch → state → render dengan kata-katamu sendiri.
- [ ] Cek ada JSDoc di setiap fungsi (sesuai AGENTS.md) — kalau tidak ada, minta agent lengkapi.
- [ ] Test manual di ukuran layar HP asli, jangan cuma percaya screenshot dari Browser Subagent.

**🧩 Tantangan mandiri:** Minta agent tambahkan fitur search sederhana, TAPI sebelum generate, coba tulis dulu pseudocode-nya sendiri di kertas. Bandingkan pendekatanmu dengan hasil agent.

---

### 🎯 Fase 4 — Cart System (Keranjang)
**Tujuan belajar:** State management lintas komponen — konsep paling penting di React, dan paling gampang "hilang" kalau langsung terima kode jadi tanpa dibaca.

**🗣️ Prompt untuk Antigravity:**
```
Buatkan CartContext.jsx menggunakan React Context API (bukan library eksternal)
dengan fungsi addToCart, removeFromCart, updateQuantity, clearCart. Validasi:
kuantitas di cart tidak boleh melebihi stock_available item. Buatkan juga
CartDrawer.jsx untuk menampilkan isi keranjang. Ikuti standar kode di AGENTS.md.
```

**🔍 Checklist review:**
- [ ] Baca `CartContext.jsx` baris per baris — pastikan kamu paham `useContext`, `useReducer`/`useState` yang dipakai.
- [ ] Cek validasi kuantitas benar-benar jalan (coba tambah quantity melebihi stok, harus tertolak).
- [ ] Pastikan cart TIDAK disimpan ke `localStorage` (agent kadang default ke ini) — untuk kasus shared device saat event, cart harus reset per sesi.

**🧩 Tantangan mandiri:** Minta agent menjelaskan kodenya dengan prompt: *"Jelaskan alur data CartContext ini seolah saya belum pernah belajar Context API."* Kalau penjelasannya masih belum jelas buatmu, tanya lebih spesifik sampai benar-benar paham — jangan lanjut ke Fase 5 sebelum ini clear.

---

### 🎯 Fase 5 — Logika Transaksi & Database Otomatis
**Tujuan belajar:** Bagian paling krusial dan paling berisiko kalau cuma "percaya" ke agent — memahami atomicity.

**🗣️ Prompt untuk Antigravity:**
```
Lengkapi Postgres function process_checkout_transaction (draft ada di
/docs/db-schema.md) dengan logika per transaction_type:
- pengambil: kurangi stock_available; jika hasil 0, set status = 'archived'.
- peminjam: kurangi stock_available, tambah stock_in_use dengan jumlah sama.
- pengembali: tambah stock_available, kurangi stock_in_use dengan jumlah sama.
- penaruh: tambah stock_available.
Pastikan seluruh proses berjalan dalam satu transaction (atomik), dan tolak
transaksi jika stock_available tidak cukup. Jelaskan function ini baris per
baris setelah selesai.
```

**🔍 Checklist review (WAJIB, ini bagian paling penting di seluruh proyek):**
- [ ] Minta agent jelaskan function ini baris per baris — jangan skip bagian ini.
- [ ] Test manual skenario: checkout barang dengan stok pas-pasan, checkout melebihi stok (harus gagal & rollback, bukan stok jadi minus).
- [ ] Test manual skenario race condition: buka 2 tab, checkout barang yang sama nyaris bersamaan.
- [ ] Pastikan kamu bisa gambar ulang alur logika ini di kertas TANPA melihat kode — kalau belum bisa, berarti belum benar-benar paham, tanya lagi ke agent dengan sudut pandang berbeda.

**🧩 Tantangan mandiri:** Coba secara sengaja rusak logikanya (misal komentari validasi stok), lalu jalankan skenario race condition di atas. Amati apa yang terjadi. Ini cara paling efektif memahami *kenapa* validasi itu penting.

---

### 🎯 Fase 6 — Client-Side Image Compression
**Tujuan belajar:** Optimasi performa & biaya di sisi frontend.

**🗣️ Prompt untuk Antigravity:**
```
Buatkan fungsi utilitas compressImageFile di src/lib/imageCompression.js
menggunakan library browser-image-compression. Target ukuran akhir ~200KB,
maxWidthOrHeight 1024px, gunakan web worker agar UI tidak freeze. Sertakan
JSDoc sesuai AGENTS.md. Integrasikan ke form upload bukti transaksi sebelum
supabase.storage.upload() dipanggil.
```

**🔍 Checklist review:**
- [ ] Bandingkan `file.size` sebelum & sesudah kompresi lewat `console.log` manual — jangan percaya klaim agent begitu saja.
- [ ] Cek apakah agent menaruh komentar di bagian `useWebWorker` menjelaskan "kenapa", sesuai standar AGENTS.md.
- [ ] Upload foto 5MB asli, pastikan hasil akhir benar-benar mendekati 200KB dan kualitas masih layak.

**🧩 Tantangan mandiri:** Eksperimen ubah parameter `maxSizeMB` secara manual (bukan minta agent), amati efeknya ke kualitas foto. Ini bagian yang lebih cepat dipahami lewat coba-coba sendiri daripada dijelaskan.

---

### 🎯 Fase 7 — Autentikasi & Role Sederhana
**Tujuan belajar:** Dasar auth di aplikasi real-world.

**🗣️ Prompt untuk Antigravity:**
```
Setup Supabase Auth dengan Email Magic Link untuk aplikasi ini. Buatkan RLS
policy: SELECT terbuka untuk semua (public read katalog), INSERT/UPDATE hanya
untuk user yang sudah login. Jelaskan setiap policy yang dibuat.
```

**🔍 Checklist review:**
- [ ] Test akses data lewat curl/Postman TANPA token auth — pastikan RLS benar-benar memblokir.
- [ ] Baca tiap RLS policy yang digenerate, pastikan kamu paham bahasa SQL-nya (biasanya cukup pendek).

**🧩 Tantangan mandiri:** Coba login dari device lain, pastikan sesi tidak tercampur antar user.

---

### 🎯 Fase 8 — Testing, Edge Case, & Polish UI
**Tujuan belajar:** Mentalitas QA — proyek nggak selesai cuma karena "berhasil di happy path".

**🗣️ Prompt untuk Antigravity:**
```
Gunakan Browser Subagent untuk menguji alur checkout end-to-end: cart kosong,
stok = 0, kuantitas negatif, upload foto >10MB. Laporkan hasil tiap skenario
dan perbaiki bug yang ditemukan. Tambahkan loading spinner dan toast
notification untuk feedback sukses/gagal.
```

**🔍 Checklist review:**
- [ ] Jangan hanya percaya laporan "semua lolos" dari agent — ulangi minimal 3 skenario secara manual.
- [ ] Buat daftar 5 edge case versi kamu sendiri (dari sudut pandang panitia buru-buru saat acara), minta agent uji itu juga.

**🧩 Tantangan mandiri:** Temukan satu bug sendiri (bukan dari daftar agent) sebelum lanjut ke deployment.

---

### 🎯 Fase 9 — Deployment ke Vercel
**Tujuan belajar:** CI/CD dasar — dari kode di laptop sampai bisa diakses publik.

- Push project ke GitHub **secara manual** (perintah git dasar wajib kamu jalankan sendiri, bukan lewat agent — ini skill yang harus melekat di tangan, bukan cuma di prompt).
- Connect repository ke Vercel, setup Environment Variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).
- Deploy, lalu test end-to-end di URL production.

**🔍 Checklist review:**
- [ ] Pastikan `.env.local` TIDAK ter-commit ke GitHub (cek riwayat commit).
- [ ] Test dari HP via jaringan seluler asli (bukan WiFi kampus).

**🧩 Tantangan mandiri:** Coba jelaskan ke teman (atau tulis singkat) alur deployment ini dari awal sampai akhir tanpa membuka dokumentasi. Kalau lancar, kamu sudah benar-benar paham, bukan cuma ngikutin instruksi.

---

## BAGIAN 5: STANDAR KODE (Coding Standard)

Ini aturan yang **akan saya ikuti setiap kali memberi contoh kode** ke kamu selanjutnya:

1. **Naming eksplisit & deskriptif** — nama fungsi/variabel harus menjelaskan dirinya sendiri tanpa perlu komentar tambahan.
2. **JSDoc di atas setiap fungsi** — menjelaskan tujuan, parameter, dan return value.
3. **Inline comment HANYA untuk logika kompleks** — menjelaskan "mengapa", bukan mengulang apa yang sudah jelas dari kode itu sendiri.

### Contoh Penerapan (Preview)

```javascript
/**
 * Mengompresi file gambar di sisi klien sebelum diunggah ke Supabase Storage.
 * Bertujuan menghemat kuota penyimpanan dan mempercepat proses upload.
 *
 * @param {File} originalImageFile - File gambar asli dari input pengguna.
 * @param {number} targetSizeInMB - Target maksimal ukuran file setelah kompresi.
 * @returns {Promise<File>} File gambar yang sudah dikompresi.
 */
async function compressImageFile(originalImageFile, targetSizeInMB = 0.2) {
  const compressionOptions = {
    maxSizeMB: targetSizeInMB,
    maxWidthOrHeight: 1024,
    useWebWorker: true, // Menjalankan proses kompresi di thread terpisah
                         // agar UI tidak freeze saat memproses gambar besar.
  };

  const compressedImageFile = await imageCompression(originalImageFile, compressionOptions);
  return compressedImageFile;
}
```

```javascript
/**
 * Menentukan apakah sebuah barang termasuk kategori consumable (habis pakai)
 * berdasarkan data yang tersimpan di database.
 *
 * @param {object} item - Objek barang dari tabel `items`.
 * @returns {boolean} True jika barang bersifat habis pakai.
 */
function isItemConsumable(item) {
  return item.is_consumable === true;
}
```

> Perhatikan: nama seperti `compressImageFile` dan `isItemConsumable` langsung menjelaskan fungsinya tanpa perlu baca isi kodenya dulu — ini yang disebut *self-documenting code*. Komentar inline saya taruh hanya di baris `useWebWorker` karena itu bagian yang tidak jelas kalau cuma baca nama variabelnya saja (perlu penjelasan "kenapa").

---

## Ringkasan Urutan Belajar

```
Fase 0 (Fondasi) → Fase 1 (Setup Vite) → Fase 2 (Supabase) → Fase 3 (Katalog)
→ Fase 4 (Cart) → Fase 5 (Logic Transaksi) → Fase 6 (Kompresi Gambar)
→ Fase 7 (Auth) → Fase 8 (Testing) → Fase 9 (Deploy)
```

Setiap fase saya rancang supaya kamu bisa lanjut chat terpisah dan bilang, misalnya: *"Mentor, saya mau mulai Fase 3, tolong pandu step-by-step buat komponen ItemCard"* — dan saya akan lanjutkan dari situ dengan gaya mentoring yang sama, lengkap dengan contoh kode sesuai standar di Bagian 4.

Selamat membangun Gudang RTB! 🚀
