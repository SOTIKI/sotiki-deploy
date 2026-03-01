import si from 'systeminformation'
import { saveMetric, getMetrics, type Metric } from '../config/store.js'
import { METRICS_INTERVAL_MS } from '../config/defaults.js'

let _interval: ReturnType<typeof setInterval> | null = null
let _lastNet: { rx: number; tx: number; ts: number } | null = null

export async function collectOnce(): Promise<Metric> {
  const [load, mem, disk, net] = await Promise.all([
    si.currentLoad(), si.mem(), si.fsSize(), si.networkStats(),
  ])
  const now = Date.now()
  const n   = net[0]
  let netIn = 0, netOut = 0
  if (_lastNet && n) {
    const dt = (now - _lastNet.ts) / 1000
    netIn  = Math.max(0, (n.rx_bytes - _lastNet.rx) / dt)
    netOut = Math.max(0, (n.tx_bytes - _lastNet.tx) / dt)
  }
  if (n) _lastNet = { rx: n.rx_bytes, tx: n.tx_bytes, ts: now }
  return {
    ts:        now,
    cpu:       Math.round(load.currentLoad * 10) / 10,
    ramUsed:   mem.used,
    ramTotal:  mem.total,
    netIn:     Math.round(netIn),
    netOut:    Math.round(netOut),
    diskUsed:  disk[0]?.used  ?? 0,
    diskTotal: disk[0]?.size  ?? 0,
  }
}

export function startCollector(onMetric?: (m: Metric) => void): void {
  if (_interval) return
  _interval = setInterval(async () => {
    try {
      const m = await collectOnce()
      saveMetric(m)
      onMetric?.(m)
    } catch {}
  }, METRICS_INTERVAL_MS)
}

export function stopCollector(): void {
  if (_interval) { clearInterval(_interval); _interval = null }
}

export function getHistory(hours: number): Metric[] {
  return getMetrics(Date.now() - hours * 3_600_000)
}