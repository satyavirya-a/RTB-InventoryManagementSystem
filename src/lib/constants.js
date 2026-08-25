/**
 * constants.js
 * Nilai-nilai tetap (konstanta) yang dipakai di seluruh aplikasi Gudang RTB.
 *
 * Kenapa perlu file ini?
 * Kalau string seperti 'pengambil' ditulis ulang di banyak tempat, ada risiko typo.
 * Dengan mendefinisikan di satu tempat, jika ada perubahan nama cukup ubah di sini,
 * dan semua bagian kode yang menggunakannya otomatis ikut berubah.
 *
 * Pola ini disebut "Single Source of Truth" untuk nilai konstanta.
 */

/**
 * 4 jenis transaksi yang didukung sistem.
 * Harus sama persis dengan CHECK constraint di tabel transactions di database.
 *
 * @type {{ PENARUH: string, PENGAMBIL: string, PEMINJAM: string, PENGEMBALI: string }}
 */
export const TRANSACTION_TYPES = {
  /** Menaruh/menambah stok barang ke gudang */
  PENARUH: 'penaruh',
  /** Mengambil barang consumable (mengurangi stok) */
  PENGAMBIL: 'pengambil',
  /** Meminjam barang non-consumable */
  PEMINJAM: 'peminjam',
  /** Mengembalikan barang yang dipinjam */
  PENGEMBALI: 'pengembali',
}

/**
 * Label yang ditampilkan di UI untuk setiap jenis transaksi.
 * Dipakai di dropdown, badge, dan tombol pada form transaksi.
 *
 * @type {Record<string, string>}
 */
export const TRANSACTION_TYPE_LABELS = {
  [TRANSACTION_TYPES.PENARUH]:    'Penaruh (Tambah Stok)',
  [TRANSACTION_TYPES.PENGAMBIL]:  'Pengambil (Ambil Barang)',
  [TRANSACTION_TYPES.PEMINJAM]:   'Peminjam (Pinjam Barang)',
  [TRANSACTION_TYPES.PENGEMBALI]: 'Pengembali (Kembalikan Barang)',
}

/**
 * Daftar event yang sedang aktif menggunakan sistem gudang.
 * Update list ini sesuai event yang berlangsung.
 *
 * @type {string[]}
 */
export const EVENT_NAMES = [
  'Event A',
  'Event B',
  'Event C',
  'Event D',
  'Event E',
  'Event F',
]

/**
 * Status barang yang valid.
 * Harus sama persis dengan CHECK constraint di tabel items di database.
 *
 * @type {{ ACTIVE: string, ARCHIVED: string }}
 */
export const ITEM_STATUS = {
  /** Barang aktif dan tampil di katalog */
  ACTIVE: 'active',
  /** Barang diarsipkan — stok habis atau tidak dipakai */
  ARCHIVED: 'archived',
}

/**
 * Daftar 15 Kategori Barang Inventaris Gudang RTB.
 * Digunakan untuk pengelompokan barang, filter katalog, serta form tambah/edit barang.
 *
 * @type {string[]}
 */
export const ITEM_CATEGORIES = [
  'Kertas',
  'Kain',
  'Alat Tulis',
  'Alat Mewarnai',
  'Lem & Perekat',
  'Alat Potong',
  'Tali',
  'Pita',
  'Bola',
  'Pipa',
  'Banner',
  'Aksesoris',
  'Alat Makan',
  'Elektronik & Sound',
  'Lain-lain'
]

/**
 * Pemetaan Ikon Visual (Emoji) untuk masing-masing kategori barang.
 * Membantu panitia mengidentifikasi kategori barang secara visual dan intuitif.
 *
 * @type {Record<string, string>}
 */
export const CATEGORY_ICONS = {
  'Kertas': '📄',
  'Kain': '🧵',
  'Alat Tulis': '✏️',
  'Alat Mewarnai': '🎨',
  'Lem & Perekat': '🧴',
  'Alat Potong': '✂️',
  'Tali': '🧶',
  'Pita': '🎀',
  'Bola': '⚽',
  'Pipa': '🪠',
  'Banner': '🚩',
  'Aksesoris': '💍',
  'Alat Makan': '🍽️',
  'Elektronik & Sound': '🔊',
  'Lain-lain': '📦'
}

/**
 * Target ukuran maksimal foto bukti transaksi setelah kompresi (dalam MB).
 * Dipakai di src/lib/imageCompression.js (Fase 6).
 */
export const MAX_PROOF_PHOTO_SIZE_MB = 0.2  // 200KB

