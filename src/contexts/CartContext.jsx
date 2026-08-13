/**
 * CartContext.jsx — Manajemen state keranjang belanja (cart) secara global.
 *
 * Kenapa pakai React Context, bukan props biasa?
 * Cart perlu diakses oleh BANYAK komponen yang tidak berurutan:
 *   ItemCard (tambah) → CartDrawer (tampilkan) → CheckoutForm (submit)
 *
 * Kalau pakai props, kita harus "melempar" state cart dari App → CatalogPage → ItemCard
 * meskipun CatalogPage sama sekali tidak butuh data cart. Ini disebut "prop drilling" —
 * sangat merepotkan dan membuat kode sulit dipahami.
 *
 * Context memungkinkan komponen mana pun mengakses cart langsung, tanpa perantara:
 *   ItemCard → useCart() → CartContext (langsung dapat, tanpa lewat CatalogPage)
 *
 * PENTING: Cart TIDAK disimpan ke localStorage.
 * Alasan: perangkat di event biasanya shared (panitia gantian pakai HP yang sama).
 * Cart harus reset setiap kali halaman di-refresh — sesuai PRD AGENTS.md.
 */
import { createContext, useContext, useReducer } from 'react'

// =============================================================================
// 1. Buat Context
// =============================================================================

/**
 * Context object untuk cart. Tidak dipakai langsung oleh komponen —
 * gunakan hook useCart() sebagai gantinya.
 *
 * @type {React.Context}
 */
const CartContext = createContext(null)

// =============================================================================
// 2. Reducer — Satu Fungsi untuk Semua Perubahan State Cart
// =============================================================================

/**
 * Daftar action type yang valid untuk cart reducer.
 * Didefinisikan sebagai konstanta agar tidak typo saat dipakai.
 *
 * @type {object}
 */
const CART_ACTIONS = {
  ADD_ITEM:        'ADD_ITEM',
  REMOVE_ITEM:     'REMOVE_ITEM',
  UPDATE_QUANTITY: 'UPDATE_QUANTITY',
  CLEAR_CART:      'CLEAR_CART',
}

/**
 * Reducer cart — fungsi murni (pure function) yang menerima state lama
 * dan action, lalu mengembalikan state baru.
 *
 * Kenapa useReducer dan bukan useState?
 * - Cart punya beberapa jenis operasi (add/remove/update/clear)
 * - Semua logika tersentralisasi di satu tempat — lebih mudah di-debug
 * - Setiap action terdokumentasi dengan jelas lewat `type`
 *
 * @param {Array} state - Isi cart saat ini: array of { item, quantity }
 * @param {{ type: string, payload: any }} action - Aksi yang dilakukan
 * @returns {Array} State cart baru
 */
function cartReducer(state, action) {
  switch (action.type) {

    case CART_ACTIONS.ADD_ITEM: {
      const { item, quantity } = action.payload
      const existingIndex = state.findIndex((entry) => entry.item.id === item.id)

      if (existingIndex !== -1) {
        // Barang sudah ada di cart — tambahkan quantity-nya
        const existing  = state[existingIndex]
        const newQty    = existing.quantity + quantity

        // Validasi: tidak boleh melebihi stok tersedia
        const finalQty  = Math.min(newQty, item.stock_available)

        const updated = [...state]
        updated[existingIndex] = { ...existing, quantity: finalQty }
        return updated
      }

      // Barang baru — tambahkan ke cart
      // Validasi: quantity tidak boleh melebihi stock_available
      const safeQty = Math.min(quantity, item.stock_available)
      return [...state, { item, quantity: safeQty }]
    }

    case CART_ACTIONS.REMOVE_ITEM: {
      return state.filter((entry) => entry.item.id !== action.payload.itemId)
    }

    case CART_ACTIONS.UPDATE_QUANTITY: {
      const { itemId, quantity } = action.payload
      return state.map((entry) => {
        if (entry.item.id !== itemId) return entry

        // Validasi: min 1, max stock_available
        const clampedQty = Math.max(1, Math.min(quantity, entry.item.stock_available))
        return { ...entry, quantity: clampedQty }
      })
    }

    case CART_ACTIONS.CLEAR_CART: {
      return []
    }

    default:
      // Jika action tidak dikenal, kembalikan state tanpa perubahan
      console.warn('[CartContext] Action tidak dikenal:', action.type)
      return state
  }
}

// =============================================================================
// 3. Provider — Membungkus App agar semua komponen bisa akses cart
// =============================================================================

/**
 * CartProvider membungkus aplikasi dan menyediakan state cart secara global.
 * Harus dipasang di atas komponen yang butuh akses cart (minimal di App.jsx).
 *
 * @param {{ children: React.ReactNode }} props
 * @returns {JSX.Element}
 *
 * @example
 * // Di main.jsx atau App.jsx:
 * <CartProvider>
 *   <App />
 * </CartProvider>
 */
export function CartProvider({ children }) {
  // cartItems: array of { item: object, quantity: number }
  const [cartItems, dispatch] = useReducer(cartReducer, [])

  // ===== Fungsi-fungsi cart yang tersedia untuk semua komponen =====

  /**
   * Tambahkan barang ke keranjang. Jika sudah ada, kuantitas ditambahkan.
   * Kuantitas dibatasi oleh stock_available barang.
   *
   * @param {object} item - Data barang dari tabel items
   * @param {number} [quantity=1] - Jumlah yang ditambahkan
   */
  function addToCart(item, quantity = 1) {
    if (item.stock_available <= 0) {
      console.warn('[CartContext] Tidak bisa tambah barang dengan stok 0:', item.name)
      return
    }
    dispatch({ type: CART_ACTIONS.ADD_ITEM, payload: { item, quantity } })
  }

  /**
   * Hapus barang dari keranjang berdasarkan ID.
   *
   * @param {string} itemId - UUID barang yang akan dihapus
   */
  function removeFromCart(itemId) {
    dispatch({ type: CART_ACTIONS.REMOVE_ITEM, payload: { itemId } })
  }

  /**
   * Ubah kuantitas barang di keranjang.
   * Nilai di-clamp otomatis: min=1, max=stock_available.
   *
   * @param {string} itemId - UUID barang
   * @param {number} quantity - Kuantitas baru
   */
  function updateQuantity(itemId, quantity) {
    dispatch({ type: CART_ACTIONS.UPDATE_QUANTITY, payload: { itemId, quantity } })
  }

  /**
   * Kosongkan seluruh isi keranjang. Dipanggil setelah checkout berhasil.
   */
  function clearCart() {
    dispatch({ type: CART_ACTIONS.CLEAR_CART })
  }

  /**
   * Total jumlah item berbeda di keranjang (bukan total quantity).
   * Dipakai untuk badge angka di ikon cart.
   *
   * @type {number}
   */
  const totalUniqueItems = cartItems.length

  /**
   * Total seluruh unit barang di keranjang (semua quantity dijumlahkan).
   *
   * @type {number}
   */
  const totalQuantity = cartItems.reduce((sum, entry) => sum + entry.quantity, 0)

  /**
   * Nilai yang tersedia untuk semua komponen yang mengkonsumsi context ini.
   */
  const contextValue = {
    cartItems,
    totalUniqueItems,
    totalQuantity,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
  }

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  )
}

// =============================================================================
// 4. Custom Hook — Cara yang direkomendasikan untuk mengakses cart
// =============================================================================

/**
 * Hook untuk mengakses semua data dan fungsi cart dari komponen manapun.
 *
 * @returns {{
 *   cartItems: Array,
 *   totalUniqueItems: number,
 *   totalQuantity: number,
 *   addToCart: Function,
 *   removeFromCart: Function,
 *   updateQuantity: Function,
 *   clearCart: Function
 * }}
 *
 * @throws {Error} Jika dipakai di luar CartProvider
 *
 * @example
 * function ItemCard({ item }) {
 *   const { addToCart } = useCart()
 *   return <button onClick={() => addToCart(item, 1)}>Tambah</button>
 * }
 */
export function useCart() {
  const context = useContext(CartContext)

  // Guard: pastikan hook dipakai di dalam CartProvider
  if (context === null) {
    throw new Error(
      '[useCart] useCart harus dipakai di dalam CartProvider. ' +
      'Pastikan CartProvider sudah dipasang di App.jsx atau main.jsx.'
    )
  }

  return context
}
