import { useState, useRef } from 'react'

interface QRCodeResponse {
  transactionId: string
  qrCode: string
  deepLink: string
}

interface CredentialStatus {
  [key: string]: unknown
}

const ACCESS_TOKEN = '0o46xacGRVGbj42jY8VQwXWftuqIyGMR'
const VC_UID = '00000000_demo'
const POLL_MS = 3000

const ISSUE_HEADERS = {
  accept: 'application/json',
  'Access-Token': ACCESS_TOKEN,
  'Content-Type': 'application/json',
}

const QUERY_HEADERS = {
  accept: '*/*',
  'Access-Token': ACCESS_TOKEN,
}

function toDateStr(date: Date) {
  return date.toISOString().slice(0, 10).replace(/-/g, '')
}

function plusDays(days: number) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return toDateStr(d)
}

type Mode = 'data' | 'nodata'

function Issuer() {
  const [mode, setMode] = useState<Mode>('data')
  const [idNumber, setIdNumber] = useState('A123456789')
  const [issuanceDate, setIssuanceDate] = useState(toDateStr(new Date()))
  const [expiredDate, setExpiredDate] = useState(plusDays(7))

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [qr, setQr] = useState<QRCodeResponse | null>(null)
  const [credStatus, setCredStatus] = useState<CredentialStatus | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const stopPolling = () => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
  }

  const pollStatus = async (transactionId: string) => {
    try {
      const res = await fetch(`/issuer-api/api/credential/nonce/${transactionId}`, {
        headers: QUERY_HEADERS,
      })
      if (!res.ok) return
      const json: CredentialStatus = await res.json()
      if (json && Object.keys(json).length > 0) {
        setCredStatus(json)
        stopPolling()
      }
    } catch { /* silently retry */ }
  }

  const issue = async () => {
    stopPolling()
    setLoading(true)
    setError(null)
    setQr(null)
    setCredStatus(null)

    try {
      const endpoint =
        mode === 'data'
          ? '/issuer-api/api/qrcode/data'
          : '/issuer-api/api/qrcode/nodata'

      const body =
        mode === 'data'
          ? {
              vcUid: VC_UID,
              issuanceDate,
              expiredDate,
              fields: [{ ename: 'id_number', content: idNumber }],
            }
          : { vcUid: VC_UID }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: ISSUE_HEADERS,
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const text = await res.text()
        throw new Error(`HTTP ${res.status}: ${text}`)
      }

      const json: QRCodeResponse = await res.json()
      setQr(json)
      pollRef.current = setInterval(() => pollStatus(json.transactionId), POLL_MS)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    stopPolling()
    setQr(null)
    setCredStatus(null)
    setError(null)
  }

  return (
    <div className="page-content">
      <h2>駕照憑證發行 (Driver License Credential Issuance)</h2>

      <div className="mode-toggle">
        {(['data', 'nodata'] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => { setMode(m); reset() }}
            className={`btn-toggle ${mode === m ? 'active' : ''}`}
          >
            {m === 'data' ? '帶資料 (With Data)' : '無資料 (No Data)'}
          </button>
        ))}
      </div>

      {!qr && !credStatus && (
        <div className="form">
          {mode === 'data' ? (
            <>
              <label className="field">
                <span>身分證字號 (id_number)</span>
                <input
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value)}
                  placeholder="A123456789"
                />
              </label>
              <label className="field">
                <span>發行日期 (issuanceDate, YYYYMMDD)</span>
                <input
                  value={issuanceDate}
                  onChange={(e) => setIssuanceDate(e.target.value)}
                  placeholder="20260512"
                />
              </label>
              <label className="field">
                <span>到期日期 (expiredDate, YYYYMMDD)</span>
                <input
                  value={expiredDate}
                  onChange={(e) => setExpiredDate(e.target.value)}
                  placeholder="20260519"
                />
              </label>
            </>
          ) : (
            <p className="hint" style={{ textAlign: 'center' }}>
              無資料模式：用戶掃描後自行填入身分資料
            </p>
          )}

          <button onClick={issue} disabled={loading} className="btn-primary">
            {loading ? '發行中…' : '發行憑證'}
          </button>
        </div>
      )}

      {error && <p className="error">錯誤: {error}</p>}

      {qr && !credStatus && (
        <div className="qr-block">
          <p className="hint">請用數位憑證皮夾 App 掃描 QR Code</p>
          <img src={qr.qrCode} alt="Credential Offer QR Code" className="qr-img" />
          <p className="txid">Transaction ID: {qr.transactionId}</p>
          {qr.deepLink && (
            <a href={qr.deepLink} className="deep-link">
              {qr.deepLink}
            </a>
          )}
          <p className="hint">等待用戶掃描領取憑證…</p>
          <button onClick={reset} className="btn-secondary">重新發行</button>
        </div>
      )}

      {credStatus && (
        <div className="result-box success">
          <h3>✓ 憑證已領取</h3>
          <pre>{JSON.stringify(credStatus, null, 2)}</pre>
          <button onClick={reset} className="btn-secondary">再次發行</button>
        </div>
      )}
    </div>
  )
}

export default Issuer
