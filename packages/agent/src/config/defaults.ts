import path from 'path'
import { getConfigDir } from '../platform/index.js'

export const VERSION = '1.0.0'

export const CONFIG_DIR     = getConfigDir()
export const CONFIG_DB_PATH = path.join(CONFIG_DIR, 'config.db')

export const WEB_UI_HOST = '127.0.0.1'
export const WEB_UI_PORT = 8080

export const JWT_TTL_SECONDS           = 86400
export const LOGIN_RATE_LIMIT_MAX      = 5
export const LOGIN_RATE_LIMIT_WINDOW   = 15 * 60 * 1000
export const METRICS_INTERVAL_MS       = 5_000
export const METRICS_RETENTION_MS      = 30 * 24 * 60 * 60 * 1000

export const STUB_IMAGE = 'nginx:alpine'

export const SERVICE_IMAGES: Record<string, string> = {
  storage: process.env['SOTIKI_STORAGE_IMAGE'] ?? 'sotiki/storage:latest',
  rating:  process.env['SOTIKI_RATING_IMAGE']  ?? 'sotiki/rating:latest',
  news:    process.env['SOTIKI_NEWS_IMAGE']    ?? 'sotiki/news:latest',
}