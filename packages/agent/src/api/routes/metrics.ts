import { Router } from 'express'
import { collectOnce, getHistory } from '../../metrics/collector.js'

export const metricsRouter = Router()

metricsRouter.get('/current', async (_req, res) => {
  try { res.json(await collectOnce()) }
  catch (err) { res.status(500).json({ error: String(err) }) }
})

metricsRouter.get('/history', (req, res) => {
  const hours = Math.min(168, Math.max(1, parseInt(String(req.query['hours'] ?? '1'), 10)))
  res.json(getHistory(hours))
})