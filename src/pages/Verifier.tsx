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

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }
  return (
    <button onClick={copy} className={`btn-copy ${copied ? 'copied' : ''}`}>
      {copied ? '✓ Copied' : 'Copy'}
    </button>
  )
}

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
      <h2>驗證駕照憑證 (Driver License Verification)</h2>

      {loading && (
        <div className="polling-indicator">
          <span className="pulse-dot" />
          載入 QR Code 中… (Loading QR code…)
        </div>
      )}
      {error && <p className="error">錯誤 (Error): {error}</p>}

      {qr && !result && (
        <div className="qr-block">
          <p className="hint">請用數位憑證皮夾 App 掃描 QR Code<br /><span style={{ fontSize: '0.8rem' }}>Scan with your wallet app to verify</span></p>
          <img src={qr.qrcodeImage} alt="Verification QR Code" className="qr-img" />
          <div className="txid-row">
            <p className="txid">TX: {qr.transactionId}</p>
            <CopyButton text={qr.transactionId} />
          </div>
          <div className="polling-indicator">
            <span className="pulse-dot" />
            等待驗證結果 (Waiting for verification…)
          </div>
        </div>
      )}

      {result && (
        <div className="result-box success">
          <h3>✓ 驗證成功 (Verified)</h3>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}

      <button onClick={fetchQRCode} disabled={loading} className="btn-primary">
        {loading ? '載入中… (Loading…)' : '新增驗證 (New Verification)'}
      </button>
    </div>
  )
}

export default Verifier
