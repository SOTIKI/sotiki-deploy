import { useState } from 'react'
import { api, setToken } from '../api/client.js'

export function Login({ onLogin }: { onLogin: () => void }) {
  const [pw, setPw]       = useState('')
  const [err, setErr]     = useState('')
  const [loading, setLoading] = useState(false)

  async function submit() {
    if (!pw) return
    setLoading(true); setErr('')
    try { const { token } = await api.login(pw); setToken(token); onLogin() }
    catch (e) { setErr(e instanceof Error ? e.message : 'Login failed') }
    finally { setLoading(false) }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0a0a0a' }}>
      <div style={{ width: 320, display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div>
          <div style={{ color: '#c8ff00', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, fontSize: 20, letterSpacing: 2 }}>SOTIKI</div>
          <div style={{ color: '#444', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, marginTop: 4 }}>Deploy Dashboard</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input type="password" placeholder="Password" value={pw}
            onChange={e => setPw(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()}
            style={{ background: '#0f0f0f', border: '1px solid #1e1e1e', color: '#e8e8e8',
              padding: '12px 16px', borderRadius: 8, fontFamily: 'JetBrains Mono, monospace', fontSize: 14, outline: 'none' }} />
          {err && <div style={{ color: '#ff4444', fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>{err}</div>}
          <button onClick={submit} disabled={loading || !pw}
            style={{ background: '#0a1a00', border: '1px solid #c8ff00', color: '#c8ff00',
              padding: 12, cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace', fontSize: 14,
              borderRadius: 8, opacity: loading || !pw ? 0.6 : 1 }}>
            {loading ? 'Authenticating...' : 'Enter'}
          </button>
        </div>
      </div>
    </div>
  )
}