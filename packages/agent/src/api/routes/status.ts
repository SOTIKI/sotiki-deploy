import { Router } from 'express'
import { getAllStatuses } from '../../docker/manager.js'
import { getRecentEvents, getConfig } from '../../config/store.js'
import { VERSION } from '../../config/defaults.js'

export const statusRouter = Router()

statusRouter.get('/', async (_req, res) => {
  try {
    const [services, events, cfg] = await Promise.all([
      getAllStatuses(),
      Promise.resolve(getRecentEvents()),
      Promise.resolve(getConfig()),
    ])
    res.json({
      version:     VERSION,
      overall:     services.every(s => s.status === 'running') ? 'healthy' : 'degraded',
      initialized: !!cfg.serverType,
      serverType:  cfg.serverType,
      domain:      cfg.domain,
      services,
      recentEvents: events,
    })
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})