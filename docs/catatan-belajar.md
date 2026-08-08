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

Setelah `npm run dev` berjalan, coba:
- Ubah teks di `src/App.jsx` → simpan → lihat browser update **tanpa refresh** (ini HMR)
- Buka DevTools browser → Elements → lihat semua konten ada di dalam `<div id="root">`

---

## Fase 2 — Koneksi Supabase

*(Akan diisi setelah Fase 2 selesai)*

---

## Fase 3 — Katalog Barang

*(Akan diisi setelah Fase 3 selesai)*

---

## Fase 4 — Cart System

*(Akan diisi setelah Fase 4 selesai)*

---

## Fase 5 — Logika Transaksi

*(Akan diisi setelah Fase 5 selesai)*

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
