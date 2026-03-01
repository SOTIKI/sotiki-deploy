import type { PartialConfig } from './store.js'

export interface ValidationError { field: string; message: string }

export function validateConfig(c: PartialConfig): ValidationError[] {
  const errors: ValidationError[] = []
  if (c.serverType && !['storage', 'rating', 'news'].includes(c.serverType))
    errors.push({ field: 'serverType', message: 'Must be storage, rating, or news' })
  if (c.domain !== undefined && !c.domain.trim())
    errors.push({ field: 'domain', message: 'Cannot be empty' })
  if (c.port !== undefined && (c.port < 1 || c.port > 65535))
    errors.push({ field: 'port', message: 'Must be 1–65535' })
  if (c.maxDbSizeGb !== undefined && c.maxDbSizeGb < 1)
    errors.push({ field: 'maxDbSizeGb', message: 'Must be at least 1' })
  if (c.alertWebhookUrl && !isUrl(c.alertWebhookUrl))
    errors.push({ field: 'alertWebhookUrl', message: 'Must be a valid URL' })
  return errors
}

function isUrl(s: string): boolean {
  try { new URL(s); return true } catch { return false }
}