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

  -- 4 jenis transaksi sesuai PRD:
  -- 'penaruh'    = menaruh/menambah stok
  -- 'pengambil'  = mengambil barang consumable
  -- 'peminjam'   = meminjam barang non-consumable
  -- 'pengembali' = mengembalikan barang yang dipinjam
  transaction_type text NOT NULL
                        CHECK (transaction_type IN ('penaruh', 'pengambil', 'peminjam', 'pengembali')),

  actor_name       text NOT NULL,        -- Nama panitia yang melakukan transaksi
  event_name       text,                 -- Untuk event apa transaksi ini
  proof_photo_url  text,                 -- URL foto bukti (sudah dikompresi)
  notes            text,                 -- Catatan tambahan opsional
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_transactions_actor   ON transactions(actor_name);
CREATE INDEX IF NOT EXISTS idx_transactions_type    ON transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_transactions_created ON transactions(created_at DESC);

COMMENT ON TABLE  transactions IS 'Header transaksi gudang — satu baris per checkout';
COMMENT ON COLUMN transactions.transaction_type IS 'penaruh | pengambil | peminjam | pengembali';


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
-- 5. FUNGSI RPC: process_checkout_transaction (KERANGKA — dilengkapi di Fase 5)
--    Fungsi ini memproses satu kali checkout secara ATOMIK:
--    - Insert header transaksi
--    - Insert detail per item
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
BEGIN
  -- Validasi jenis transaksi
  IF p_transaction_type NOT IN ('penaruh', 'pengambil', 'peminjam', 'pengembali') THEN
    RAISE EXCEPTION 'Jenis transaksi tidak valid: %', p_transaction_type;
  END IF;

  -- Validasi cart tidak kosong
  IF jsonb_array_length(p_cart_items) = 0 THEN
    RAISE EXCEPTION 'Cart tidak boleh kosong';
  END IF;

  -- 1. Buat header transaksi
  INSERT INTO transactions (transaction_type, actor_name, event_name, proof_photo_url, notes)
  VALUES (p_transaction_type, p_actor_name, p_event_name, p_proof_photo_url, p_notes)
  RETURNING id INTO v_transaction_id;

  -- 2. Loop setiap item di cart
  FOR v_cart_item IN SELECT * FROM jsonb_array_elements(p_cart_items)
  LOOP
    v_item_id  := (v_cart_item->>'item_id')::uuid;
    v_quantity := (v_cart_item->>'quantity')::integer;

    -- Ambil data item (lock row agar tidak ada race condition)
    SELECT is_consumable, stock_available
    INTO v_is_consumable, v_stock_avail
    FROM items
    WHERE id = v_item_id
    FOR UPDATE;  -- <-- Kunci baris ini selama transaksi berjalan

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Barang dengan id % tidak ditemukan', v_item_id;
    END IF;

    -- 3. Insert detail
    INSERT INTO transaction_details (transaction_id, item_id, quantity)
    VALUES (v_transaction_id, v_item_id, v_quantity);

    -- 4. Update stok sesuai jenis transaksi (LOGIKA PENUH ditambahkan di Fase 5)
    -- TODO Fase 5: tambahkan logika IF per transaction_type di sini
    --
    -- Contoh untuk 'pengambil':
    -- IF p_transaction_type = 'pengambil' THEN
    --   IF v_stock_avail < v_quantity THEN
    --     RAISE EXCEPTION 'Stok tidak cukup untuk barang %', v_item_id;
    --   END IF;
    --   UPDATE items SET stock_available = stock_available - v_quantity WHERE id = v_item_id;
    --   IF (v_stock_avail - v_quantity) = 0 THEN
    --     UPDATE items SET status = 'archived' WHERE id = v_item_id;
    --   END IF;
    -- END IF;

  END LOOP;

  RETURN v_transaction_id;
END;
$$;

COMMENT ON FUNCTION process_checkout_transaction IS
  'Proses checkout atomik: insert transaksi + update stok semua item dalam satu DB transaction. Logika stok penuh ditambahkan di Fase 5.';


-- -----------------------------------------------------------------------------
-- 6. DATA SAMPLE (opsional — untuk testing awal)
--    Hapus atau comment section ini jika tidak dibutuhkan
-- -----------------------------------------------------------------------------
-- INSERT INTO items (name, description, is_consumable, stock_available, unit, event_name)
-- VALUES
--   ('Double Tape', 'Ukuran 1 inch', true, 10, 'roll', 'Event A'),
--   ('Kabel Ties', '30cm', true, 50, 'pcs', 'Event A'),
--   ('Proyektor', 'Epson EB-X05', false, 2, 'unit', 'Event B'),
--   ('Kabel HDMI', '3 meter', false, 5, 'pcs', 'Event B');
