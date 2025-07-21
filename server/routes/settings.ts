import { Router, Request, Response } from 'express'
import { logger } from '../utils/logger.js'
import { getStorage } from '../storage/index.js'
import { AppSettings } from '../types/index.js'
import { generateApiKey, maskApiKey } from '../utils/apiKey.js'

const router = Router()

interface UpdateSettingsRequest {
  defaultModel?: string
  temperature?: number
  maxTokens?: number
  ollamaEndpoint?: string
  theme?: 'light' | 'dark' | 'auto'
  apiKey?: string
  apiKeyCreatedAt?: string
}

// Async handler wrapper
const asyncHandler = (fn: (req: Request, res: Response, next: any) => Promise<any>) => 
  (req: Request, res: Response, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }

// Get settings
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  try {
    const storage = getStorage()
    const settings = await storage.getSettings()
    
    res.json({
      success: true,
      data: settings,
    })
  } catch (error: any) {
    logger.error('Failed to get settings:', error)
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get settings',
        code: 'SETTINGS_GET_ERROR',
        details: error.message,
      },
    })
  }
}))

// Update settings
router.patch('/', asyncHandler(async (req: Request, res: Response) => {
  try {
    const storage = getStorage()
    const updates: UpdateSettingsRequest = req.body
    
    // Validate updates
    if (updates.temperature !== undefined) {
      if (typeof updates.temperature !== 'number' || updates.temperature < 0 || updates.temperature > 1) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Temperature must be a number between 0 and 1',
            code: 'INVALID_TEMPERATURE',
          },
        })
      }
    }
    
    if (updates.maxTokens !== undefined) {
      if (typeof updates.maxTokens !== 'number' || updates.maxTokens < 1 || updates.maxTokens > 8192) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Max tokens must be a number between 1 and 8192',
            code: 'INVALID_MAX_TOKENS',
          },
        })
      }
    }
    
    if (updates.theme !== undefined) {
      if (!['light', 'dark', 'auto'].includes(updates.theme)) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Theme must be one of: light, dark, auto',
            code: 'INVALID_THEME',
          },
        })
      }
    }
    
    if (updates.ollamaEndpoint !== undefined) {
      if (typeof updates.ollamaEndpoint !== 'string' || !updates.ollamaEndpoint.trim()) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Ollama endpoint must be a valid URL string',
            code: 'INVALID_ENDPOINT',
          },
        })
      }
    }
    
    // Update settings
    const updatedSettings = await storage.updateSettings(updates)
    
    logger.info('Settings updated:', updates)
    
    res.json({
      success: true,
      data: updatedSettings,
    })
  } catch (error: any) {
    logger.error('Failed to update settings:', error)
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to update settings',
        code: 'SETTINGS_UPDATE_ERROR',
        details: error.message,
      },
    })
  }
}))

// Generate new API key
router.post('/api-key/generate', asyncHandler(async (req: Request, res: Response) => {
  try {
    const storage = getStorage()
    const newApiKey = generateApiKey()
    const createdAt = new Date().toISOString()
    
    // Update settings with new API key
    const updatedSettings = await storage.updateSettings({
      apiKey: newApiKey,
      apiKeyCreatedAt: createdAt
    })
    
    logger.info('New API key generated')
    
    res.json({
      success: true,
      data: {
        apiKey: newApiKey,
        maskedApiKey: maskApiKey(newApiKey),
        createdAt: createdAt,
        settings: {
          ...updatedSettings,
          apiKey: maskApiKey(updatedSettings.apiKey || '')
        }
      },
    })
  } catch (error: any) {
    logger.error('Failed to generate API key:', error)
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to generate API key',
        code: 'API_KEY_GENERATE_ERROR',
        details: error.message,
      },
    })
  }
}))

// Refresh (regenerate) API key
router.post('/api-key/refresh', asyncHandler(async (req: Request, res: Response) => {
  try {
    const storage = getStorage()
    const currentSettings = await storage.getSettings()
    
    if (!currentSettings.apiKey) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'No existing API key to refresh',
          code: 'NO_API_KEY',
        },
      })
    }
    
    const newApiKey = generateApiKey()
    const createdAt = new Date().toISOString()
    
    // Update settings with new API key
    const updatedSettings = await storage.updateSettings({
      apiKey: newApiKey,
      apiKeyCreatedAt: createdAt
    })
    
    logger.info('API key refreshed')
    
    res.json({
      success: true,
      data: {
        apiKey: newApiKey,
        maskedApiKey: maskApiKey(newApiKey),
        createdAt: createdAt,
        settings: {
          ...updatedSettings,
          apiKey: maskApiKey(updatedSettings.apiKey || '')
        }
      },
    })
  } catch (error: any) {
    logger.error('Failed to refresh API key:', error)
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to refresh API key',
        code: 'API_KEY_REFRESH_ERROR',
        details: error.message,
      },
    })
  }
}))

// Revoke API key
router.delete('/api-key', asyncHandler(async (req: Request, res: Response) => {
  try {
    const storage = getStorage()
    
    // Remove API key from settings
    const updatedSettings = await storage.updateSettings({
      apiKey: undefined,
      apiKeyCreatedAt: undefined
    })
    
    logger.info('API key revoked')
    
    res.json({
      success: true,
      data: {
        message: 'API key revoked successfully',
        settings: updatedSettings
      },
    })
  } catch (error: any) {
    logger.error('Failed to revoke API key:', error)
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to revoke API key',
        code: 'API_KEY_REVOKE_ERROR',
        details: error.message,
      },
    })
  }
}))

export default router 