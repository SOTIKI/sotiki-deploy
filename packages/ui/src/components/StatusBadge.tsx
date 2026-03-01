const COLORS: Record<string, string> = {
  running: '#c8ff00', healthy: '#c8ff00',
  error: '#ff4444', stopped: '#ff4444', degraded: '#ff4444',
  starting: '#ffaa00',
  inactive: '#444',
}

export function StatusBadge({ status, label }: { status: string; label?: string }) {
  const color = COLORS[status] ?? '#666'
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0,
        boxShadow: color === '#c8ff00' ? `0 0 6px ${color}` : 'none' }} />
      <span style={{ color, fontFamily: 'JetBrains Mono, monospace', fontSize: 13 }}>
        {label ?? status}
      </span>
    </span>
  )
}