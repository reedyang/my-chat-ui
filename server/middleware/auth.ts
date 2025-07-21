import { Request, Response, NextFunction } from 'express'
import { getStorage } from '../storage/index.js'
import { extractBearerToken, isValidApiKeyFormat } from '../utils/apiKey.js'
import { logger } from '../utils/logger.js'

// Extend Request interface to include apiKey
declare global {
  namespace Express {
    interface Request {
      apiKey?: string
    }
  }
}

/**
 * API Key authentication middleware for OpenAI compatible endpoints
 */
export async function authenticateApiKey(req: Request, res: Response, next: NextFunction) {
  try {
    const authorization = req.headers.authorization
    const token = extractBearerToken(authorization)

    if (!token) {
      return res.status(401).json({
        error: {
          message: 'Missing API key. Please provide your API key in the Authorization header: Bearer YOUR_API_KEY',
          type: 'authentication_error',
          code: 'missing_api_key'
        }
      })
    }

    if (!isValidApiKeyFormat(token)) {
      return res.status(401).json({
        error: {
          message: 'Invalid API key format',
          type: 'authentication_error', 
          code: 'invalid_api_key'
        }
      })
    }

    // Get settings from storage to verify API key
    const storage = getStorage()
    const settings = await storage.getSettings()

    if (!settings.apiKey) {
      return res.status(401).json({
        error: {
          message: 'No API key configured. Please generate an API key in the settings.',
          type: 'authentication_error',
          code: 'no_api_key_configured'
        }
      })
    }

    if (token !== settings.apiKey) {
      logger.warn(`Invalid API key attempt: ${token.substring(0, 8)}...`)
      return res.status(401).json({
        error: {
          message: 'Invalid API key',
          type: 'authentication_error',
          code: 'invalid_api_key'
        }
      })
    }

    // API key is valid, attach to request and continue
    req.apiKey = token
    logger.info(`API key authenticated successfully`)
    next()

  } catch (error) {
    logger.error('API key authentication error:', error)
    return res.status(500).json({
      error: {
        message: 'Internal server error during authentication',
        type: 'server_error',
        code: 'auth_error'
      }
    })
  }
}

/**
 * Optional API Key authentication (allows requests without API key for development)
 */
export async function optionalApiKeyAuth(req: Request, res: Response, next: NextFunction) {
  const authorization = req.headers.authorization
  
  if (!authorization) {
    // No auth header provided, continue without authentication
    next()
    return
  }

  // Auth header provided, validate it
  await authenticateApiKey(req, res, next)
} 