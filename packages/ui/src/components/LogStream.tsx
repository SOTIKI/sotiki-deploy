import { useEffect, useRef, useState } from 'react'

const LEVEL_COLOR: Record<string, string> = { error: '#ff4444', warn: '#ffaa00', debug: '#444' }

function level(line: string): string {
  const l = line.toLowerCase()
  return l.includes('error') ? 'error' : l.includes('warn') ? 'warn' : l.includes('debug') ? 'debug' : 'info'
}

const iStyle: React.CSSProperties = {
  background: '#0f0f0f', border: '1px solid #1e1e1e', color: '#e8e8e8',
  padding: '6px 12px', borderRadius: 4, fontFamily: 'JetBrains Mono, monospace',
  fontSize: 12, outline: 'none',
}
const bStyle: React.CSSProperties = {
  background: 'transparent', border: '1px solid #333', color: '#666',
  padding: '6px 16px', cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace',
  fontSize: 12, borderRadius: 4,
}

export function LogStream({ service }: { service: string }) {
  const [lines, setLines] = useState<string[]>([])
  const [paused, setPaused] = useState(false)
  const [filter, setFilter] = useState('')
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setLines([])
    const ws = new WebSocket(`ws://localhost:8080/ws/logs?service=${service}`)
    ws.onmessage = e => {
      try {
        const m = JSON.parse(e.data as string) as { type: string; line?: string }
        if (m.type === 'log' && m.line) setLines(p => [...p.slice(-999), m.line as string])
      } catch {}
    }
    return () => ws.close()
  }, [service])

  useEffect(() => {
    if (!paused) endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [lines, paused])

  const shown = filter ? lines.filter(l => l.toLowerCase().includes(filter.toLowerCase())) : lines

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, height: '100%' }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <input value={filter} onChange={e => setFilter(e.target.value)}
          placeholder="Filter..." style={{ ...iStyle, flex: 1 }} />
        <button onClick={() => setPaused(p => !p)}
          style={{ ...bStyle, borderColor: paused ? '#c8ff00' : '#333', color: paused ? '#c8ff00' : '#666' }}>
          {paused ? '▶ Resume' : '⏸ Pause'}
        </button>
        <button onClick={() => setLines([])} style={bStyle}>Clear</button>
      </div>
      <div style={{ flex: 1, background: '#050505', border: '1px solid #1e1e1e', borderRadius: 8,
        padding: '12px 16px', overflowY: 'auto', fontFamily: 'JetBrains Mono, monospace',
        fontSize: 12, lineHeight: 1.7 }}>
        {!shown.length && <span style={{ color: '#333' }}>Waiting for logs...</span>}
        {shown.map((l, i) => (
          <div key={i} style={{ color: LEVEL_COLOR[level(l)] ?? '#666', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
            {l}
          </div>
        ))}
        <div ref={endRef} />
      </div>
    </div>
  )
}