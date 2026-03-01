import { useState } from 'react'
import { LogStream } from '../components/LogStream.js'

const SVCS = ['storage', 'nginx', 'postgresql']

export function Logs() {
  const [active, setActive] = useState('storage')
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, height: 'calc(100vh - 120px)' }}>
      <div style={{ display: 'flex', gap: 8 }}>
        {SVCS.map(s => (
          <button key={s} onClick={() => setActive(s)} style={{
            background: active === s ? '#1a1a1a' : 'transparent',
            border: `1px solid ${active === s ? '#c8ff00' : '#333'}`,
            color: active === s ? '#c8ff00' : '#666',
            padding: '6px 16px', cursor: 'pointer',
            fontFamily: 'JetBrains Mono, monospace', fontSize: 12, borderRadius: 4,
          }}>{s}</button>
        ))}
      </div>
      <LogStream service={active} />
    </div>
  )
}