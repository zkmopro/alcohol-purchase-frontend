import { useState, useEffect, useRef } from 'react'

interface QRCodeResponse {
  transactionId: string
  qrcodeImage: string
  authUri: string
}

interface VerifyResult {
  [key: string]: unknown
}

const HEADERS = {
  accept: '*/*',
  'Access-Token': 'JXkJnhep7Cy11F74yoy5ea69xcOmwXfP',
  'Content-Type': 'application/json',
}

const POLL_MS = 3000

function Verifier() {
  const [qr, setQr] = useState<QRCodeResponse | null>(null)
  const [result, setResult] = useState<VerifyResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const stopPolling = () => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
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
      if (json && Object.keys(json).length > 0) {
        setResult(json)
        stopPolling()
      }
    } catch { /* silently retry */ }
  }

  const fetchQRCode = async () => {
    stopPolling()
    setLoading(true)
    setError(null)
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
      pollRef.current = setInterval(() => pollResult(json.transactionId), POLL_MS)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchQRCode(); return stopPolling }, [])

  return (
    <div className="page-content">
      <h2>Taiwan Driver License Verifier</h2>

      {loading && <p className="hint">Loading QR code…</p>}
      {error && <p className="error">Error: {error}</p>}

      {qr && !result && (
        <div className="qr-block">
          <p className="hint">Scan the QR code with your wallet app</p>
          <img src={qr.qrcodeImage} alt="Verification QR Code" className="qr-img" />
          <p className="txid">Transaction ID: {qr.transactionId}</p>
          <p className="hint">Waiting for verification…</p>
        </div>
      )}

      {result && (
        <div className="result-box success">
          <h3>✓ Verified</h3>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}

      <button onClick={fetchQRCode} disabled={loading} className="btn-primary">
        {loading ? 'Loading…' : 'New Verification'}
      </button>
    </div>
  )
}

export default Verifier
