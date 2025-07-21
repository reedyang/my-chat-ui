import { Router, Request, Response } from 'express'
import { getOllamaService, getOllamaServiceWithSettings } from '../services/ollamaService.js'
import { asyncHandler, createError } from '../middleware/errorHandler.js'
import { logger } from '../utils/logger.js'

const router = Router()

// Get all available models
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const ollamaService = await getOllamaServiceWithSettings()
  
  try {
    const models = await ollamaService.getModels()
    
    res.json({
      success: true,
      data: {
        models,
        total: models.length,
        service: ollamaService.getServiceInfo(),
      },
    })
  } catch (error: any) {
    logger.error('Failed to fetch models:', error)
    throw createError(
      'Failed to fetch models from Ollama service',
      503,
      'SERVICE_UNAVAILABLE',
      { originalError: error.message }
    )
  }
}))

// Check service status
router.get('/status', asyncHandler(async (req: Request, res: Response) => {
  const ollamaService = await getOllamaServiceWithSettings()
  
  try {
    const isHealthy = await ollamaService.checkHealth()
    const serviceInfo = ollamaService.getServiceInfo()
    
    if (isHealthy) {
      // Get model count if service is healthy
      const models = await ollamaService.getModels()
      
      res.json({
        success: true,
        data: {
          status: 'healthy',
          service: serviceInfo,
          modelCount: models.length,
          timestamp: new Date().toISOString(),
        },
      })
    } else {
      res.status(503).json({
        success: false,
        data: {
          status: 'unhealthy',
          service: serviceInfo,
          timestamp: new Date().toISOString(),
        },
        error: {
          message: 'Ollama service is not responding',
          code: 'SERVICE_UNAVAILABLE',
        },
      })
    }
  } catch (error: any) {
    logger.error('Health check failed:', error)
    res.status(503).json({
      success: false,
      data: {
        status: 'error',
        service: ollamaService.getServiceInfo(),
        timestamp: new Date().toISOString(),
      },
      error: {
        message: 'Failed to check service status',
        code: 'HEALTH_CHECK_FAILED',
        details: error.message,
      },
    })
  }
}))

// Check if a specific model is available
router.get('/:modelName/availability', asyncHandler(async (req: Request, res: Response) => {
  const ollamaService = await getOllamaServiceWithSettings()
  const { modelName } = req.params
  
  try {
    const isAvailable = await ollamaService.isModelAvailable(modelName)
    
    res.json({
      success: true,
      data: {
        model: modelName,
        available: isAvailable,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error: any) {
    logger.error(`Failed to check model availability for ${modelName}:`, error)
    throw createError(
      `Failed to check availability for model "${modelName}"`,
      503,
      'SERVICE_UNAVAILABLE',
      { model: modelName, originalError: error.message }
    )
  }
}))

// Get model information
router.get('/:modelName', asyncHandler(async (req: Request, res: Response) => {
  const ollamaService = await getOllamaServiceWithSettings()
  const { modelName } = req.params
  
  try {
    const models = await ollamaService.getModels()
    const model = models.find(m => m.id === modelName)
    
    if (!model) {
      throw createError(
        `Model "${modelName}" not found`,
        404,
        'MODEL_NOT_FOUND',
        { model: modelName }
      )
    }
    
    res.json({
      success: true,
      data: model,
    })
  } catch (error: any) {
    if (error.status === 404) {
      throw error // Re-throw 404 errors
    }
    
    logger.error(`Failed to get model info for ${modelName}:`, error)
    throw createError(
      `Failed to get information for model "${modelName}"`,
      503,
      'SERVICE_UNAVAILABLE',
      { model: modelName, originalError: error.message }
    )
  }
}))

export default router 