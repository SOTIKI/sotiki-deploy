import { useQuery } from '@tanstack/react-query'
import { api } from '../api/client.js'
import { ServiceCard } from '../components/ServiceCard.js'
import { MetricChart } from '../components/MetricChart.js'
import { StatusBadge } from '../components/StatusBadge.js'

const fmtBytes = (b: number) => { const g = b/1024/1024/1024; return g >= 1 ? `${g.toFixed(1)} GB` : `${(b/1024/1024).toFixed(0)} MB` }
const fmtBps   = (b: number) => b >= 1048576 ? `${(b/1048576).toFixed(1)} MB/s` : b >= 1024 ? `${(b/1024).toFixed(0)} KB/s` : `${Math.round(b)} B/s`

const sectionLabel: React.CSSProperties = {
  color: '#666', fontFamily: 'JetBrains Mono, monospace', fontSize: 11,
  textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12,
}

export function Dashboard() {
  const { data: status, refetch } = useQuery({ queryKey: ['status'], queryFn: api.status, refetchInterval: 10_000 })
  const { data: history }         = useQuery({ queryKey: ['metrics-1h'], queryFn: () => api.metrics.history(1), refetchInterval: 5_000 })
  const h = history ?? []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <div>
          <div style={{ ...sectionLabel, marginBottom: 6 }}>System Status</div>
          {status && <StatusBadge status={status.overall} label={status.overall === 'healthy' ? 'All systems operational' : 'Degraded'} />}
        </div>
        {status && (
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <div style={{ color: '#666', fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>{status.domain}</div>
            <div style={{ color: '#333', fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>{status.serverType}</div>
          </div>
        )}
      </div>

      {status && (
        <div>
          <div style={sectionLabel}>Services</div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {status.services.map(s => <ServiceCard key={s.name} svc={s} onUpdate={() => refetch()} />)}
          </div>
        </div>
      )}

      {h.length > 0 && (
        <div>
          <div style={sectionLabel}>Metrics — Last Hour</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
            <MetricChart data={h} title="CPU"    key="cpu"      fmt={v => `${v.toFixed(1)}%`} />
            <MetricChart data={h} title="RAM"    key="ramUsed"  fmt={fmtBytes} color="#00aaff" />
            <MetricChart data={h} title="NET IN" key="netIn"    fmt={fmtBps}   color="#ffaa00" />
            <MetricChart data={h} title="DISK"   key="diskUsed" fmt={fmtBytes} color="#aa66ff" />
          </div>
        </div>
      )}

      {(status?.recentEvents.length ?? 0) > 0 && (
        <div>
          <div style={sectionLabel}>Recent Events</div>
          <div style={{ background: '#0f0f0f', border: '1px solid #1e1e1e', borderRadius: 8 }}>
            {status!.recentEvents.map((e, i) => (
              <div key={i} style={{ display: 'flex', gap: 16, padding: '10px 16px',
                borderBottom: i < status!.recentEvents.length - 1 ? '1px solid #111' : 'none',
                fontFamily: 'JetBrains Mono, monospace', fontSize: 12, alignItems: 'center' }}>
                <span style={{ color: '#333', minWidth: 90 }}>{new Date(e.ts).toLocaleTimeString()}</span>
                <span style={{ color: e.level === 'error' ? '#ff4444' : e.level === 'warn' ? '#ffaa00' : '#444', minWidth: 40 }}>{e.level}</span>
                <span style={{ color: '#555', minWidth: 70 }}>{e.service}</span>
                <span style={{ color: '#e8e8e8' }}>{e.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}