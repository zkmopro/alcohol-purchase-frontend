import { useState, useEffect, useRef } from 'react'
import './App.css'

interface QRCodeResponse {
  transactionId: string
  qrcodeImage: string
  authUri: string
}

interface VerifyResult {
  // shape is unknown until the user scans; treat as a generic object
  [key: string]: unknown
}

const HEADERS = {
  accept: '*/*',
  'Access-Token': 'JXkJnhep7Cy11F74yoy5ea69xcOmwXfP',
  'Content-Type': 'application/json',
}

const POLL_INTERVAL_MS = 3000

function App() {
  const [qr, setQr] = useState<QRCodeResponse | null>(null)
  const [result, setResult] = useState<VerifyResult | null>(null)
  const [qrError, setQrError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
  }

  const pollResult = async (transactionId: string) => {
    try {
      const res = await fetch('/api/oidvp/result', {
        method: 'POST',
        headers: HEADERS,
        body: JSON.stringify({ transactionId }),
      })
      if (!res.ok) return
      const json: VerifyResult = await res.json()
      // Stop polling once we have a meaningful result
      if (json && Object.keys(json).length > 0) {
        setResult(json)
        stopPolling()
      }
    } catch {
      // silently retry
    }
  }

  const fetchQRCode = async () => {
    stopPolling()
    setLoading(true)
    setQrError(null)
    setResult(null)
    const transactionId = crypto.randomUUID()
    try {
      const res = await fetch(
        `/api/oidvp/qrcode?ref=00000000_tw_driver_license&transactionId=${transactionId}`,
        { headers: HEADERS }
      )
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json: QRCodeResponse = await res.json()
      setQr(json)
      // Start polling for the verification result
      pollRef.current = setInterval(() => pollResult(json.transactionId), POLL_INTERVAL_MS)
    } catch (e) {
      setQrError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchQRCode()
    return stopPolling
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Taiwan Driver License Verifier</h1>

      {loading && <p>Loading QR code…</p>}
      {qrError && <p style={{ color: 'red' }}>Error: {qrError}</p>}

      {qr && !result && (
        <>
          <p style={{ color: '#555' }}>Scan the QR code with your wallet app</p>
          <img src={qr.qrcodeImage} alt="Verification QR Code" style={{ width: 300, height: 300 }} />
          <p style={{ fontSize: 12, color: '#999', marginTop: 8 }}>
            Transaction ID: {qr.transactionId}
          </p>
          <p style={{ fontSize: 13, color: '#888', marginTop: 4 }}>Waiting for verification…</p>
        </>
      )}

      {result && (
        <div style={{ marginTop: 16, padding: '1rem', border: '1px solid #4caf50', borderRadius: 8, maxWidth: 480, width: '100%' }}>
          <h2 style={{ color: '#4caf50', marginTop: 0 }}>Verified</h2>
          <pre style={{ fontSize: 13, overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}

      <button
        onClick={fetchQRCode}
        style={{ marginTop: 24, padding: '8px 24px', cursor: 'pointer' }}
        disabled={loading}
      >
        {loading ? 'Loading…' : 'New Verification'}
      </button>
    </div>
  )
}

export default App
