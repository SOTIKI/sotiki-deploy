const BASE = '/api'
let _token: string | null = localStorage.getItem('sotiki_token')

export function setToken(t: string)  { _token = t; localStorage.setItem('sotiki_token', t) }
export function clearToken()          { _token = null; localStorage.removeItem('sotiki_token') }
export function hasToken(): boolean   { return !!_token }

async function req<T>(path: string, opts?: RequestInit): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(opts?.headers as Record<string, string>) }
  if (_token) headers['Authorization'] = `Bearer ${_token}`
  const res = await fetch(`${BASE}${path}`, { ...opts, headers })
  if (res.status === 401) { clearToken(); window.location.reload(); throw new Error('Unauthorized') }
  if (!res.ok) { const b = await res.json().catch(() => ({ error: res.statusText })); throw new Error((b as { error?: string }).error) }
  return res.json() as Promise<T>
}

export interface ServiceStatus {
  name: string
  status: 'running' | 'stopped' | 'error' | 'starting' | 'inactive'
  uptime: string
  port: number | null
  containerId: string | null
}

export interface StatusResponse {
  version: string
  overall: 'healthy' | 'degraded'
  initialized: boolean
  serverType: string
  domain: string
  services: ServiceStatus[]
  recentEvents: { ts: number; level: string; service: string; message: string }[]
}

export interface Metric {
  ts: number; cpu: number
  ramUsed: number; ramTotal: number
  netIn: number; netOut: number
  diskUsed: number; diskTotal: number
}

export const api = {
  login:   (password: string) => req<{ token: string; expiresIn: number }>('/auth/login', { method: 'POST', body: JSON.stringify({ password }) }),
  status:  ()                 => req<StatusResponse>('/status'),
  services: {
    start:   (s: string) => req<{ ok: boolean }>(`/services/${s}/start`,   { method: 'POST' }),
    stop:    (s: string) => req<{ ok: boolean }>(`/services/${s}/stop`,    { method: 'POST' }),
    restart: (s: string) => req<{ ok: boolean }>(`/services/${s}/restart`, { method: 'POST' }),
  },
  metrics: {
    current: ()             => req<Metric>('/metrics/current'),
    history: (h: number)    => req<Metric[]>(`/metrics/history?hours=${h}`),
  },
  config: {
    get:   ()                               => req<Record<string, unknown>>('/config'),
    patch: (d: Record<string, unknown>)     => req<{ ok: boolean }>('/config', { method: 'PATCH', body: JSON.stringify(d) }),
  },
}