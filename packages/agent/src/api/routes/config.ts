import { Router } from 'express'
import { getConfig, setConfig, type PartialConfig } from '../../config/store.js'
import { validateConfig } from '../../config/validator.js'

export const configRouter = Router()

configRouter.get('/', (_req, res) => {
  const cfg = getConfig()
  res.json({ ...cfg, uiPasswordHash: cfg.uiPasswordHash ? '***' : undefined })
})

configRouter.patch('/', (req, res) => {
  const body = req.body as PartialConfig
  delete (body as Record<string, unknown>)['serverType']
  const errors = validateConfig(body)
  if (errors.length) { res.status(400).json({ errors }); return }
  setConfig(body)
  res.json({ ok: true })
})