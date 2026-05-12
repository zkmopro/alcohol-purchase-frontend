import { useState } from 'react'
import Issuer from './pages/Issuer'
import Verifier from './pages/Verifier'
import './App.css'

type Tab = 'issuer' | 'verifier'

function App() {
  const [tab, setTab] = useState<Tab>('issuer')

  return (
    <div className="app">
      <header className="app-header">
        <h1>數位憑證皮夾沙盒</h1>
        <p className="subtitle">Digital Credential Wallet Sandbox</p>
      </header>

      <nav className="tab-bar">
        <button
          onClick={() => setTab('issuer')}
          className={`tab-btn ${tab === 'issuer' ? 'active' : ''}`}
        >
          發行憑證 (Issuer)
        </button>
        <button
          onClick={() => setTab('verifier')}
          className={`tab-btn ${tab === 'verifier' ? 'active' : ''}`}
        >
          驗證憑證 (Verifier)
        </button>
      </nav>

      <main className="app-main">
        {tab === 'issuer' ? <Issuer /> : <Verifier />}
      </main>
    </div>
  )
}

export default App
