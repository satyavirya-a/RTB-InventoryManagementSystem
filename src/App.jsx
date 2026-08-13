/**
 * App.jsx — Komponen root aplikasi Gudang RTB.
 *
 * Fase 4: App sekarang:
 * 1. Membungkus seluruh aplikasi dengan CartProvider
 * 2. Mengelola state buka/tutup CartDrawer
 * 3. Menampilkan tombol cart di header dengan badge jumlah item
 *
 * @returns {JSX.Element}
 */
import { useState } from 'react'
import { CartProvider, useCart } from './contexts/CartContext'
import CatalogPage from './pages/CatalogPage'
import CartDrawer from './components/CartDrawer'

/**
 * AppContent — komponen dalam yang bisa mengakses CartContext.
 * Dipisah dari App karena useCart() harus dipanggil di dalam CartProvider.
 * App sendiri tidak bisa pakai useCart() karena ia yang memasang CartProvider.
 *
 * @returns {JSX.Element}
 */
function AppContent() {
  const { totalQuantity } = useCart()
  const [isCartOpen, setIsCartOpen] = useState(false)

  return (
    <div className="app-container">
      {/* === Header === */}
      <header className="app-header">
        <h1>📦 Gudang RTB</h1>

        {/* Tombol buka cart dengan badge jumlah item */}
        <button
          id="btn-open-cart"
          className="app-header__cart-btn"
          onClick={() => setIsCartOpen(true)}
          aria-label={`Buka keranjang, ${totalQuantity} item`}
        >
          🛒
          {totalQuantity > 0 && (
            <span className="app-header__cart-badge" aria-hidden="true">
              {totalQuantity}
            </span>
          )}
        </button>
      </header>

      {/* === Konten Halaman === */}
      <main className="app-main" style={{ maxWidth: 'none', padding: 0 }}>
        <CatalogPage onOpenCart={() => setIsCartOpen(true)} />
      </main>

      {/* === Cart Drawer === */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onCheckout={() => {
          setIsCartOpen(false)
          // TODO Fase 5: buka CheckoutForm
          alert('Checkout akan diimplementasi di Fase 5!')
        }}
      />
    </div>
  )
}

/**
 * App — Root component. Memasang CartProvider agar semua turunannya
 * bisa akses cart via useCart().
 *
 * @returns {JSX.Element}
 */
function App() {
  return (
    <CartProvider>
      <AppContent />
    </CartProvider>
  )
}

export default App
