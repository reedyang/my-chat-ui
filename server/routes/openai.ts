import { Router, Request, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { getOllamaService, getOllamaServiceWithSettings } from '../services/ollamaService.js'
import { getStorage } from '../storage/index.js'
import { asyncHandler, createError } from '../middleware/errorHandler.js'
import { optionalApiKeyAuth } from '../middleware/auth.js'
import { logger } from '../utils/logger.js'
import { 
  OpenAIChatCompletionRequest,
  OpenAIChatCompletionResponse,
  OpenAIChatCompletionStreamResponse,
  OpenAIModelsResponse,
  OpenAIError
} from '../types/openai.js'
import { Message } from '../types/index.js'

const router = Router()

// Convert OpenAI messages to our internal format
function convertOpenAIMessages(messages: any[]): Message[] {
  return messages.map((msg, index) => ({
    id: uuidv4(),
    sessionId: 'temp', // Temporary session for OpenAI API
    role: msg.role,
    content: msg.content,
    timestamp: new Date(),
  }))
}

// OpenAI compatible chat completions endpoint
router.post('/chat/completions', optionalApiKeyAuth, asyncHandler(async (req: Request, res: Response) => {
  const ollamaService = await getOllamaServiceWithSettings()
  const request: OpenAIChatCompletionRequest = req.body

  // Validate required fields
  if (!request.model) {
    const error: OpenAIError = {
      error: {
        message: 'Model is required',
        type: 'invalid_request_error',
        param: 'model',
        code: 'missing_required_parameter'
      }
    }
    return res.status(400).json(error)
  }

  if (!request.messages || !Array.isArray(request.messages) || request.messages.length === 0) {
    const error: OpenAIError = {
      error: {
        message: 'Messages array is required and must not be empty',
        type: 'invalid_request_error',
        param: 'messages'
      }
    }
    return res.status(400).json(error)
  }

  try {
    // Check if model is available
    const isModelAvailable = await ollamaService.isModelAvailable(request.model)
    if (!isModelAvailable) {
      const error: OpenAIError = {
        error: {
          message: `The model "${request.model}" does not exist`,
          type: 'invalid_request_error',
          param: 'model',
          code: 'model_not_found'
        }
      }
      return res.status(404).json(error)
    }

    // Convert messages to internal format
    const messages = convertOpenAIMessages(request.messages)

    // Handle streaming response
    if (request.stream) {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control',
      })

      const chatId = uuidv4()
      const created = Math.floor(Date.now() / 1000)

      try {
        const stream = await ollamaService.generateStream(
          request.model,
          messages,
          {
            temperature: request.temperature,
            maxTokens: request.max_tokens,
            topP: request.top_p,
          }
        )

        let isFirstChunk = true

        for await (const chunk of stream) {
          const streamResponse: OpenAIChatCompletionStreamResponse = {
            id: chatId,
            object: 'chat.completion.chunk',
            created,
            model: request.model,
            choices: [{
              index: 0,
              delta: isFirstChunk 
                ? { role: 'assistant', content: chunk }
                : { content: chunk },
              finish_reason: null,
            }],
          }

          res.write(`data: ${JSON.stringify(streamResponse)}\n\n`)
          isFirstChunk = false
        }

        // Send final chunk
        const finalResponse: OpenAIChatCompletionStreamResponse = {
          id: chatId,
          object: 'chat.completion.chunk',
          created,
          model: request.model,
          choices: [{
            index: 0,
            delta: {},
            finish_reason: 'stop',
          }],
        }

        res.write(`data: ${JSON.stringify(finalResponse)}\n\n`)
        res.write('data: [DONE]\n\n')
        res.end()

        logger.info(`OpenAI API streaming completion for model: ${request.model}`)

      } catch (error: any) {
        logger.error('OpenAI API streaming error:', error)
        const errorResponse = {
          error: {
            message: error.message || 'Internal server error',
            type: 'server_error'
          }
        }
        res.write(`data: ${JSON.stringify(errorResponse)}\n\n`)
        res.end()
      }

    } else {
      // Non-streaming response
      const response = await ollamaService.generateCompletion(
        request.model,
        messages,
        {
          temperature: request.temperature,
          maxTokens: request.max_tokens,
          topP: request.top_p,
        }
      )

      const completionResponse: OpenAIChatCompletionResponse = {
        id: uuidv4(),
        object: 'chat.completion',
        created: Math.floor(Date.now() / 1000),
        model: request.model,
        choices: [{
          index: 0,
          message: {
            role: 'assistant',
            content: response,
          },
          finish_reason: 'stop',
        }],
        usage: {
          prompt_tokens: ollamaService.estimateTokens(
            request.messages.map(m => m.content).join(' ')
          ),
          completion_tokens: ollamaService.estimateTokens(response),
          total_tokens: ollamaService.estimateTokens(
            request.messages.map(m => m.content).join(' ') + response
          ),
        },
      }

      res.json(completionResponse)
      logger.info(`OpenAI API completion for model: ${request.model}`)
    }

  } catch (error: any) {
    logger.error('OpenAI API error:', error)
    
    const errorResponse: OpenAIError = {
      error: {
        message: error.message || 'Internal server error',
        type: 'server_error',
        code: error.code || 'internal_error'
      }
    }

    res.status(500).json(errorResponse)
  }
}))

// OpenAI compatible models endpoint
router.get('/models', optionalApiKeyAuth, asyncHandler(async (req: Request, res: Response) => {
  const ollamaService = await getOllamaServiceWithSettings()

  try {
    const models = await ollamaService.getModels()
    
    const openaiModels: OpenAIModelsResponse = {
      object: 'list',
      data: models.map(model => ({
        id: model.id,
        object: 'model',
        created: Math.floor(model.modified.getTime() / 1000),
        owned_by: 'ollama',
      })),
    }

    res.json(openaiModels)
    logger.info('OpenAI API models list requested')

  } catch (error: any) {
    logger.error('OpenAI API models error:', error)
    
    const errorResponse: OpenAIError = {
      error: {
        message: 'Failed to fetch models',
        type: 'server_error',
        code: 'service_unavailable'
      }
    }

    res.status(503).json(errorResponse)
  }
}))

// OpenAI compatible model info endpoint
router.get('/models/:modelId', optionalApiKeyAuth, asyncHandler(async (req: Request, res: Response) => {
  const ollamaService = await getOllamaServiceWithSettings()
  const { modelId } = req.params

  try {
    const models = await ollamaService.getModels()
    const model = models.find(m => m.id === modelId)

    if (!model) {
      const error: OpenAIError = {
        error: {
          message: `The model "${modelId}" does not exist`,
          type: 'invalid_request_error',
          param: 'model',
          code: 'model_not_found'
        }
      }
      return res.status(404).json(error)
    }

    const openaiModel = {
      id: model.id,
      object: 'model',
      created: Math.floor(model.modified.getTime() / 1000),
      owned_by: 'ollama',
    }

    res.json(openaiModel)
    logger.info(`OpenAI API model info for: ${modelId}`)

  } catch (error: any) {
    logger.error(`OpenAI API model info error for ${modelId}:`, error)
    
    const errorResponse: OpenAIError = {
      error: {
        message: 'Failed to fetch model information',
        type: 'server_error',
        code: 'service_unavailable'
      }
    }

    res.status(503).json(errorResponse)
  }
}))

export default router 