import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import type { Metric } from '../api/client.js'

interface Props {
  data: Metric[]
  title: string
  key: keyof Metric
  fmt?: (v: number) => string
  color?: string
}

export function MetricChart({ data, title, key: k, fmt = v => String(Math.round(v)), color = '#c8ff00' }: Props) {
  const chart = data.map(m => ({
    t: new Date(m.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    v: m[k] as number,
  }))
  const latest = chart.at(-1)?.v

  return (
    <div style={{ background: '#0f0f0f', border: '1px solid #1e1e1e', borderRadius: 8, padding: '16px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ color: '#666', fontFamily: 'JetBrains Mono, monospace', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>{title}</span>
        {latest != null && <span style={{ color, fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, fontSize: 16 }}>{fmt(latest)}</span>}
      </div>
      <ResponsiveContainer width="100%" height={80}>
        <AreaChart data={chart} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={`g-${title}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={color} stopOpacity={0.2} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="t" hide />
          <YAxis hide />
          <Tooltip contentStyle={{ background: '#0a0a0a', border: '1px solid #1e1e1e', borderRadius: 4,
            fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}
            itemStyle={{ color }} formatter={(v: number) => [fmt(v), title]} />
          <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5}
            fill={`url(#g-${title})`} dot={false} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}