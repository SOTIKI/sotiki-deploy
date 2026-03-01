import { useState } from 'react'
import { StatusBadge } from './StatusBadge.js'
import { api, type ServiceStatus } from '../api/client.js'

const BORDER: Record<string, string> = { running: '#c8ff00', error: '#ff4444', stopped: '#ff4444' }

const btn: React.CSSProperties = {
  background: 'transparent', border: '1px solid #333', color: '#e8e8e8',
  padding: '4px 12px', cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace',
  fontSize: 12, borderRadius: 4, transition: 'border-color 150ms',
}

export function ServiceCard({ svc, onUpdate }: { svc: ServiceStatus; onUpdate?: () => void }) {
  const [loading, setLoading] = useState<string | null>(null)

  async function act(fn: () => Promise<unknown>, label: string) {
    setLoading(label)
    try { await fn(); onUpdate?.() } catch {} finally { setLoading(null) }
  }

  return (
    <div style={{ border: '1px solid #1e1e1e', borderLeft: `3px solid ${BORDER[svc.status] ?? '#444'}`,
      background: '#0f0f0f', padding: '16px 20px', borderRadius: 8, minWidth: 220,
      display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, fontSize: 13,
          color: '#e8e8e8', textTransform: 'uppercase', letterSpacing: 1 }}>{svc.name}</span>
        {svc.containerId && <span style={{ color: '#333', fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>{svc.containerId}</span>}
      </div>
      <StatusBadge status={svc.status} />
      <div style={{ display: 'flex', gap: 16, color: '#666', fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>
        <span>uptime: <span style={{ color: '#e8e8e8' }}>{svc.uptime}</span></span>
        {svc.port && <span style={{ color: '#444' }}>:{svc.port}</span>}
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        {svc.status !== 'running'
          ? <button style={{ ...btn, borderColor: '#c8ff00', color: '#c8ff00' }} disabled={!!loading}
              onClick={() => act(() => api.services.start(svc.name), 'start')}>
              {loading === 'start' ? '...' : 'Start'}
            </button>
          : <button style={btn} disabled={!!loading}
              onClick={() => act(() => api.services.stop(svc.name), 'stop')}>
              {loading === 'stop' ? '...' : 'Stop'}
            </button>
        }
        <button style={btn} disabled={!!loading}
          onClick={() => act(() => api.services.restart(svc.name), 'restart')}>
          {loading === 'restart' ? '...' : 'Restart'}
        </button>
      </div>
    </div>
  )
}