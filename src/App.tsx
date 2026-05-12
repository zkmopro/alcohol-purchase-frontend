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
        <svg className="app-logo" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <path d="M30 10 L70 10 L58 50 Q56 62 50 65 L50 80 L62 80 L62 88 L38 88 L38 80 L50 80 L50 65 Q44 62 42 50 Z" fill="#7c2d12"/>
          <path d="M36 28 Q38 42 42 50 Q44 58 50 62 Q56 58 58 50 Q62 42 64 28 Z" fill="#fed7aa" opacity="0.6"/>
        </svg>
        <h1>數位憑證皮夾沙盒</h1>
        <p className="subtitle">Alcohol Purchase · Digital Credential Sandbox</p>
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
