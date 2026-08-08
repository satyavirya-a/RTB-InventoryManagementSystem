/**
 * @folder src/hooks/
 *
 * Berisi Custom React Hooks — fungsi JavaScript biasa yang namanya diawali "use".
 *
 * Custom Hook adalah cara untuk "mengekstrak" logika stateful yang bisa dipakai
 * ulang di banyak komponen, tanpa harus copy-paste kode.
 *
 * Hook yang akan dibuat:
 * - useCart.js        → Shortcut untuk mengakses CartContext (Fase 4)
 * - useItems.js       → Fetch & filter daftar barang dari Supabase (Fase 3)
 * - useAuth.js        → Cek status login user (Fase 7)
 *
 * Aturan penting Custom Hooks (dari React):
 * 1. Nama HARUS diawali "use" — ini bukan aturan gaya, ini convention yang
 *    membuat React tahu untuk memeriksa aturan Hooks di dalamnya.
 * 2. Hanya boleh dipanggil di dalam komponen React atau Hook lain — tidak boleh
 *    dipanggil di dalam kondisi (if), loop, atau fungsi biasa.
 */

export {}
