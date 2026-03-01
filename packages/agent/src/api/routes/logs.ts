import { Router } from 'express'
import { streamLogs, type ServiceName } from '../../docker/manager.js'

export const logsRouter = Router()

logsRouter.get('/:svc', async (req, res) => {
  const svc  = req.params['svc'] as ServiceName
  const tail = parseInt(String(req.query['lines'] ?? '100'), 10)
  const lines: string[] = []
  let stop: (() => void) | null = null
  try {
    stop = await streamLogs(svc, c => lines.push(c), tail)
    await new Promise(r => setTimeout(r, 500))
    stop()
    res.json({ lines })
  } catch (err) {
    stop?.()
    res.status(500).json({ error: String(err) })
  }
})