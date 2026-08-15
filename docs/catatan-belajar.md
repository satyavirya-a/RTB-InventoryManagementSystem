# 📚 Catatan Belajar — Gudang RTB
### Dokumentasi Teknis & Penjelasan Konsep per Fase

> File ini adalah jurnal belajarmu. Setiap kali ada kode baru dibuat,
> penjelasannya akan ditambahkan di sini. Baca ini sebelum dan sesudah
> kamu review kode yang digenerate.

---

## Daftar Isi
1. [Fase 1 — Setup Project React + Vite](#fase-1--setup-project-react--vite)
   - [Apa itu Vite?](#apa-itu-vite)
   - [Struktur Folder](#struktur-folder-dan-fungsinya)
   - [Alur Render React](#alur-render-react-dari-html-ke-layar)
   - [CSS Variables & Design Tokens](#css-variables--design-tokens)
   - [.gitignore & Keamanan Secret Key](#gitignore--keamanan-secret-key)
2. [Fase 2 — Koneksi Supabase](#fase-2--koneksi-supabase) *(akan diisi)*
3. [Fase 3 — Katalog Barang](#fase-3--katalog-barang) *(akan diisi)*
4. [Fase 4 — Cart System](#fase-4--cart-system) *(akan diisi)*
5. [Fase 5 — Logika Transaksi](#fase-5--logika-transaksi) *(akan diisi)*

---

## Fase 1 — Setup Project React + Vite

### Apa itu Vite?

**Vite** (dibaca "veet", bahasa Perancis artinya "cepat") adalah *build tool* modern untuk frontend. Tugasnya ada dua:

1. **Saat development** (`npm run dev`): Menjalankan server lokal yang sangat cepat dengan fitur **Hot Module Replacement (HMR)** — kalau kamu simpan perubahan di file, browser langsung update tanpa perlu refresh penuh.

2. **Saat production** (`npm run build`): Menggabungkan dan mengoptimalkan semua file JavaScript, CSS, dan aset menjadi bundle yang efisien untuk di-deploy.

**Kenapa bukan Create React App (CRA)?**
CRA sudah deprecated (tidak lagi dirawat). Vite jauh lebih cepat karena menggunakan ES Modules native browser, bukan bundling dulu seperti Webpack yang dipakai CRA.

```
CRA  → Bundel SEMUA file dulu → baru tampilkan di browser (lambat)
Vite → Langsung serve file via ES Modules → bundel hanya kalau diminta (cepat)
```

---

### Struktur Folder dan Fungsinya

```
RTB-InventoryManagementSystem/
├── index.html              ← Pintu masuk HTML — HANYA ADA SATU di seluruh project
├── vite.config.js          ← Konfigurasi Vite
├── package.json            ← "Kartu identitas" project: nama, versi, daftar library
├── .gitignore              ← Daftar file yang TIDAK masuk ke Git
├── .env.example            ← Template variabel lingkungan (AMAN di-commit)
│
└── src/                    ← Semua kode sumber yang kamu tulis ada di sini
    ├── main.jsx            ← Titik masuk JavaScript — di sinilah React "dihidupkan"
    ├── App.jsx             ← Komponen root: induk dari semua komponen lain
    ├── index.css           ← CSS global: reset, design tokens, utility classes
    │
    ├── components/         ← Komponen UI yang bisa dipakai ulang (reusable)
    ├── pages/              ← Satu file = satu halaman/route aplikasi
    ├── lib/                ← Utilitas & infrastruktur (bukan UI): koneksi DB, helpers
    └── hooks/              ← Custom React Hooks: logika stateful yang reusable
```

**Analogi sederhana:**
- `pages/` = ruangan-ruangan di gedung (Ruang Katalog, Ruang Transaksi)
- `components/` = furnitur yang sama dipakai di banyak ruangan (meja, kursi)
- `lib/` = instalasi listrik & air — krusial tapi tidak terlihat langsung
- `hooks/` = remote control — mengontrol state dari jarak jauh

---

### Alur Render React (Dari HTML ke Layar)

Ini adalah salah satu konsep paling fundamental yang wajib kamu pahami sebelum lanjut:

```
Browser buka URL
      ↓
1. Browser baca index.html
      ↓
2. Browser temukan <div id="root"> (awalnya KOSONG)
      ↓
3. Browser jalankan <script src="/src/main.jsx">
      ↓
4. main.jsx: createRoot(document.getElementById('root'))
   → React "mengambil alih" div#root
      ↓
5. main.jsx: .render(<App />)
   → React menggambar komponen <App /> ke dalam div#root
      ↓
6. App.jsx render HTML-nya → tampil di layar
```

**Poin penting:** Kalau kamu inspect element di browser dan lihat `<div id="root">`, kamu akan temukan semua HTML aplikasi React ada DI DALAM div itu. React yang menaruhnya ke sana secara dinamis, bukan HTML statis.

**Kenapa `StrictMode` di main.jsx bikin fungsi dipanggil 2x?**

```jsx
// Di main.jsx:
<StrictMode>
  <App />
</StrictMode>
```

StrictMode adalah alat deteksi bug dari React. Di mode development, React sengaja menjalankan beberapa lifecycle function **dua kali** untuk memastikan kode kamu tidak punya *side effects* yang tidak sengaja. Ini **NORMAL** — di production build, StrictMode tidak aktif dan semuanya berjalan sekali.

Jangan hapus StrictMode hanya karena `useEffect` kamu jalan 2x — itu pertanda kamu perlu perbaiki kodenya, bukan hilangkan StrictMode-nya.

---

### CSS Variables & Design Tokens

Di `src/index.css`, kita mendefinisikan **CSS Custom Properties** (dikenal juga sebagai CSS Variables) di dalam selector `:root`:

```css
:root {
  --color-primary: hsl(217, 91%, 60%);
  --space-4: 16px;
  --font-size-base: 1rem;
}
```

**Kenapa ini penting?**

1. **Konsistensi**: Seluruh aplikasi pakai warna yang sama karena pakai variabel yang sama. Kalau mau ganti warna utama, cukup ubah satu baris di `:root`.

2. **Bisa diubah via JavaScript**: Ini kemampuan yang tidak dimiliki preprocessor CSS seperti Sass/LESS. Berguna untuk fitur dark/light mode toggle di masa depan:
   ```js
   document.documentElement.style.setProperty('--color-primary', 'hsl(270, 91%, 60%)')
   ```

3. **Dibaca seperti dokumentasi**: Nama seperti `--color-success` dan `--space-4` lebih bermakna daripada hardcode `#22c55e` dan `16px` di mana-mana.

**Kenapa pakai HSL, bukan HEX (#ff0000)?**

HSL = **H**ue (0-360°) + **S**aturation (%) + **L**ightness (%)

```css
/* Susah dibayangkan: */
--color-primary: #3b82f6;

/* Lebih mudah dibayangkan: */
--color-primary: hsl(217, 91%, 60%);  /* Biru, sangat vivid, agak terang */

/* Membuat variasi jadi mudah — hanya ubah Lightness: */
--color-primary-dark: hsl(217, 91%, 48%);  /* Lebih gelap untuk hover */
```

---

### .gitignore & Keamanan Secret Key

Ini bukan sekadar "best practice" — ini **kritis untuk keamanan**.

**Skenario bahaya yang nyata:**

1. Kamu lupa tambahkan `.env.local` ke `.gitignore`
2. Kamu push ke GitHub (bahkan repository private)
3. Seseorang mendapat akses ke repo → mereka punya `VITE_SUPABASE_ANON_KEY` kamu
4. Mereka bisa read/write database Supabase kamu sesuai RLS policy yang ada

**Yang BOLEH di-commit:**
- ✅ `.env.example` — hanya berisi contoh, TIDAK ADA nilai asli
- ✅ Semua file kode sumber (`.jsx`, `.css`, `.js`)

**Yang TIDAK BOLEH di-commit:**
- ❌ `.env.local` — berisi secret key asli
- ❌ `node_modules/` — besar (ratusan MB), bisa di-install ulang dengan `npm install`
- ❌ `dist/` — hasil build, bisa di-generate ulang dengan `npm run build`

**Cara cek apakah `.env.local` sudah aman:**
```bash
git status
# Pastikan .env.local TIDAK muncul di daftar "Changes to be committed"

git ls-files --others --exclude-standard
# File ini tidak boleh ada di output
```

---

### Cara Menjalankan Project

```bash
# 1. Install semua dependency (hanya perlu sekali, atau setelah pull dari Git)
npm install

# 2. Jalankan development server
npm run dev

# Aplikasi akan bisa diakses di: http://localhost:5173
```

Setelah `npm run dev` berjalan, kamu akan melihat output seperti ini di terminal:

```
  VITE v6.4.3  ready in 2636 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

Buka `http://localhost:5173` di browser, lalu coba:
- Ubah teks di `src/App.jsx` → simpan → lihat browser update **tanpa refresh** (ini HMR)
- Buka DevTools browser → Elements → lihat semua konten ada di dalam `<div id="root">`

---

### ⚠️ Troubleshooting — PowerShell Execution Policy (Windows)

Kalau kamu mendapat error seperti ini saat menjalankan `npm run dev`:

```
npx : File C:\Program Files\nodejs\npx.ps1 cannot be loaded because
running scripts is disabled on this system.
```

Ini bukan masalah kode — ini **konfigurasi keamanan Windows** yang memblokir script `.ps1`.
PowerShell secara default hanya mengizinkan script yang sudah ditandatangani secara digital.
Script `npm.ps1` tidak punya tanda tangan itu, sehingga diblokir.

**Solusi — pilih salah satu:**

**Opsi 1 (Recommended) — Fix permanen:**
Buka PowerShell sebagai **Administrator** (klik kanan → Run as administrator), lalu:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```
Ketik `Y` → Enter. Tutup terminal, buka baru, lalu `npm run dev` akan langsung bisa.

> `RemoteSigned` artinya: script lokal boleh jalan, tapi script dari internet tetap harus
> punya tanda tangan. Ini masih aman — bukan `Unrestricted` yang benar-benar membuka semua.

**Opsi 2 — Pakai Command Prompt (cmd):**
Buka terminal dengan tipe **Command Prompt** (bukan PowerShell), lalu ketik `npm run dev`.
Di cmd, tidak ada masalah Execution Policy.

**Opsi 3 — Pakai Git Bash:**
Klik kanan di folder project → **Git Bash Here**, lalu `npm run dev`.

---

### Git Workflow — Cara Kita Menyimpan Perubahan

#### Kenapa Commit Dipisah-pisah?

Di Fase 1 ini, kita membuat **5 commit terpisah**, bukan 1 commit besar. Ini bukan sekadar gaya — ada alasan teknis yang penting:

```
1 commit besar:  "setup semua hal di Fase 1"
                 → Kalau ada bug, sulit tahu PERUBAHAN MANA yang jadi penyebab

5 commit kecil:  commit per unit perubahan
                 → Kalau ada bug, bisa langsung "git revert" ke commit spesifik
                    tanpa menghapus perubahan lain yang tidak berkaitan
```

Analogi: bayangkan dokumen Word. Fitur "Track Changes" per paragraf jauh lebih berguna daripada satu entry "dokumen diubah".

---

#### Format Conventional Commits

Kita menggunakan standar [Conventional Commits](https://www.conventionalcommits.org/) untuk menulis pesan commit:

```
<type>: <deskripsi singkat>
```

| Type | Kapan dipakai | Contoh |
|---|---|---|
| `feat:` | Fitur atau fungsionalitas baru | `feat: buat entry point React` |
| `fix:` | Perbaikan bug | `fix: stok tidak update saat checkout` |
| `chore:` | Setup, konfigurasi, tidak ada kode logika | `chore: init project React + Vite` |
| `docs:` | Perubahan dokumentasi saja | `docs: tambah catatan-belajar.md` |
| `style:` | Perubahan tampilan/CSS saja | `style: setup design system global` |
| `refactor:` | Restrukturisasi kode tanpa ubah perilaku | `refactor: pisah CartContext ke file sendiri` |

**Contoh commit yang buruk (jangan ditiru):**
```bash
git commit -m "update"           # ← Apa yang di-update?
git commit -m "fix bug"          # ← Bug apa?
git commit -m "WIP"              # ← Work in Progress tidak boleh ke main branch
```

---

#### Cara Membaca Git Log

```bash
git log --oneline
```

Output yang akan kamu lihat:
```
fdf7f1c docs: tambah catatan-belajar.md dan implementation-plan.md
91bdfee style: setup design system global (CSS Variables, dark mode, Inter font)
6c6f81f feat: buat entry point React (main.jsx dan App.jsx)
9d052f1 chore: setup struktur folder src (components, pages, lib, hooks)
d7ce680 chore: init project React + Vite
1bfb22e Initial commit
```

- **7 karakter pertama** (`fdf7f1c`) = hash commit — ID unik setiap snapshot
- Dibaca dari **bawah ke atas** = urutan kronologis (terlama di bawah)

---

#### Riwayat Commit Fase 1 (Sudah di-push ke GitHub)

| Hash | Type | Pesan | File yang Diubah |
|---|---|---|---|
| `d7ce680` | `chore` | init project React + Vite | `package.json`, `vite.config.js`, `index.html`, `.gitignore`, `.env.example` |
| `9d052f1` | `chore` | setup struktur folder src | `src/components/`, `src/pages/`, `src/lib/`, `src/hooks/` |
| `6c6f81f` | `feat` | buat entry point React | `src/main.jsx`, `src/App.jsx` |
| `91bdfee` | `style` | setup design system global | `src/index.css` |
| `fdf7f1c` | `docs` | tambah catatan-belajar.md dan implementation-plan.md | `docs/catatan-belajar.md`, `docs/implementation-plan.md` |

> Semua commit di atas sudah tersimpan di:
> **https://github.com/satyavirya-a/RTB-InventoryManagementSystem**

---

#### Perintah Git Dasar yang Wajib Hafal

```bash
# Lihat status file (ada perubahan apa saja?)
git status

# Tambahkan file ke "staging area" (siap di-commit)
git add nama-file.js        # file spesifik
git add src/                # seluruh folder
git add .                   # semua file yang berubah

# Simpan snapshot (commit)
git commit -m "type: pesan singkat"

# Kirim ke GitHub
git push origin main

# Lihat riwayat commit (ringkas)
git log --oneline

# Lihat perubahan yang belum di-stage
git diff

# Lihat perubahan yang sudah di-stage (sudah git add, belum commit)
git diff --staged
```

---

## Fase 2 — Koneksi Supabase

### Apa itu Supabase?

**Supabase** adalah *Backend-as-a-Service* (BaaS) — artinya kamu mendapatkan backend siap pakai tanpa harus membangun server dari nol. Di baliknya, Supabase menggunakan **PostgreSQL** (database relasional yang sangat kuat) yang sudah dikonfigurasi untuk bisa diakses langsung dari browser.

```
Tanpa Supabase:   React → REST API buatan sendiri (Express/Node) → PostgreSQL
Dengan Supabase:  React → Supabase Client SDK              → PostgreSQL
                          (sudah include: auth, storage, realtime)
```

Yang kita pakai dari Supabase di project ini:
- **Database** (PostgreSQL) → menyimpan items, transactions, transaction_details
- **Storage** → menyimpan foto bukti transaksi
- **Auth** → login panitia (Fase 7)

---

### import.meta.env vs process.env

Ini salah satu perbedaan yang sering bikin bingung pemula:

| | `process.env` | `import.meta.env` |
|---|---|---|
| Dipakai di | Node.js (server-side) | Vite / browser |
| Cara baca `.env` | Otomatis | Prefix `VITE_` wajib ada |
| Kapan di-resolve | Saat runtime (server) | Saat build time (Vite bundling) |

```js
// Di Node.js / Express:
const url = process.env.SUPABASE_URL        // ✅ benar

// Di Vite / React:
const url = import.meta.env.VITE_SUPABASE_URL  // ✅ benar
const url = process.env.VITE_SUPABASE_URL      // ❌ undefined di browser
```

**Kenapa harus prefix `VITE_`?**
Vite sengaja tidak meng-expose semua env variable ke browser demi keamanan.
Hanya variable dengan prefix `VITE_` yang akan disertakan dalam bundle.
Variable tanpa prefix (misal `SECRET_KEY`) tidak akan bisa dibaca di browser.

---

### Anon Key vs Service Role Key

Di Supabase Dashboard → Settings → API, kamu akan menemukan 2 jenis key:

| Key | Dipakai di | Bisa melewati RLS? |
|---|---|---|
| `anon` (public) | Frontend / browser | ❌ Tidak — tunduk pada RLS |
| `service_role` | Backend / server saja | ✅ Ya — melewati semua RLS |

**Aturan keras:** `service_role` key **JANGAN PERNAH** dipakai di frontend.
Jika ter-commit ke GitHub atau ter-expose di browser, siapa pun bisa mengakses seluruh database kamu tanpa batasan.

Kita di project ini **hanya** pakai `anon` key di `supabaseClient.js`.

---

### Pola Singleton di supabaseClient.js

```js
// supabaseClient.js mengekspor SATU instance:
export const supabase = createClient(url, key)

// Semua komponen import dari file yang sama:
import { supabase } from '../lib/supabaseClient'   // ItemCard.jsx
import { supabase } from '../../lib/supabaseClient' // CatalogPage.jsx
```

Ini disebut pola **Singleton** — satu instance yang sama dipakai di seluruh aplikasi.
Kenapa tidak buat `createClient()` di setiap komponen yang butuh?
- Boros memori (setiap pemanggilan buat koneksi baru)
- State autentikasi tidak sinkron (user login di satu instance, tapi komponen lain tidak tahu)

---

### File yang Dibuat di Fase 2

| File | Peran |
|---|---|
| `docs/sql-schema.sql` | DDL 3 tabel + trigger + kerangka RPC function |
| `src/lib/supabaseClient.js` | Instance Supabase (pola Singleton) |
| `src/lib/constants.js` | Konstanta: jenis transaksi, nama event, status barang |

### Skema Database yang Dibuat

```
items                    transactions                transaction_details
┌──────────────────┐     ┌──────────────────┐        ┌─────────────────────┐
│ id (PK)          │     │ id (PK)          │        │ id (PK)             │
│ name             │     │ transaction_type │        │ transaction_id (FK) │→ transactions
│ description      │     │ actor_name       │        │ item_id (FK)        │→ items
│ photo_url        │     │ event_name       │        │ quantity            │
│ is_consumable    │     │ proof_photo_url  │        │ created_at          │
│ stock_available  │     │ notes            │        └─────────────────────┘
│ stock_in_use     │     │ created_at       │
│ unit             │     └──────────────────┘
│ status           │
│ event_name       │
│ created_at       │
│ updated_at       │
└──────────────────┘
```

---

### Row Level Security (RLS) — Keamanan di Level Baris Database

#### Apa itu RLS?

Saat kamu menjalankan SQL schema di Supabase, akan muncul popup:
> *"This query creates tables without enabling Row Level Security. Clients using anon or authenticated keys may be able to access these tables."*

Ini bukan error — ini **peringatan keamanan** dari Supabase.

**RLS** (Row Level Security) adalah lapisan keamanan di level PostgreSQL yang mengatur:
- Siapa boleh **SELECT** (membaca) baris data tertentu?
- Siapa boleh **INSERT** (menambah) data baru?
- Siapa boleh **UPDATE** atau **DELETE** data?

**Analogi:**
```
Tanpa RLS:  Gudang terbuka — siapa pun yang punya kartu masuk (anon key)
            bisa ambil dan taruh barang sesukanya

Dengan RLS: Gudang berisi loker. Kartu masuk hanya membuka loker tertentu.
            Tanpa "policy" yang mengizinkan, semua loker terkunci.
```

---

#### Kenapa Pilih "Run and enable RLS"?

Saat klik tombol di popup, **selalu pilih "Run and enable RLS"**.

Alasan:
1. Lebih aman — data tidak otomatis terbuka untuk siapa pun
2. Supabase sangat menyarankan ini untuk semua tabel
3. Kita tetap bisa atur akses lewat **policy** yang fleksibel

Kalau pilih "Run without RLS":
- Semua baris data bisa dibaca dan diubah siapa pun yang punya anon key
- Termasuk orang yang tidak ada hubungannya dengan event kamu

---

#### Setelah RLS Aktif — Semua Query Diblokir!

Ini yang bikin bingung pemula: setelah RLS diaktifkan, **semua query langsung diblokir secara default**.
Bahkan query SELECT sederhana pun akan mengembalikan array kosong `[]` tanpa error — seolah data tidak ada.

Solusinya: tambahkan **Policy** yang mengizinkan akses yang kita inginkan.

---

#### Anatomi RLS Policy

```sql
CREATE POLICY "nama policy yang deskriptif"
  ON nama_tabel
  FOR SELECT | INSERT | UPDATE | DELETE  ← operasi yang diizinkan
  USING (kondisi);                        ← untuk SELECT & UPDATE
  -- atau --
  WITH CHECK (kondisi);                   ← untuk INSERT & UPDATE
```

**Perbedaan `USING` vs `WITH CHECK`:**
| Klausa | Dipakai untuk | Arti |
|---|---|---|
| `USING (true)` | SELECT, UPDATE, DELETE | "Izinkan baca/ubah baris ini jika kondisi terpenuhi" |
| `WITH CHECK (true)` | INSERT, UPDATE | "Izinkan tulis data baru jika kondisi terpenuhi" |

`USING (true)` = kondisi selalu true = izinkan semua baris.

---

#### Strategi Policy di Project Ini

**Fase 2–6 (MVP/Development) — Policy Longgar:**
```sql
-- Semua orang boleh baca
CREATE POLICY "Public dapat membaca items" ON items FOR SELECT USING (true);

-- Semua orang boleh tulis (sementara)
CREATE POLICY "Public dapat insert items"  ON items FOR INSERT WITH CHECK (true);
CREATE POLICY "Public dapat update items"  ON items FOR UPDATE USING (true);
```

**Fase 7 (Produksi) — Policy Ketat:**
```sql
-- Hanya user yang sudah login yang bisa mengubah data
CREATE POLICY "Authenticated dapat insert items"
  ON items FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');
```

`auth.role()` adalah fungsi bawaan Supabase yang mengembalikan role user saat ini:
- `'anon'` → belum login
- `'authenticated'` → sudah login

---

#### Cara Menjalankan Policy di Supabase

Setelah schema tabel berhasil dibuat:
1. Di SQL Editor → klik **"New query"**
2. Copy-paste section **"6. ROW LEVEL SECURITY"** dari `docs/sql-schema.sql`
3. Klik **Run**
4. Cek: Dashboard → **Authentication → Policies** → pastikan policy muncul di tiap tabel

---

### Cara Verifikasi Koneksi

Setelah `.env.local` diisi, jalankan `npm run dev` dan buka browser ke `http://localhost:5173`.
Aplikasi akan otomatis test koneksi dan menampilkan:

- 🟡 Berkedip kuning → sedang mengecek koneksi
- 🟢 Berkedip hijau  → koneksi berhasil, siap ke Fase 3
- 🔴 Merah statis   → koneksi gagal, baca hint di bawahnya

---

## Fase 3 — Katalog Barang

### Smart Component vs Dumb Component

Ini pola arsitektur React yang sangat penting dan sering ditanyakan di interview:

```
CatalogPage  ← "Smart" / Container component
  │             - Mengambil data (fetch, state)
  │             - Mengatur logika
  │             - Tidak terlalu peduli tampilan detail
  │
  └─ ItemCard ← "Dumb" / Presentational component
                - TIDAK fetch data sendiri
                - Hanya terima data lewat props
                - Fokus 100% ke tampilan
```

**Kenapa dipisah seperti ini?**
- `ItemCard` bisa dipakai ulang di halaman lain (misal: halaman riwayat transaksi)
- Gampang di-test: cukup kasih props berbeda, lihat tampilan berubah
- `CatalogPage` bisa diganti logika fetch-nya tanpa sentuh `ItemCard` sama sekali

---

### Custom Hook — useItems.js

```js
// Sebelum ada custom hook:
function CatalogPage() {
  const [items, setItems] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  // ... 20 baris logika fetch di sini ...
  return <div>...</div>
}

// Setelah ada custom hook:
function CatalogPage() {
  const { items, isLoading, error, searchQuery, setSearchQuery } = useItems()
  return <div>...</div>  // jauh lebih bersih!
}
```

**Aturan hook:**
1. Nama harus diawali `use` → `useItems`, `useCart`, `useAuth`
2. Hanya boleh dipanggil di level atas komponen (tidak di dalam `if`, `for`, dll)
3. Bisa return apa saja: nilai, fungsi, objek, array

**useCallback** — kenapa dipakai di `fetchItems`?

```js
const fetchItems = useCallback(async () => {
  // ... fetch logic
}, []) // dependency array kosong = fungsi tidak pernah dibuat ulang
```

Tanpa `useCallback`, setiap kali komponen re-render, `fetchItems` dibuat ulang sebagai
fungsi baru. Karena `fetchItems` ada di dependency array `useEffect`, ini akan
memicu `useEffect` lagi → infinite loop! `useCallback` memastikan referensi fungsi
tetap sama selama dependency tidak berubah.

---

### CSS Grid Auto-Fill — Layout Responsif Tanpa Media Query

```css
.catalog-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: var(--space-4);
}
```

Cara bacanya:
- `repeat(auto-fill, ...)` → isi kolom sebanyak yang muat
- `minmax(160px, 1fr)` → tiap kolom minimum 160px, maksimum 1 bagian ruang tersisa

Hasilnya:
```
HP kecil (320px):   [ card1 ] [ card2 ]           ← 2 kolom
HP besar (414px):   [ card1 ] [ card2 ]            ← 2 kolom
Tablet (768px):     [ card1 ] [ card2 ] [ card3 ]  ← 3+ kolom
Desktop (1200px):   [ c1 ] [ c2 ] [ c3 ] [ c4 ] [ c5 ]
```

Ini jauh lebih simpel daripada menulis banyak media query `@media (min-width: ...)` manual.

---

### Skeleton Loading — UX yang Lebih Baik dari Spinner

```
Spinner biasa:         Skeleton loading:
                       ┌─────────────┐  ┌─────────────┐
   ⟳                   │ ░░░░░░░░░░  │  │ ░░░░░░░░░░  │
                       │ ░░░░░░      │  │ ░░░░░░      │
   Pengguna bingung    │ ░░░ ░░░░░   │  │ ░░░ ░░░░░   │
   berapa lama lagi?  └─────────────┘  └─────────────┘
                       Pengguna tahu ada 2 card yang sedang load
```

Efek **shimmer** dibuat dengan CSS gradient yang bergerak:
```css
.skeleton {
  background: linear-gradient(90deg, #gelap 0%, #terang 50%, #gelap 100%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
@keyframes shimmer {
  0%   { background-position: 200% 0; }  /* mulai dari kanan */
  100% { background-position: -200% 0; } /* gerak ke kiri */
}
```

---

### Foto Barang — URL vs File

Kolom `photo_url` hanya menyimpan **string URL**, bukan file gambar.

```
Database:   photo_url = "https://xyz.supabase.co/storage/v1/..."
                                     ↑
                            Ini hanya teks!

File JPG-nya ada di: Supabase Storage (akan diimplementasi Fase 6)
```

**Kenapa tidak pakai Google Drive?**
Google Drive punya **CORS policy** yang memblokir website lain memuat gambarnya.
Gambar Drive akan tampil sebagai 🖼️ broken di browser — bukan solusi yang bisa diandalkan.

Untuk sementara testing, bisa pakai foto dari Unsplash (tidak ada CORS):
```
https://images.unsplash.com/photo-<ID>?w=400&q=80
```

---

### SQL Sample Data — Pattern Tag untuk Easy Cleanup

Kalau perlu insert data testing, tandai dengan field khusus agar bisa dihapus sekaligus:

```sql
-- INSERT dengan "tag" di field event_name
INSERT INTO items (..., event_name) VALUES
  ('Double Tape', ..., 'SAMPLE_TEST'),
  ('Proyektor',   ..., 'SAMPLE_TEST');

-- DELETE semua sekaligus pakai tag yang sama
DELETE FROM items WHERE event_name = 'SAMPLE_TEST';
```

**Pattern ini jauh lebih aman** daripada DELETE berdasarkan id satu per satu,
dan tidak berisiko menghapus data production secara tidak sengaja.

---

### Tampilan Card yang Ditest

| Barang | Kondisi | Yang Terlihat |
|---|---|---|
| Double Tape (stok 12) | Banyak | Badge hijau, tombol aktif |
| Kabel Ties (stok 3) | Sedikit ≤3 | Badge kuning "Sisa 3" |
| Spidol (stok 0) | Habis | Badge merah, tombol disabled |
| Proyektor (non-consumable) | Ada yang dipinjam | Badge biru "Pinjam" + "1 dipinjam" |
| Lakban (tanpa foto) | Tidak ada foto | Placeholder emoji 📦 |

---

## Fase 4 — Cart System

### Mengapa Context API, Bukan Props Biasa?

Sebelumnya, kita punya komponen seperti ini:
```
App
 └─ CatalogPage
     └─ ItemCard
```
Jika kita menyimpan state cart di `App`, kita harus mengirim fungsi `addToCart` lewat `props` secara berantai: `App` → `CatalogPage` → `ItemCard`. Padahal `CatalogPage` sama sekali tidak butuh fungsi itu. Praktik mengoper props melewati komponen yang tidak membutuhkannya disebut **Prop Drilling**.

**Solusinya: Context API.**
Context menyediakan cara untuk berbagi nilai antar komponen tanpa harus secara eksplisit mengoper prop melalui setiap tingkat pohon (tree).

```
CartProvider (menyediakan data cart)
 ├─ CatalogPage
 │   └─ ItemCard  (bisa langsung ambil data dari CartProvider pakai useCart)
 └─ CartDrawer    (bisa langsung ambil data dari CartProvider pakai useCart)
```

### useReducer vs useState untuk Logika Kompleks

Di `CartContext`, kita memakai `useReducer`.

**Kapan pakai useState?**
Saat state sederhana dan perubahannya independen. Contoh: `[isOpen, setIsOpen]`.

**Kapan pakai useReducer?**
Saat state kompleks (seperti array of objects dalam cart) dan ada banyak jenis aksi yang bisa mengubah state tersebut.
- *Add Item* (Tambah kuantitas jika sudah ada, atau buat entry baru)
- *Remove Item*
- *Update Quantity*
- *Clear Cart*

Dengan `useReducer`, semua logika ini disatukan dalam satu fungsi murni (`cartReducer`), sehingga sangat mudah ditesting dan di-debug. Komponen lain cukup memanggil `dispatch({ type: 'ADD_ITEM', payload: ... })` tanpa perlu tahu logika rumit di baliknya.

### Pola Komponen FAB (Floating Action Button)

Kita membuat `TransactionFAB` dengan pola *Speed Dial*. Ini bukan hanya tombol biasa, melainkan menu interaktif.

- **Fixed Positioning:** `.fab-container { position: fixed; bottom: 28px; right: 20px; }` memastikannya selalu "mengambang" di layar, tidak peduli seberapa jauh user scroll.
- **CSS Transitions & Staggering:** Daripada menggunakan library animasi JavaScript yang berat, kita menggunakan CSS `transform` dan `opacity`.
- **CSS Variable untuk Delay (`--option-index`):** Tiap opsi punya variable indeks (0, 1, 2, 3) yang disuntikkan dari React. CSS menggunakan `calc()` untuk memberi jeda animasi (stagger): `transition-delay: calc(var(--option-index, 0) * 40ms)`. Hasilnya opsi muncul berurutan (cascade) sangat mulus.

---

## Fase 4.5 — Item Detail Modal (Fitur Tambahan)

### 1. Event Bubbling & `e.stopPropagation()`

Saat kita menambahkan efek *klik* pada seluruh `<article>` (kartu barang) untuk memunculkan modal, kita menghadapi sebuah masalah: **Tombol "Tambah ke Keranjang" ada di dalam kartu tersebut.**

Kalau kita klik tombolnya, klik tersebut akan "menjalar" ke atas (ke elemen induknya) sampai mencapai `<article>`, sehingga modal ikut terbuka. Perilaku ini disebut **Event Bubbling**.

**Solusinya:** Kita menggunakan `e.stopPropagation()` pada tombol.
```jsx
onClick={(e) => {
  e.stopPropagation() // Hentikan klik agar tidak tembus ke komponen induk (article)
  addToCart(item, 1)
}}
```

### 2. Scroll Locking dengan useEffect

Saat modal terbuka, kita tidak ingin user bisa men-scroll halaman di belakangnya (katalog). Kita bisa mengunci scroll dengan memanipulasi style dari elemen `<body>` secara langsung.

Karena berinteraksi dengan elemen di luar React (DOM langsung), kita harus menaruhnya di dalam `useEffect`:

```jsx
useEffect(() => {
  document.body.style.overflow = 'hidden' // Kunci scroll saat modal muncul
  return () => {
    document.body.style.overflow = 'unset' // Kembalikan saat modal ditutup
  }
}, [])
```
Fungsi yang di-return di dalam `useEffect` disebut **Cleanup Function**. Fungsi ini akan otomatis dipanggil oleh React tepat sebelum komponen `ItemDetailModal` dihancurkan (ditutup).

### 3. Aksesibilitas Keyboard (Escape untuk Menutup)

Aplikasi yang baik bisa diakses dengan mudah pakai keyboard. Menutup pop-up dengan tombol `Esc` adalah standar UI modern. Sama seperti scroll locking, kita butuh `useEffect` untuk mendengarkan event dari keyboard:

```jsx
useEffect(() => {
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') onClose()
  }
  window.addEventListener('keydown', handleKeyDown)
  
  // Wajib dibersihkan agar event listener tidak menumpuk di memori (memory leak)
  return () => window.removeEventListener('keydown', handleKeyDown)
}, [onClose])
```

---

## 🎯 Review Tengah Proyek (Sebelum Masuk Fase 5)

Sejauh ini, kita sudah menyelesaikan hampir seluruh fondasi **Frontend (UI & State Management)**. Sebelum kita masuk ke kerumitan **Backend & Database Logic (Fase 5)**, mari kita rangkum pola pikir (mindset) yang sudah terbangun:

### 1. "Single Source of Truth" untuk State
Kenapa kita repot-repot membuat `CartContext` dengan `useReducer`? 
Bayangkan jika keranjang belanja dikelola masing-masing oleh `ItemCard` dan `CartDrawer`. Kalau user menambah barang dari modal, `CartDrawer` tidak akan tahu. Dengan Context, keranjang hanya ada **satu** (Single Source of Truth). Komponen manapun yang memanggil `useCart()` selalu melihat data yang sama dan *ter-update*.

### 2. Validasi Frontend vs Validasi Backend
Saat ini, di `CartContext`, kita mencegah user memasukkan jumlah barang melebihi `stock_available`.
```jsx
// Validasi Frontend
const finalQty = Math.min(newQty, item.stock_available)
```
**PENTING:** Validasi frontend HANYA untuk kenyamanan UI/UX (agar user tidak bisa klik tombol `+` saat stok habis). Ini **TIDAK AMAN**. 
Bayangkan Skenario (Race Condition):
- User A dan User B membuka aplikasi bersamaan. Stok Proyektor = 1.
- User A menekan "+ Tambah" (diizinkan frontend).
- User B menekan "+ Tambah" sedetik kemudian (diizinkan frontend karena data stok di layar B belum terupdate).
- Keduanya menekan "Checkout". 

Jika tidak ada *Validasi Backend*, stok Proyektor akan menjadi -1 (Minus Satu). Inilah mengapa **Fase 5** sangat krusial. Kita akan menulis fungsi di database (PostgreSQL RPC) yang mengunci baris stok dan memprosesnya secara atomik.

### 3. Komponen yang "Bodoh" (Dumb Components) Lebih Mudah Dirawat
Komponen seperti `ItemCard` sangat "bodoh" (dalam artian positif). Ia tidak tahu dari mana data `item` berasal. Ia hanya menerima props `item`, dan memanggil fungsi dari `useCart()` saat diklik. Kalau besok kita ubah database dari Supabase ke Firebase, kode `ItemCard` **tidak perlu diubah sama sekali**. Pola ini membuat kode kita panjang umurnya (maintainable).

---

## Fase 5 — Logika Transaksi & Database Otomatis (Refaktor 3 Menu)

Pada fase ini, kita melakukan perubahan besar-besaran (refactoring) berdasarkan *feedback* di lapangan. Awalnya kita memiliki 4 menu transaksi dan UI berbasis keranjang (Cart-first). Sekarang kita menyederhanakannya menjadi 3 menu (Pemakaian, Pengembalian, Penitipan) dengan alur bertahap (Wizard-first).

### 1. Kenapa "Wizard" Lebih Baik dari "Cart" untuk Aplikasi Internal?
Aplikasi e-commerce (seperti Tokopedia) menggunakan **Cart-first** karena tujuannya agar orang bebas melihat-lihat, memasukkan barang ke keranjang, dan mungkin tidak jadi beli (abandoned cart).
Namun, untuk aplikasi internal/operasional seperti Gudang RTB, tujuannya adalah **Akurasi dan Kecepatan Transaksi**.
Dengan model **Wizard (Form-first)**:
- Panitia dipaksa memilih *Niat* (tipe transaksi) dan *Identitas* di awal.
- Ini meminimalisir kesalahan (misal: niatnya pinjam, tapi kepencet ambil).
- UI jadi lebih terarah. Tidak ada lagi keranjang yang "menggantung" tanpa kejelasan siapa pemiliknya.

### 2. Memindahkan Kerumitan ke Backend (Penyederhanaan UI)
Sebelumnya, panitia harus bingung membedakan "Pengambil" (untuk barang habis pakai) dan "Peminjam" (untuk barang pinjaman).
Sekarang, kita gabung menjadi satu tombol: **Pemakaian**.
Bagaimana sistem tahu bedanya? Kita mengandalkan kolom `is_consumable` di database.
- Saat RPC function `process_checkout_transaction` dipanggil, PostgreSQL akan mengecek tiap barang.
- Jika `is_consumable = true` (Lakban), maka *stock_available* dikurangi permanen.
- Jika `is_consumable = false` (Proyektor), maka *stock_available* dikurangi, dan *stock_in_use* ditambah.
**Pelajaran:** Jika sebuah logika bisnis membingungkan *user* (manusia), cobalah sembunyikan logika tersebut di *backend* agar sistem yang mengerjakannya secara otomatis. UX (User Experience) yang baik adalah yang tidak membuat user banyak berpikir.

### 3. Menggunakan SQL View untuk Pelaporan Dinamis
Kamu meminta fitur: *"Saya ingin tahu siapa saja yang sedang meminjam proyektor."*
Cara paling standar tapi rumit: Menambah kolom `borrowed_by` atau tabel baru, yang berarti harus kita update terus menerus setiap ada transaksi.
Cara **terbaik dan elegan**: Menggunakan **SQL View** (`active_loans`).
- SQL View adalah tabel "virtual" yang datanya selalu terbaru (real-time) dihitung dari query `SELECT`.
- Di sini, view kita menghitung: `(Jumlah Pemakaian) - (Jumlah Pengembalian) per User`.
- Kalau selisihnya > 0, berarti si User masih berhutang/meminjam barang tersebut.
- Keuntungan: Kita tidak perlu menambah logika `UPDATE` apa pun saat transaksi. Datanya akan selalu akurat secara matematis!

---

## Referensi Cepat

| Konsep | Penjelasan Singkat | Baca Lebih |
|---|---|---|
| JSX | Sintaks gabungan JavaScript + HTML yang dikompilasi oleh Vite | [react.dev/learn](https://react.dev/learn) |
| Component | Fungsi JavaScript yang mengembalikan JSX (UI) | [react.dev/learn/your-first-component](https://react.dev/learn/your-first-component) |
| Props | Parameter yang dikirim dari komponen induk ke komponen anak | [react.dev/learn/passing-props-to-a-component](https://react.dev/learn/passing-props-to-a-component) |
| State | Data yang kalau berubah akan otomatis me-re-render komponen | [react.dev/learn/state-a-components-memory](https://react.dev/learn/state-a-components-memory) |
| Hook | Fungsi khusus React yang namanya diawali "use" | [react.dev/reference/react](https://react.dev/reference/react) |
| CSS Variables | Nilai yang bisa dipakai ulang di seluruh file CSS | [MDN CSS Custom Properties](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties) |

---

## 🎨 Pelajaran Ekstra (UI & Bug Fixing)

### 1. Sinkronisasi Token CSS (Variables)
Saat mengembangkan UI kompleks seperti `TransactionWizard.jsx`, sangat umum terjadi kesalahan penulisan nama variabel CSS (misalnya, menulis `var(--color-bg-body)` padahal yang ada di `index.css` adalah `var(--bg-base)`). 
- Jika variabel tidak ditemukan, browser akan mengabaikannya, menyebabkan elemen transparan dan bertabrakan dengan background.
- Menggunakan palet yang konsisten (seperti `var(--bg-surface)` untuk input form di mode gelap) sangat penting agar UI tidak "tenggelam" dalam background gelap.

### 2. Mengambil Data Relasional Secara Dinamis
Di `ItemDetailModal.jsx`, kita ingin menampilkan *Siapa yang meminjam barang ini?*
Karena kita sudah memiliki view `active_loans` dari Fase 5, kita hanya perlu memanggilnya:
```jsx
const { data, error } = await supabase
  .from('active_loans')
  .select('*')
  .eq('item_id', item.id)
```
Kita meletakkan *fetch* ini di dalam `useEffect` yang dipicu setiap kali props `item` berubah, dan HANYA dieksekusi jika barang tersebut bersifat non-consumable (`!item.is_consumable`) dan ada unit yang dipinjam (`item.stock_in_use > 0`). Hal ini sangat menghemat pemanggilan ke database (menghindari request yang tidak perlu).

### 3. Menghindari Nested Padding & "Scroll Trap" pada Layout Responsif
Saat sebuah komponen katalog disematkan (embedded) di dalam komponen lain (seperti form Wizard):
- **Masalah Padding Bertumpuk:** Jika container luar punya padding 24px, card punya padding 24px, dan katalog di dalamnya punya padding 20px, total ruang horizontal yang hilang di layar HP mencapai >130px. Akibatnya, grid terpaksa memaksakan 1 kolom raksasa.
- **Solusi Embedded Mode:** Buat prop khusus seperti `isEmbedded` di `CatalogPage` untuk meniadakan padding luar dan judul duplikat saat berada di dalam wizard.
- **Menghilangkan Scroll Trap:** Memberikan `max-height: 500px; overflow-y: auto;` di dalam kartu membuat scrollbar ganda yang sangat canggung di HP (user sering tersangkut saat scroll). Lebih baik biarkan halaman mengalir (flow) secara natural mengikuti panjang kontennya.
- **Grid 2 Kolom di HP:** Gunakan `grid-template-columns: repeat(2, 1fr)` dengan `gap: 8px-12px` di layar mobile agar kartu barang proporsional dan tidak memakan terlalu banyak tinggi layar.

### 4. Validasi Batas Kuantitas Pengembalian (Boundary Condition)
Pada transaksi **Pengembalian Barang**, ada aturan bisnis yang sangat fundamental:
- **Kuantitas Pengembalian Maksimal = `stock_in_use`**: Seseorang tidak boleh mengembalikan 6 unit proyektor jika seluruh gudang hanya mencatat 3 unit yang sedang dipinjam.
- **Barang Tidak Sedang Dipinjam**: Barang yang `stock_in_use = 0` harus ditolak dari awal karena memang tidak ada unit yang bisa dikembalikan.
- **Dual Guard (Frontend + Database RPC)**: 
  1. *Di Frontend (`TransactionWizard.jsx`)*: Mencegah tombol `+` diklik saat kuantitas mencapai batas `stock_in_use`.
  2. *Di Database (`process_checkout_transaction`)*: Mengecek `IF v_stock_in_use < v_quantity THEN RAISE EXCEPTION` agar database tidak pernah menghasilkan nilai `stock_in_use` negatif yang merusak integritas data.

### 5. Penyederhanaan Inventaris: General Item Management
Berdasarkan evaluasi penggunaan nyata, membedakan barang menjadi "Habis Pakai" dan "Pinjam" sering kali membatasi fleksibilitas operasional panitia (misalnya: lakban atau spidol yang masih ada sisa dan ingin dikembalikan ke gudang):
- **Sistem General yang Seragam**: Seluruh barang di gudang kini diperlakukan sama secara matematis:
  - `Pemakaian`: Mengurangi `stock_available`, menambah `stock_in_use`.
  - `Pengembalian`: Menambah `stock_available`, mengurangi `stock_in_use`.
- **Keuntungan**:
  1. **UI Bersih**: Tidak ada lagi badge "Habis Pakai" / "Pinjam" yang membingungkan panitia.
  2. **Logika Kode Sederhana**: Menghilangkan percabangan `IF is_consumable` di SQL dan React, membuat alur transaksi jauh lebih mudah dipelihara (maintainable) dan bebas dari bug status.
  3. **Transparansi Penuh**: Siapa pun yang membawa barang apa pun (baik proyektor maupun ATK) dapat dilacak secara akurat lewat `active_loans`.

---

## Fase 6 — Kompresi Gambar, Supabase Storage, & Input Data Barang

### 1. Mengapa Kompresi Gambar Sisi Klien (Client-Side) Wajib Ada?
1. **Efisiensi Kuota & Biaya**: Kuota Supabase Storage free-tier adalah 1GB. Foto kamera HP modern rata-rata 4MB–10MB per foto (hanya muat ~100–250 foto!). Dengan kompresi sisi klien ke ~150KB–200KB, kuota 1GB bisa menampung **>5.000 foto bukti**.
2. **Koneksi Lapangan Tidak Stabil**: Saat acara berlangsung di lapangan/gedung, sinyal 4G sering padat. Mengunggah file 200KB selesai dalam 1–2 detik, sementara file 10MB memakan waktu puluhan detik dan berisiko putus di tengah jalan (*network timeout*).
3. **Web Worker**: Kompresi gambar membutuhkan kalkulasi grafis yang berat. Opsi `useWebWorker: true` memindahkan pemrosesan ke thread latar belakang (*background thread*), sehingga antarmuka browser tetap mulus 60 FPS dan tidak macet (*freeze*) saat user memilih foto.

### 2. Integrasi Supabase Storage & Public URL
Alur pengunggahan foto:
```
User Pilih Foto ──► imageCompression.js (Web Worker ~150KB)
                         │
                         ▼
             storageService.js (Upload ke bucket Supabase)
                         │
                         ▼
        Dapatkan Public URL (https://...supabase.co/storage/v1/...)
                         │
                         ▼
Simpan URL string ke kolom 'photo_url' atau 'proof_photo_url' di PostgreSQL
```

### 3. Dua Pola Input Barang di Gudang RTB:
1. **Form Penitipan Barang (Panitia)**:
   - Digunakan untuk barang titipan dari luar acara yang masuk sementara ke gudang.
   - Menggunakan alur Wizard Step 2: Nama barang, rincian, dan foto bukti wajib.
   - Disimpan sebagai transaksi header bertipe `'penitipan'` di tabel `transactions`.
2. **Form Tambah Barang Baru (PIC Gudang)**:
   - Digunakan oleh penanggung jawab gudang untuk memperluas katalog barang inventaris.
   - Menggunakan komponen `AddItemModal`: Nama barang, deskripsi, stok awal, pilihan satuan cepat (*pcs, unit, roll, set, dll*), dan foto katalog opsional.
   - Disimpan langsung ke tabel `items` dan langsung memicu pembaruan grid katalog secara instan via `refetch()`.

### 4. Fitur Riwayat Transaksi & Audit Trail (`HistoryModal`)
Untuk transparansi dan akuntabilitas gudang:
- **Relational Query Bersarang**: Supabase memungkinkan pengambilan data transaksi sekaligus detail barangnya dalam satu request yang efisien:
  ```js
  .from('transactions')
  .select('*, transaction_details(*, items(*))')
  ```
- **Filter Multi-Kategori & Instant Search**: Memungkinkan PIC memfilter jenis transaksi (Pemakaian, Pengembalian, Penitipan, Penambahan, Penghapusan) serta mencari berdasarkan nama panitia, event, maupun nama barang.
- **Detail View & Fullscreen Photo Zoom**: Mengklik transaksi membuka kartu detail lengkap beserta foto bukti yang bisa di-zoom untuk verifikasi fisik.

### 5. Penghapusan Barang (Soft Delete) & Pencatatan Audit Trail
Mengapa kita menggunakan **Soft Delete** (`status = 'archived'`) alih-alih `DELETE FROM items`?
1. **Integritas Relasional Database**: Jika barang di-*hard delete*, semua baris transaksi lama di `transaction_details` yang mereferensikan `item_id` tersebut akan error atau ikut terhapus (*cascade*).
2. **Riwayat Tidak Hilang**: Panitia tetap bisa melihat siapa yang pernah meminjam barang tersebut di masa lalu.
3. **Audit Trail Otomatis**: Setiap aksi tambah barang atau hapus barang oleh PIC otomatis dicatat ke tabel `transactions` bertipe `'penambahan'` atau `'penghapusan'`, sehingga seluruh aktivitas katalog tercatat rapi di Riwayat Transaksi.

---

## Fase 6.5 — Pemisahan Domain: Inventarisasi Gudang vs Penitipan Barang Luar

### 1. Pelajaran Penting: Memahami Perbedaan Domain (Domain Modeling)
Salah satu kesalahan umum saat mendesain sistem inventaris adalah **mencampuradukkan kepemilikan barang**:
- **Barang Inventaris Resmi (Tabel `items`)**:
  - Milik gudang RTB (misal: kabel HDMI, proyektor, terminal listrik).
  - Memiliki hitungan stok (`stock_available`, `stock_in_use`).
  - Mengikuti siklus: **Pemakaian ➔ Pengembalian**.
- **Barang Titipan Luar (Tabel `transactions` - 'penitipan')**:
  - Milik panitia/vendor luar yang hanya *numpang simpan* sementara di gudang (misal: banner backdrop 3x4m, koper kostum panitia).
  - Bukan aset gudang, sehingga **TIDAK BOLEH** dimasukkan ke tabel `items` (agar tidak mengotori katalog inventaris resmi).
  - Mengikuti siklus: **Penitipan ➔ Pengambilan**.

### 2. Pola Relasi Self-Referencing (`related_transaction_id`)
Bagaimana sistem mengetahui barang titipan mana yang sudah diambil dan mana yang belum?
Alih-alih membuat tabel baru `deposits`, kita menggunakan relasi **Self-Referencing** pada tabel `transactions`:
1. Saat barang masuk: dibuat baris transaksi `'penitipan'` (dengan ID unik, misal `uuid-1`).
2. Saat barang diambil: dibuat baris transaksi `'pengambilan'` dengan mengisi kolom `related_transaction_id = 'uuid-1'`.
3. Keuntungan:
   - Struktur database tetap ramping dan konsisten (1 tabel untuk seluruh log pergerakan).
   - Riwayat serah terima (siapa yang menitipkan vs siapa yang mengambil) terlacak secara matematis dan relasional.

### 3. Menggunakan SQL View `active_deposits` (Anti-Join Pattern)
Untuk menampilkan daftar barang titipan yang **masih aktif** (belum diambil):
```sql
CREATE VIEW active_deposits AS
SELECT * FROM transactions t
WHERE t.transaction_type = 'penitipan'
  AND t.id NOT IN (
    SELECT related_transaction_id 
    FROM transactions 
    WHERE transaction_type = 'pengambilan' 
      AND related_transaction_id IS NOT NULL
  );
```
Dengan View ini, logika kompleks *anti-join* (`NOT IN`) dikerjakan di PostgreSQL, dan kode frontend React hanya perlu melakukan query bersih: `supabase.from('active_deposits').select('*')`.

### 4. UX Design: Segmented Tab Switcher pada Dashboard
Di halaman Dashboard, kita memisahkan eksplorasi data menggunakan **Segmented Tab Switcher**:
- Tab 1: **📦 Katalog Barang Gudang** → Fokus pada aset dan ketersediaan unit inventaris.
- Tab 2: **🎒 Barang Titipan Aktif** → Fokus pada pengawasan barang luar dan tombol cepat `[ 🏷️ Ambil Barang Ini ]`.
Pola ini memberikan kejernihan visual (*visual clarity*) sehingga panitia di lapangan tidak kebingungan saat mencari barang.

---

## Fase 6.6 — Integrasi Auto-Backup Google Sheets & Google Drive

### 1. Arsitektur Hybrid Backup: Single Source of Truth vs Secondary Archive
Mengapa kita tetap memakai Supabase dan tidak langsung menggunakan Google Sheets saja?
- **Supabase (Primary Source of Truth)**: Menyediakan transaksi database yang atomik (ACID), integritas relasi foreign key, validasi stok instan, dan query performa tinggi (< 100ms) untuk antarmuka web.
- **Google Sheets & Drive (Secondary Backup / Audit Archive)**: Berfungsi sebagai data cadangan gratis (*free storage*), mudah dibagikan ke panitia non-teknis, dan memudahkan pembuatan laporan spreadsheet tanpa perlu mengekspor manual.

### 2. Pola Arsitektur Fire-and-Forget (Non-Blocking Webhook)
Dalam aplikasi web modern yang membutuhkan responsivitas tinggi:
```
[User Klik Kirim Transaksi]
        │
        ├── 1. INSERT ke Supabase (Wajib Berhasil, ~200ms)
        │       ↓ Selesai
        │   [UI Menampilkan Sukses & Kembali ke Dashboard]
        │
        └── 2. fetch(Google Apps Script) di Background (Fire-and-Forget)
                ↓ Berjalan tanpa mengunci antarmuka browser
            [Google Apps Script mencatat baris & copy foto ke Drive]
```
- **Mengapa non-blocking penting?** Google Apps Script rata-rata membutuhkan waktu 1–3 detik untuk mengunduh gambar dan menulis ke Drive. Jika frontend menunggu (*await*) respon Google sebelum menutup modal, user akan merasa aplikasi "lag" atau "macet".
- Dengan pola *fire-and-forget*, kegagalan koneksi ke Google tidak akan pernah membatalkan transaksi sah yang sudah masuk ke database Supabase.

### 3. Solusi CORS pada Google Apps Script (`mode: 'no-cors'`)
Secara default, Google Apps Script Web App merespons dengan kode status HTTP `302 Moved Temporarily` (Redirect). Browser modern sering memblokir redirect ini karena pembatasan Cross-Origin Resource Sharing (CORS).
- Solusi di frontend: Menggunakan opsi `mode: 'no-cors'` pada `fetch()`.
- Request tetap sampai dan dieksekusi oleh `doPost(e)` di Google Apps Script secara sempurna tanpa error CORS di console browser.

### 4. Cloud-to-Cloud Image Transfer (Menghemat Bandwidth Seluler Panitia)
Daripada meminta HP panitia mengunggah foto 2 kali (sekali ke Supabase dan sekali ke Google Drive yang akan memakan kuota 2x lipat):
1. HP panitia hanya mengunggah 1 kali foto terkompresi (~200KB) ke Supabase Storage.
2. Webhook mengirimkan URL publik foto tersebut ke Google Apps Script.
3. Google Apps Script menggunakan `UrlFetchApp.fetch(photoUrl)` untuk mendownload gambar langsung antar-server cloud (*server-to-server*) dan memasukkannya ke Google Drive panitia.
4. **Hasil**: Efisiensi kuota maksimal bagi panitia di lapangan!

### 5. Debugging React: Mengapa Alert Muncul 2 Kali? (React StrictMode & Pure State Updaters)
Saat mengklik barang yang stoknya habis di mode dev (`npm run dev`), dialog `alert()` sempat muncul **2 kali berturut-turut**. Mengapa ini terjadi?

1. **Penyebab Utama (Side Effect di dalam State Updater)**:
   Sebelumnya, kita menaruh `alert()` di dalam fungsi updater state:
   ```javascript
   // ❌ SALAH: Menaruh side effect di dalam updater
   setCartItems(prev => {
     if (quantity >= stock) {
       alert('Stok tidak cukup!') // ← Efek samping terpanggil 2x
       return prev
     }
     return [...prev, item]
   })
   ```
2. **Perilaku React 18 StrictMode**:
   Di environment development, React sengaja menjalankan fungsi updater state (`setState(prev => ...)`) **2 kali berturut-turut** untuk mendeteksi *impurities* (efek samping yang tidak boleh ada di fungsi kalkulasi state).
3. **Solusi yang Benar (Pure State Transformation)**:
   Validasi dan side effect (seperti `alert()`) harus dipindahkan **ke luar** pemanggilan `setState`, dan fungsi updater harus murni hanya menghitung array state baru:
   ```javascript
   // ✅ BENAR: Validasi & alert di luar, state updater tetap 'murni' (pure function)
   const existing = cartItems.find(i => i.item.id === item.id)
   if (existing && existing.quantity >= item.stock_available) {
     alert('Kuantitas melebihi stok tersedia!')
     return // Hentikan sebelum setState
   }

   setCartItems(prev => prev.map(...))
   ```

### 6. Arsitektur Multi-Sheet: Memisahkan 'Log Transaksi' dan 'Rekap Stok Master Barang'
Saat membuat sistem pencadangan (*backup*) ke spreadsheet, kita membedakan 2 jenis data yang memiliki karakteristik berbeda:

1. **Sheet 1: `Log Transaksi` (Time-Series Append-Only Data)**:
   - Karakteristik: Catatan peristiwa yang terjadi seiring waktu (kapan, siapa, barang apa, foto bukti apa).
   - Operasi: Selalu menambahkan baris baru ke bawah (`appendRow`). Baris lama tidak pernah diedit/dihapus.
2. **Sheet 2: `Rekap Stok Barang` (Current State Snapshot Data)**:
   - Karakteristik: Foto kondisi inventaris saat ini (nama barang, sisa stok siap pakai, jumlah yang sedang dipinjam, status aktif/arsip).
   - Operasi: Ditulis ulang secara berkala (*snapshot*) atau disinkronkan saat ada perubahan.
3. **Penerapan di Google Apps Script**:
   Dengan memisahkan keduanya menjadi 2 sheet tab dalam 1 file spreadsheet yang sama, panitia non-teknis bisa langsung melihat ringkasan stok di sheet "Rekap Stok Barang" tanpa harus menghitung manual dari ribuan baris log transaksi!

### 7. Multi-File Parallel Compression & Hierarchical Cloud Storage Organization

Saat kebutuhan aplikasi berkembang dari mengunggah 1 foto menjadi **banyak foto sekaligus (multi-upload hingga 5 foto)**, kita menerapkan 3 konsep rekayasa perangkat lunak penting:

#### A. Parallel Asynchronous Processing via `Promise.all`
Jika kita mengompresi dan mengunggah 5 foto secara berurutan (*sequential* / satu-per-satu):
`Waktu total = Waktu Foto 1 + Waktu Foto 2 + ... + Waktu Foto 5` (bisa memakan waktu 10–15 detik!).

Dengan **eksekusi paralel (`Promise.all`)**:
```javascript
// ✅ Seluruh 5 foto dikompresi & diunggah secara bersamaan
const uploadPromises = files.map(file => uploadImageToStorage(file, bucketName))
const uploadedUrls = await Promise.all(uploadPromises)
```
Browser menjalankan tugas kompresi di Web Worker terpisah pada thread CPU yang berbeda, sehingga waktu tunggu total terpangkas menjadi hanya secepat foto yang paling lama (~2 detik)!

#### B. Backwards-Compatible Multi-URL Storage
Di tabel `transactions`, kolom `proof_photo_url` bertipe `text`.
Untuk menyimpan banyak URL tanpa harus merusak data lama (*breaking changes*) atau mengubah skema database secara drastis, kita menyimpan array URL dalam format string yang dipisahkan koma:
`"https://.../photo1.webp, https://.../photo2.webp"`

Saat dibaca oleh komponen frontend (`HistoryModal.jsx`, `DepositedItemsList.jsx`), kita memecahnya kembali:
```javascript
const photoUrls = (proof_photo_url || '').split(',').map(s => s.trim()).filter(Boolean)
```
- Jika ada 1 foto (data lama) → menghasilkan array 1 elemen `[url1]` (tetap berjalan normal).
- Jika ada 3 foto (data baru) → menghasilkan array 3 elemen `[url1, url2, url3]` dan otomatis dirender sebagai galeri!

#### C. Hierarchical Storage: Subfolder Otomatis per Transaksi di Google Drive
Menyimpan ratusan file gambar di dalam satu folder root (*flat directory*) akan membuat Google Drive lambat dibuka dan menyulitkan panitia mencari bukti foto saat audit.

Solusinya: Google Apps Script secara dinamis membuat **Subfolder Khusus** untuk setiap transaksi:
`📁 YYYY-MM-DD_HHmm_[JENIS]_[NamaPanitia]/`
- Semua foto titipan panitia tersebut masuk ke folder itu (`Foto_1.webp`, `Foto_2.webp`).
- Link di Google Spreadsheet langsung membuka subfolder transaksi tersebut, sehingga seluruh foto bukti bisa dilihat bersamaan dalam satu folder yang rapi!

### 8. Cross-Component Deep Linking: Menghubungkan Detail Peminjam ke Riwayat Transaksi

Dalam aplikasi berskala produksi, data yang berelasi sebaiknya tidak terisolasi dalam masing-masing modal. Pengguna harus bisa **menelusuri konteks data secara instan (*drill-down navigation*)**.

#### A. Pola *Lifting State Up* untuk Navigasi Antar-Modal
Saat pengguna mengklik nama peminmax di `ItemDetailModal`, modal detail harus ditutup dan `HistoryModal` harus terbuka dengan query pencarian terisi otomatis.

```
Dashboard (Parent State Holder: historySearchQuery, historyFilterType, isHistoryOpen)
   │
   ├── CatalogPage (Meneruskan callback onOpenHistory)
   │     └── ItemDetailModal
   │           └── 👤 Klik Nama Peminjam ➔ onOpenHistory('Nama', 'pemakaian')
   │
   └── HistoryModal (Menerima initialSearchQuery & initialFilter)
```

#### B. Mengapa Ini Penting untuk Operasional Nyata?
1. **Minim Friksi Audit**: PIC gudang yang melihat ada 1 unit barang hilang/dipakai tidak perlu mencatat nama di kertas lalu mengetiknya ulang di pencarian riwayat.
2. **Konteks Seketika**: Sekali klik, PIC langsung melihat tanggal, jam, dan **foto bukti serah terima** saat barang tersebut dipinjam oleh panitia bersangkutan.

### 9. Manajemen Siklus Hidup Media (Cloud Media Replacement & State Synchronization)

Saat entitas inventaris yang memiliki file media (foto katalog) diedit, kita menerapkan **Siklus 5 Tahap Penggantian Media**:

1. **Kompresi di Sisi Klien (*Client-side Pre-processing*)**:
   Gambar baru dari PIC langsung dikompresi di Web Worker browser menjadi WebP ~200KB sebelum menyentuh jaringan.
2. **Pengunggahan Media (*Immutable Storage Upload*)**:
   File diunggah ke Supabase Storage (`item-photos`) dengan nama file berbasis timestamp acak unik (`1786..._abc123.webp`). Kita tidak menimpa file lama dengan nama yang sama guna menghindari masalah browser caching.
3. **Pembaruan Relasi Database (*Atomic DB Mutation*)**:
   Kolom `photo_url` di tabel `items` diperbarui dengan URL publik baru melalui query `UPDATE items SET photo_url = ... WHERE id = ...`.
4. **Propagasi State Instan (*Optimistic / Immediate Local Refresh*)**:
   Komponen `ItemDetailModal` memperbarui state lokal `currentItem` dan memanggil `refetch()` di `CatalogPage`, sehingga kartu di katalog dan popup detail langsung menampilkan foto baru tanpa perlu refresh browser (*F5*).
5. **Sinkronisasi Otomatis Cadangan Sekunder (*Secondary Cloud Sync*)**:
   Aplikasi memicu fungsi `syncAllItemsToGoogle(allItems)` secara non-blocking di latar belakang. Google Apps Script otomatis memperbarui baris barang tersebut di sheet "Rekap Stok Barang" dan mengunduh foto terbarunya ke Google Drive!

### 10. Koreksi Stok Opname & Audit Trail Otomatis (FR-8)

Sesuai Functional Requirement **FR-8 (Koreksi Manual Stok / Stock Opname)**:
PIC gudang seringkali menemukan ketidaksesuaian antara jumlah barang fisik di rak dengan catatan sistem (misal: barang rusak atau barang tertinggal).

#### A. Mengapa Hanya `stock_available` yang Diedit?
- `stock_available`: Menyatakan jumlah unit fisik yang **ada di rak gudang saat ini dan siap digunakan/dipinjam**. Angka inilah yang boleh disesuaikan saat opname rak.
- `stock_in_use`: Menyatakan unit yang sedang **aktif dibawa oleh panitia**. Angka ini terikat dengan transaksi peminjaman aktif dan hanya berkurang saat panitia melakukan alur **Pengembalian**.

#### B. Menjaga Konsistensi Audit (*Audit Trail*)
Setiap kali angka `stock_available` diubah di form Edit:
### 11. Desain Form Kompak & Responsif: Mengatasi Stretched Inputs dan Scroll Trap di Layar Sempit

Dalam mendesain antarmuka modal form untuk perangkat bergerak (*mobile device*):

#### A. Pola *Compact 2-Column Quantity + Unit Grid*
- **Problem**: Jika input kuantitas angka dan input satuan ditaruh di baris terpisah dengan `width: 100%`, tombol stepper `[ − ] [ 6 ] [ + ]` akan meregang (*stretched*) secara tidak proporsional dengan ruang kosong yang luas di tengahnya.
- **Solusi**: Satukan input stok dan satuan dalam grid 2-kolom tetap:
  ```css
  .compact-stock-unit-grid {
    display: grid;
    grid-template-columns: 140px 1fr;
    gap: var(--space-3);
  }
  ```
  Dengan lebar tetap 140px pada stepper (`[38px] [64px text] [38px]`) dan `1fr` pada satuan, input angka tampil proporsional, rapi, dan mudah ditekan di layar mana pun (mulai dari 320px hingga 4K desktop).

#### B. Pola *Segmented Control Pill* (Alternatif Radio Card Besar)
- **Problem**: Kartu radio switch dengan deskripsi multiline memakan tinggi vertikal >130px, memaksa user terus men-scroll ke bawah (*scroll fatigue*) hanya untuk melihat tombol simpan atau upload foto.
- **Solusi**: Gunakan **Segmented Control Tab** bergaya iOS/macOS berukuran tinggi 44px:
  `[ 📦 Habis Pakai ]` vs `[ 🔄 Pinjam-Kembali ]`.
  Pendekatan ini menghemat >80px ruang vertikal modal, membuat seluruh form pas dalam satu tampilan layar tanpa perlu scrolling berlebihan.
