import { useState } from 'react'
import { hasToken } from './api/client.js'
import { Login }     from './pages/Login.js'
import { Dashboard } from './pages/Dashboard.js'
import { Logs }      from './pages/Logs.js'
import { Config }    from './pages/Config.js'

type Tab = 'dashboard' | 'logs' | 'config'
const TABS: { id: Tab; label: string }[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'logs',      label: 'Logs' },
  { id: 'config',    label: 'Config' },
]

export function App() {
  const [authed, setAuthed] = useState(hasToken())
  const [tab, setTab]       = useState<Tab>('dashboard')

  if (!authed) return <Login onLogin={() => setAuthed(true)} />

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#e8e8e8' }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: 32, padding: '0 32px',
        height: 56, borderBottom: '1px solid #1e1e1e', position: 'sticky', top: 0,
        background: '#0a0a0a', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <span style={{ color: '#c8ff00', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, fontSize: 15, letterSpacing: 2 }}>SOTIKI</span>
          <span style={{ color: '#333', fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>Deploy</span>
        </div>
        <nav style={{ display: 'flex', gap: 4 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              background: 'transparent', border: 'none',
              color: tab === t.id ? '#e8e8e8' : '#444',
              padding: '6px 16px', cursor: 'pointer',
              fontFamily: 'JetBrains Mono, monospace', fontSize: 13,
              borderBottom: tab === t.id ? '2px solid #c8ff00' : '2px solid transparent',
            }}>{t.label}</button>
          ))}
        </nav>
      </header>
      <main style={{ padding: 32, maxWidth: 1200, margin: '0 auto' }}>
        {tab === 'dashboard' && <Dashboard />}
        {tab === 'logs'      && <Logs />}
        {tab === 'config'    && <Config />}
      </main>
    </div>
  )
}