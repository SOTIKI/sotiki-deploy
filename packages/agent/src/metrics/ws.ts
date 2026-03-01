import { WebSocketServer, WebSocket } from 'ws'
import type { Server } from 'http'
import { startCollector, stopCollector } from './collector.js'
import type { Metric } from '../config/store.js'

let _wss: WebSocketServer | null = null

export function attachWS(server: Server): void {
  _wss = new WebSocketServer({ server, path: '/ws/metrics' })
  _wss.on('connection', (ws) => {
    ws.send(JSON.stringify({ type: 'connected' }))
    ws.on('error', () => undefined)
  })
  startCollector((m: Metric) => broadcast({ type: 'metric', data: m }))

  const logsWss = new WebSocketServer({ server, path: '/ws/logs' })
  logsWss.on('connection', (ws, req) => {
    const svc = new URL(req.url ?? '/', 'http://x').searchParams.get('service') ?? 'storage'
    ws.send(JSON.stringify({ type: 'connected', service: svc }))
    ws.on('error', () => undefined)
  })
}

export function broadcast(data: unknown): void {
  if (!_wss) return
  const msg = JSON.stringify(data)
  for (const c of _wss.clients) {
    if (c.readyState === WebSocket.OPEN) c.send(msg)
  }
}

export function shutdownWS(): void {
  stopCollector()
  _wss?.close()
  _wss = null
}