import { useState, useEffect } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { api } from '../api/client.js'

const I: React.CSSProperties = {
  background: '#0f0f0f', border: '1px solid #1e1e1e', color: '#e8e8e8',
  padding: '8px 12px', borderRadius: 4, fontFamily: 'JetBrains Mono, monospace',
  fontSize: 13, width: '100%', outline: 'none', boxSizing: 'border-box',
}
const L: React.CSSProperties = {
  color: '#666', fontFamily: 'JetBrains Mono, monospace', fontSize: 11,
  textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6, display: 'block',
}
const S: React.CSSProperties = {
  color: '#c8ff00', fontFamily: 'JetBrains Mono, monospace', fontSize: 11,
  textTransform: 'uppercase', letterSpacing: 2, marginBottom: 16,
  paddingBottom: 8, borderBottom: '1px solid #1e1e1e',
}

function Field({ label, value, onChange, type = 'text', ro }: {
  label: string; value: string | number; onChange: (v: string) => void; type?: string; ro?: boolean
}) {
  return (
    <div>
      <label style={L}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} readOnly={ro}
        style={{ ...I, opacity: ro ? 0.5 : 1, cursor: ro ? 'not-allowed' : 'text' }} />
    </div>
  )
}

export function Config() {
  const { data, refetch }         = useQuery({ queryKey: ['config'], queryFn: api.config.get })
  const [draft, setDraft]         = useState<Record<string, string>>({})
  const [saved, setSaved]         = useState(false)

  useEffect(() => {
    if (data) setDraft(Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v ?? '')])))
  }, [data])

  const mut = useMutation({
    mutationFn: () => api.config.patch(draft),
    onSuccess:  () => { setSaved(true); setTimeout(() => setSaved(false), 2000); refetch() },
  })

  const set = (k: string) => (v: string) => setDraft(d => ({ ...d, [k]: v }))

  if (!data) return <div style={{ color: '#444', fontFamily: 'JetBrains Mono, monospace' }}>Loading...</div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32, maxWidth: 640 }}>
      <section>
        <div style={S}>Core</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Field label="Server Type" value={draft['serverType'] ?? ''} onChange={set('serverType')} ro />
          <Field label="Domain"      value={draft['domain'] ?? ''}     onChange={set('domain')} />
          <Field label="Port"        value={draft['port'] ?? ''}       onChange={set('port')} type="number" />
        </div>
      </section>

      {draft['serverType'] === 'storage' && (
        <section>
          <div style={S}>Database</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Field label="Max DB Size (GB)"           value={draft['maxDbSizeGb'] ?? ''}          onChange={set('maxDbSizeGb')} type="number" />
            <Field label="Message Retention (days)"   value={draft['messageRetentionDays'] ?? '0'} onChange={set('messageRetentionDays')} type="number" />
          </div>
        </section>
      )}

      <section>
        <div style={S}>Security</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Field label="Rate Limit Global (req/min)" value={draft['rateLimitGlobal'] ?? '600'}  onChange={set('rateLimitGlobal')} type="number" />
          <Field label="Rate Limit Auth (req/min)"   value={draft['rateLimitAuth'] ?? '20'}     onChange={set('rateLimitAuth')} type="number" />
          <Field label="Max Message Size (KB)"       value={draft['maxMessageSizeKb'] ?? '64'}  onChange={set('maxMessageSizeKb')} type="number" />
          <Field label="CORS Origins"                value={draft['corsOrigins'] ?? '*'}         onChange={set('corsOrigins')} />
        </div>
      </section>

      <section>
        <div style={S}>Alerts</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Field label="Webhook URL"   value={draft['alertWebhookUrl'] ?? ''} onChange={set('alertWebhookUrl')} />
          <Field label="Alert Email"   value={draft['alertEmail'] ?? ''}      onChange={set('alertEmail')} type="email" />
        </div>
      </section>

      <div>
        <button onClick={() => mut.mutate()} disabled={mut.isPending} style={{
          background: saved ? '#1a2a00' : '#0a1a00',
          border: `1px solid ${saved ? '#c8ff00' : '#2a3a00'}`,
          color: saved ? '#c8ff00' : '#8ab800',
          padding: '10px 32px', cursor: 'pointer',
          fontFamily: 'JetBrains Mono, monospace', fontSize: 13, borderRadius: 4,
        }}>
          {mut.isPending ? 'Saving...' : saved ? '✓ Saved' : 'Apply & Restart'}
        </button>
        {mut.isError && <div style={{ color: '#ff4444', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, marginTop: 8 }}>{mut.error?.message}</div>}
      </div>
    </div>
  )
}