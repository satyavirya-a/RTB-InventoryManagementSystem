-- =============================================================================
-- SQL Schema — Gudang RTB
-- =============================================================================
-- Jalankan file ini di Supabase SQL Editor (satu kali saat setup awal).
-- Cara: Dashboard Supabase → SQL Editor → New Query → paste → Run
--
-- PERHATIAN: Jalankan secara berurutan dari atas ke bawah.
-- Jika sudah pernah dijalankan, hapus tabel lama dulu dengan DROP TABLE (hati-hati!)
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1. TABEL: items
--    Katalog semua barang yang ada di gudang.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS items (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text        NOT NULL,
  description     text,
  photo_url       text,

  -- Membedakan barang habis pakai vs pinjam-kembali.
  -- true  = consumable (kabel ties, double tape, dll)
  -- false = non-consumable (proyektor, kabel HDMI, dll)
  is_consumable   boolean     NOT NULL DEFAULT true,

  -- Stok siap pakai/pinjam. Tidak boleh negatif.
  stock_available integer     NOT NULL DEFAULT 0 CHECK (stock_available >= 0),

  -- Khusus non-consumable: berapa unit sedang dipinjam.
  -- Jika is_consumable = true, kolom ini selalu 0.
  stock_in_use    integer     NOT NULL DEFAULT 0 CHECK (stock_in_use >= 0),

  unit            text        NOT NULL DEFAULT 'pcs',

  -- 'active'   = barang tampil di katalog
  -- 'archived' = barang tidak tampil (stok habis atau dihapus soft)
  status          text        NOT NULL DEFAULT 'active'
                              CHECK (status IN ('active', 'archived')),

  event_name      text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- Index untuk mempercepat query filter status (paling sering dipakai)
CREATE INDEX IF NOT EXISTS idx_items_status ON items(status);
CREATE INDEX IF NOT EXISTS idx_items_event_name ON items(event_name);

-- Komentar kolom (tampil di Supabase Table Editor)
COMMENT ON TABLE  items IS 'Katalog barang gudang RTB';
COMMENT ON COLUMN items.is_consumable   IS 'true = habis pakai, false = pinjam-kembali';
COMMENT ON COLUMN items.stock_available IS 'Stok siap pakai/pinjam saat ini';
COMMENT ON COLUMN items.stock_in_use    IS 'Jumlah unit non-consumable yang sedang dipinjam';
COMMENT ON COLUMN items.status          IS 'active | archived';


-- -----------------------------------------------------------------------------
-- 2. TABEL: transactions
--    Header setiap kali checkout dilakukan.
--    1 baris = 1x proses checkout (bisa berisi banyak barang dari cart).
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS transactions (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 5 jenis transaksi inventaris:
  -- 'pemakaian'    = mengambil atau meminjam barang dari gudang
  -- 'pengembalian' = mengembalikan barang yang sedang dipinjam
  -- 'penitipan'    = mencatat titipan barang luar ke dalam gudang
  -- 'pengambilan'  = mengambil kembali barang titipan yang ada di gudang
  -- 'penambahan'   = log penambahan barang baru oleh PIC gudang
  -- 'penghapusan'   = log penghapusan barang dari katalog oleh PIC gudang
  transaction_type text NOT NULL CHECK (transaction_type IN ('pemakaian', 'pengembalian', 'penitipan', 'pengambilan', 'penambahan', 'penghapusan')),

  actor_name       text NOT NULL,        -- Nama panitia yang melakukan transaksi
  event_name       text,                 -- Untuk event apa transaksi ini
  proof_photo_url  text,                 -- URL foto bukti (sudah dikompresi)
  notes            text,                 -- Catatan tambahan opsional
  
  -- Foreign Key self-referencing: Khusus untuk transaksi 'pengambilan',
  -- mereferensikan ID transaksi 'penitipan' awal yang diambil.
  related_transaction_id uuid REFERENCES transactions(id) ON DELETE SET NULL,
  
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_transactions_actor   ON transactions(actor_name);
CREATE INDEX IF NOT EXISTS idx_transactions_type    ON transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_transactions_created ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_related ON transactions(related_transaction_id);

COMMENT ON TABLE  transactions IS 'Header transaksi gudang — satu baris per checkout/aksi';
COMMENT ON COLUMN transactions.transaction_type IS 'pemakaian | pengembalian | penitipan | pengambilan | penambahan | penghapusan';
COMMENT ON COLUMN transactions.related_transaction_id IS 'ID transaksi penitipan yang diambil kembali (khusus pengambilan)';


-- -----------------------------------------------------------------------------
-- 3. TABEL: transaction_details
--    Isi keranjang yang tersimpan setelah checkout.
--    Relasi: 1 transaction → banyak transaction_details
--            1 item       → banyak transaction_details (histori pemakaian)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS transaction_details (
  id             uuid    PRIMARY KEY DEFAULT gen_random_uuid(),

  -- ON DELETE CASCADE: jika transaksi header dihapus, detail ikut terhapus
  transaction_id uuid    NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  item_id        uuid    NOT NULL REFERENCES items(id),

  quantity       integer NOT NULL CHECK (quantity > 0),
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_td_transaction ON transaction_details(transaction_id);
CREATE INDEX IF NOT EXISTS idx_td_item        ON transaction_details(item_id);

COMMENT ON TABLE transaction_details IS 'Detail barang per transaksi (isi cart yang tersimpan)';


-- -----------------------------------------------------------------------------
-- 4. TRIGGER: Auto-update items.updated_at
--    Setiap kali baris di tabel items diupdate, kolom updated_at ikut diperbarui.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_items_updated_at
  BEFORE UPDATE ON items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


-- -----------------------------------------------------------------------------
-- 5. FUNGSI RPC: process_checkout_transaction
--    Fungsi ini memproses satu kali checkout secara ATOMIK:
--    - Insert header transaksi
--    - Insert detail per item (untuk Pemakaian & Pengembalian)
--    - Update stok sesuai jenis transaksi
--    Jika satu langkah gagal, SEMUA dibatalkan (rollback otomatis).
-- -----------------------------------------------------------------------------
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
  -- Validasi jenis transaksi
  IF p_transaction_type NOT IN ('pemakaian', 'pengembalian', 'penitipan') THEN
    RAISE EXCEPTION 'Jenis transaksi tidak valid: %', p_transaction_type;
  END IF;

  -- 1. Buat header transaksi
  INSERT INTO transactions (transaction_type, actor_name, event_name, proof_photo_url, notes)
  VALUES (p_transaction_type, p_actor_name, p_event_name, p_proof_photo_url, p_notes)
  RETURNING id INTO v_transaction_id;

  -- Khusus Penitipan, tidak perlu proses detail item
  IF p_transaction_type = 'penitipan' THEN
    RETURN v_transaction_id;
  END IF;

  -- Validasi cart tidak kosong untuk pemakaian/pengembalian
  IF jsonb_array_length(p_cart_items) = 0 THEN
    RAISE EXCEPTION 'Cart tidak boleh kosong untuk transaksi ini';
  END IF;

  -- 2. Loop setiap item di cart
  FOR v_cart_item IN SELECT * FROM jsonb_array_elements(p_cart_items)
  LOOP
    v_item_id  := (v_cart_item->>'item_id')::uuid;
    v_quantity := (v_cart_item->>'quantity')::integer;

    -- 3. Ambil data item (lock row agar tidak ada race condition)
    SELECT is_consumable, stock_available, stock_in_use
    INTO v_is_consumable, v_stock_avail, v_stock_in_use
    FROM items
    WHERE id = v_item_id
    FOR UPDATE;  -- <-- Kunci baris ini selama transaksi berjalan

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Barang dengan id % tidak ditemukan', v_item_id;
    END IF;

    -- 4. Insert detail transaksi
    INSERT INTO transaction_details (transaction_id, item_id, quantity)
    VALUES (v_transaction_id, v_item_id, v_quantity);

    -- 5. Update stok sesuai jenis transaksi (General Inventory System)
    IF p_transaction_type = 'pemakaian' THEN
      IF v_stock_avail < v_quantity THEN
        RAISE EXCEPTION 'Stok tidak cukup untuk barang %', v_item_id;
      END IF;
      
      -- Semua barang: kurangi stok tersedia dan tambah stok sedang dipakai
      UPDATE items 
      SET stock_available = stock_available - v_quantity,
          stock_in_use = stock_in_use + v_quantity
      WHERE id = v_item_id;

    ELSIF p_transaction_type = 'pengembalian' THEN
      -- Validasi: jumlah yang dikembalikan tidak boleh melebihi jumlah yang sedang dipakai/dipinjam
      IF v_stock_in_use < v_quantity THEN
        RAISE EXCEPTION 'Jumlah pengembalian (% unit) melebihi jumlah barang yang sedang dipakai (% unit)', v_quantity, v_stock_in_use;
      END IF;

      -- Semua barang: kembalikan stok ke tersedia dan kurangi stok sedang dipakai
      UPDATE items 
      SET stock_available = stock_available + v_quantity,
          stock_in_use = stock_in_use - v_quantity
      WHERE id = v_item_id;
    END IF;

  END LOOP;

  RETURN v_transaction_id;
END;
$$;

-- -----------------------------------------------------------------------------
-- 6. VIEW: active_loans
--    Melihat siapa yang masih membawa/memakai barang inventaris (belum dikembalikan)
-- -----------------------------------------------------------------------------
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
GROUP BY t.actor_name, t.event_name, td.item_id, i.name
HAVING (
    SUM(CASE WHEN t.transaction_type = 'pemakaian' THEN td.quantity ELSE 0 END) -
    SUM(CASE WHEN t.transaction_type = 'pengembalian' THEN td.quantity ELSE 0 END)
) > 0;

-- -----------------------------------------------------------------------------
-- 6.1 VIEW: active_deposits
--     Melihat daftar barang titipan yang saat ini masih tersimpan (belum diambil)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW active_deposits AS
SELECT 
    t.id,
    t.actor_name AS depositor_name,
    t.event_name,
    t.proof_photo_url,
    t.notes,
    t.created_at AS deposited_at
FROM transactions t
WHERE t.transaction_type = 'penitipan'
  AND t.id NOT IN (
    SELECT related_transaction_id 
    FROM transactions 
    WHERE transaction_type = 'pengambilan' 
      AND related_transaction_id IS NOT NULL
  )
ORDER BY t.created_at DESC;

COMMENT ON FUNCTION process_checkout_transaction IS
  'Proses checkout atomik: insert transaksi + update stok semua item dalam satu DB transaction. Logika stok penuh ditambahkan di Fase 5.';


-- -----------------------------------------------------------------------------
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
--    RLS mengatur siapa boleh baca/tulis data di level baris database.
--
--    KONTEKS:
--    Saat menjalankan CREATE TABLE di Supabase, akan muncul warning:
--    "This query creates tables without enabling Row Level Security"
--    → Pilih "Run and enable RLS" (lebih aman).
--
--    Setelah RLS aktif, SEMUA query diblokir secara default.
--    Kita perlu mendefinisikan "policy" untuk mengizinkan akses yang kita inginkan.
--
--    STRATEGI MVP (Fase 1-6):
--    Policy longgar — semua orang boleh baca dan tulis.
--    Ini cukup untuk development dan testing internal dengan 60 panitia.
--
--    STRATEGI PRODUKSI (Fase 7+):
--    Policy diperketat — INSERT/UPDATE hanya untuk user yang sudah login.
--    Lihat docs/sql-rls-policies.sql (dibuat di Fase 7).
--
--    CARA MENJALANKAN:
--    Jalankan section ini di SQL Editor SETELAH schema di atas berhasil dijalankan.
-- -----------------------------------------------------------------------------

-- === TABEL: items ===

-- Siapa pun (termasuk user yang belum login) bisa membaca katalog barang
DROP POLICY IF EXISTS "Public dapat membaca items" ON items;
CREATE POLICY "Public dapat membaca items"
  ON items
  FOR SELECT
  USING (true);

-- Siapa pun bisa menambah barang baru (MVP — diperketat di Fase 7)
DROP POLICY IF EXISTS "Public dapat insert items" ON items;
CREATE POLICY "Public dapat insert items"
  ON items
  FOR INSERT
  WITH CHECK (true);

-- Siapa pun bisa mengubah stok barang (MVP — diperketat di Fase 7)
-- Perubahan stok yang BENAR dilakukan via RPC function, bukan langsung UPDATE.
-- Policy ini dibutuhkan agar RPC function bisa mengeksekusi UPDATE.
DROP POLICY IF EXISTS "Public dapat update items" ON items;
CREATE POLICY "Public dapat update items"
  ON items
  FOR UPDATE
  USING (true);


-- === TABEL: transactions ===

-- Siapa pun bisa membaca riwayat transaksi
DROP POLICY IF EXISTS "Public dapat membaca transactions" ON transactions;
CREATE POLICY "Public dapat membaca transactions"
  ON transactions
  FOR SELECT
  USING (true);

-- Siapa pun bisa membuat transaksi baru (MVP — diperketat di Fase 7)
DROP POLICY IF EXISTS "Public dapat insert transactions" ON transactions;
CREATE POLICY "Public dapat insert transactions"
  ON transactions
  FOR INSERT
  WITH CHECK (true);


-- === TABEL: transaction_details ===

-- Siapa pun bisa membaca detail transaksi
DROP POLICY IF EXISTS "Public dapat membaca transaction_details" ON transaction_details;
CREATE POLICY "Public dapat membaca transaction_details"
  ON transaction_details
  FOR SELECT
  USING (true);

-- Siapa pun bisa menambah detail transaksi (MVP — diperketat di Fase 7)
DROP POLICY IF EXISTS "Public dapat insert transaction_details" ON transaction_details;
CREATE POLICY "Public dapat insert transaction_details"
  ON transaction_details
  FOR INSERT
  WITH CHECK (true);


-- -----------------------------------------------------------------------------
-- CATATAN KEAMANAN:
--
-- Policy di atas sengaja longgar untuk kemudahan development.
-- Di Fase 7 (Autentikasi), policy INSERT/UPDATE akan diubah menjadi:
--
--   WITH CHECK (auth.role() = 'authenticated')
--
-- Artinya hanya user yang sudah login yang bisa melakukan perubahan data.
-- SELECT tetap public karena panitia perlu melihat katalog sebelum login.
-- -----------------------------------------------------------------------------


-- -----------------------------------------------------------------------------
-- 8. SUPABASE STORAGE BUCKETS & POLICIES (Fase 6)
--    Menyiapkan bucket 'item-photos' dan 'transaction-proofs' dengan akses publik.
-- -----------------------------------------------------------------------------

-- 1. Buat bucket penyimpanan (jika belum ada) dan set sebagai Public
INSERT INTO storage.buckets (id, name, public) 
VALUES ('item-photos', 'item-photos', true) 
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('transaction-proofs', 'transaction-proofs', true) 
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Policy agar foto bisa dibaca/dilihat oleh siapa pun (Public Read)
DROP POLICY IF EXISTS "Public Read item-photos" ON storage.objects;
CREATE POLICY "Public Read item-photos" 
  ON storage.objects FOR SELECT 
  USING (bucket_id = 'item-photos');

DROP POLICY IF EXISTS "Public Read transaction-proofs" ON storage.objects;
CREATE POLICY "Public Read transaction-proofs" 
  ON storage.objects FOR SELECT 
  USING (bucket_id = 'transaction-proofs');

-- 3. Policy agar foto bisa diunggah (Public Upload - MVP)
DROP POLICY IF EXISTS "Public Upload item-photos" ON storage.objects;
CREATE POLICY "Public Upload item-photos" 
  ON storage.objects FOR INSERT 
  WITH CHECK (bucket_id = 'item-photos');

DROP POLICY IF EXISTS "Public Upload transaction-proofs" ON storage.objects;
CREATE POLICY "Public Upload transaction-proofs" 
  ON storage.objects FOR INSERT 
  WITH CHECK (bucket_id = 'transaction-proofs');


