import express from 'express'
import { createServer } from 'http'
import path from 'path'
import { fileURLToPath } from 'url'
import { attachWS } from './metrics/ws.js'
import { authRouter, requireAuth } from './api/routes/auth.js'
import { statusRouter }   from './api/routes/status.js'
import { servicesRouter } from './api/routes/services.js'
import { metricsRouter }  from './api/routes/metrics.js'
import { logsRouter }     from './api/routes/logs.js'
import { configRouter }   from './api/routes/config.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export function createApiServer() {
  const app = express()
  app.use(express.json())
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.setHeader('X-Frame-Options', 'DENY')
    next()
  })

  app.use('/api/auth',     authRouter)
  app.use('/api/status',   requireAuth, statusRouter)
  app.use('/api/services', requireAuth, servicesRouter)
  app.use('/api/metrics',  requireAuth, metricsRouter)
  app.use('/api/logs',     requireAuth, logsRouter)
  app.use('/api/config',   requireAuth, configRouter)

  const uiDist = path.join(__dirname, '..', 'ui-dist')
  app.use(express.static(uiDist))
  app.get('*', (_req, res) => res.sendFile(path.join(uiDist, 'index.html')))

  const server = createServer(app)
  attachWS(server)
  return server
}

export function startServer(port: number, host: string): Promise<void> {
  return new Promise(resolve => {
    createApiServer().listen(port, host, () => resolve())
  })
}