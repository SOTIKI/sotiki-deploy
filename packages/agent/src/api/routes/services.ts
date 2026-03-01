import { Router } from 'express'
import { startService, stopService, getStatus, type ServiceName } from '../../docker/manager.js'

export const servicesRouter = Router()

const VALID: ServiceName[] = ['storage', 'rating', 'news', 'postgresql', 'nginx']
const valid = (s: string): s is ServiceName => VALID.includes(s as ServiceName)

servicesRouter.post('/:svc/start', async (req, res) => {
  const { svc } = req.params
  if (!svc || !valid(svc)) { res.status(400).json({ error: 'Invalid service' }); return }
  try { await startService(svc); res.json({ ok: true, status: await getStatus(svc) }) }
  catch (err) { res.status(500).json({ error: String(err) }) }
})

servicesRouter.post('/:svc/stop', async (req, res) => {
  const { svc } = req.params
  if (!svc || !valid(svc)) { res.status(400).json({ error: 'Invalid service' }); return }
  try { await stopService(svc); res.json({ ok: true, status: await getStatus(svc) }) }
  catch (err) { res.status(500).json({ error: String(err) }) }
})

servicesRouter.post('/:svc/restart', async (req, res) => {
  const { svc } = req.params
  if (!svc || !valid(svc)) { res.status(400).json({ error: 'Invalid service' }); return }
  try {
    await stopService(svc)
    await startService(svc)
    res.json({ ok: true, status: await getStatus(svc) })
  } catch (err) { res.status(500).json({ error: String(err) }) }
})