/**
 * App.jsx — Komponen root aplikasi Gudang RTB.
 *
 * Fase 5.5: App sekarang menggunakan pola routing sederhana
 * untuk beralih antara Dashboard (Katalog & 3 Menu) dan TransactionWizard.
 * Cart global dihilangkan karena UI sudah beralih ke form bertahap (Wizard).
 *
 * @returns {JSX.Element}
 */
import { useState } from 'react'
import Dashboard from './pages/Dashboard'
import TransactionWizard from './pages/TransactionWizard'

function App() {
  // state untuk melacak view aktif: 'dashboard', 'wizard_pemakaian', 'wizard_pengembalian', 'wizard_penitipan', 'wizard_pengambilan'
  const [currentView, setCurrentView] = useState('dashboard')
  const [selectedDeposit, setSelectedDeposit] = useState(null)

  const handleNavigate = (view, payload = null) => {
    setSelectedDeposit(payload)
    setCurrentView(view)
  }

  return (
    <div className="app-container">
      {currentView === 'dashboard' ? (
        <Dashboard onNavigate={handleNavigate} />
      ) : (
        <TransactionWizard 
          type={currentView} 
          initialDepositItem={selectedDeposit}
          onCancel={() => {
            setSelectedDeposit(null)
            setCurrentView('dashboard')
          }} 
        />
      )}
    </div>
  )
}

export default App
