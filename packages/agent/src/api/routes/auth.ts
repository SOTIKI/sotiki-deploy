import { Router, type Request, type Response, type NextFunction } from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { getConfig } from '../../config/store.js'
import { JWT_TTL_SECONDS, LOGIN_RATE_LIMIT_MAX, LOGIN_RATE_LIMIT_WINDOW } from '../../config/defaults.js'

export const authRouter = Router()

const SECRET = process.env['SOTIKI_JWT_SECRET'] ?? crypto.randomUUID()
const attempts = new Map<string, { count: number; resetAt: number }>()

function rateLimit(ip: string): boolean {
  const now = Date.now()
  const rec = attempts.get(ip)
  if (!rec || rec.resetAt < now) { attempts.set(ip, { count: 1, resetAt: now + LOGIN_RATE_LIMIT_WINDOW }); return true }
  if (rec.count >= LOGIN_RATE_LIMIT_MAX) return false
  rec.count++
  return true
}

authRouter.post('/login', async (req: Request, res: Response) => {
  if (!rateLimit(req.ip ?? 'x')) { res.status(429).json({ error: 'Too many attempts' }); return }
  const { password } = req.body as { password?: string }
  if (!password) { res.status(400).json({ error: 'Password required' }); return }
  const cfg = getConfig()
  if (!cfg.uiPasswordHash) { res.status(503).json({ error: 'Not initialized' }); return }
  if (!await bcrypt.compare(password, cfg.uiPasswordHash)) { res.status(401).json({ error: 'Invalid password' }); return }
  const token = jwt.sign({ sub: 'admin' }, SECRET, { expiresIn: JWT_TTL_SECONDS })
  res.json({ token, expiresIn: JWT_TTL_SECONDS })
})

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const h = req.headers['authorization']
  if (!h?.startsWith('Bearer ')) { res.status(401).json({ error: 'Unauthorized' }); return }
  try { jwt.verify(h.slice(7), SECRET); next() }
  catch { res.status(401).json({ error: 'Invalid or expired token' }) }
}