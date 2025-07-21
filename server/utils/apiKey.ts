import { randomBytes } from 'crypto'

/**
 * Generate a secure API key
 * Format: my-chat-ui_sk-{32-char-hex}
 */
export function generateApiKey(): string {
  const randomPart = randomBytes(16).toString('hex')
  return `my-chat-ui_sk-${randomPart}`
}

/**
 * Validate API key format
 */
export function isValidApiKeyFormat(apiKey: string): boolean {
  return /^my-chat-ui_sk-[a-f0-9]{32}$/.test(apiKey)
}

/**
 * Extract bearer token from Authorization header
 */
export function extractBearerToken(authorization?: string): string | null {
  if (!authorization) return null
  
  const match = authorization.match(/^Bearer\s+(.+)$/i)
  return match ? match[1] : null
}

/**
 * Mask API key for display (show only first 8 and last 4 characters)
 */
export function maskApiKey(apiKey: string): string {
  if (apiKey.length < 12) return '***'
  
  const start = apiKey.substring(0, 8)
  const end = apiKey.substring(apiKey.length - 4)
  const middle = '*'.repeat(Math.max(0, apiKey.length - 12))
  
  return `${start}${middle}${end}`
} 