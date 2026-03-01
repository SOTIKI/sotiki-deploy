import Database from 'better-sqlite3'
import fs from 'fs'
import { CONFIG_DB_PATH, CONFIG_DIR, METRICS_RETENTION_MS } from './defaults.js'

export interface DeployConfig {
  serverType:           'storage' | 'rating' | 'news'
  domain:               string
  port:                 number
  uiPort:               number
  uiPasswordHash:       string
  sslEnabled:           boolean
  sslEmail:             string
  isPublic:             boolean
  country:              string
  description:          string
  maxDbSizeGb:          number
  messageRetentionDays: number
  rateLimitGlobal:      number
  rateLimitAuth:        number
  maxMessageSizeKb:     number
  corsOrigins:          string
  alertWebhookUrl:      string
  alertEmail:           string
  useStubImage:         boolean
}

export type PartialConfig = Partial<DeployConfig>

export interface Metric {
  ts:        number
  cpu:       number
  ramUsed:   number
  ramTotal:  number
  netIn:     number
  netOut:    number
  diskUsed:  number
  diskTotal: number
}

export interface Event {
  ts:      number
  level:   'info' | 'warn' | 'error'
  service: string
  message: string
}

let _db: Database.Database | null = null

function db(): Database.Database {
  if (_db) return _db
  fs.mkdirSync(CONFIG_DIR, { recursive: true })
  _db = new Database(CONFIG_DB_PATH)
  _db.pragma('journal_mode = WAL')
  _db.exec(`
    CREATE TABLE IF NOT EXISTS config (key TEXT PRIMARY KEY, value TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS metrics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ts INTEGER NOT NULL, cpu REAL NOT NULL,
      ram_used INTEGER NOT NULL, ram_total INTEGER NOT NULL,
      net_in INTEGER NOT NULL, net_out INTEGER NOT NULL,
      disk_used INTEGER NOT NULL, disk_total INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_metrics_ts ON metrics(ts);
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ts INTEGER NOT NULL, level TEXT NOT NULL,
      service TEXT NOT NULL, message TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_events_ts ON events(ts);
  `)
  return _db
}

export function getConfig(): PartialConfig {
  const rows = db().prepare('SELECT key, value FROM config').all() as { key: string; value: string }[]
  const out: Record<string, unknown> = {}
  for (const r of rows) {
    try { out[r.key] = JSON.parse(r.value) } catch { out[r.key] = r.value }
  }
  return out as PartialConfig
}

export function setConfig(data: PartialConfig): void {
  const stmt = db().prepare('INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)')
  const tx = db().transaction((d: PartialConfig) => {
    for (const [k, v] of Object.entries(d)) {
      if (v !== undefined) stmt.run(k, JSON.stringify(v))
    }
  })
  tx(data)
}

export function isInitialized(): boolean {
  return !!(db().prepare("SELECT value FROM config WHERE key = 'serverType'").get() as { value: string } | undefined)
}

export function saveMetric(m: Omit<Metric, 'ts'>): void {
  db().prepare(
    'INSERT INTO metrics (ts, cpu, ram_used, ram_total, net_in, net_out, disk_used, disk_total) VALUES (?,?,?,?,?,?,?,?)'
  ).run(Date.now(), m.cpu, m.ramUsed, m.ramTotal, m.netIn, m.netOut, m.diskUsed, m.diskTotal)
  db().prepare('DELETE FROM metrics WHERE ts < ?').run(Date.now() - METRICS_RETENTION_MS)
}

export function getMetrics(sinceMs: number): Metric[] {
  return (db().prepare('SELECT * FROM metrics WHERE ts > ? ORDER BY ts ASC').all(sinceMs) as Record<string, number>[])
    .map(r => ({
      ts: r['ts'] as number, cpu: r['cpu'] as number,
      ramUsed: r['ram_used'] as number, ramTotal: r['ram_total'] as number,
      netIn: r['net_in'] as number, netOut: r['net_out'] as number,
      diskUsed: r['disk_used'] as number, diskTotal: r['disk_total'] as number,
    }))
}

export function logEvent(level: Event['level'], service: string, message: string): void {
  db().prepare('INSERT INTO events (ts, level, service, message) VALUES (?,?,?,?)').run(Date.now(), level, service, message)
}

export function getRecentEvents(limit = 20): Event[] {
  return db().prepare('SELECT ts, level, service, message FROM events ORDER BY ts DESC LIMIT ?')
    .all(limit) as Event[]
}