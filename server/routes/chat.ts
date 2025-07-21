import { Router, Request, Response } from 'express'
import { getStorage } from '../storage/index.js'
import { getOllamaService, getOllamaServiceWithSettings } from '../services/ollamaService.js'
import { asyncHandler, createError } from '../middleware/errorHandler.js'
import { logger } from '../utils/logger.js'
import { generateTitleWithAI, generateTitleFromMessage } from '../utils/titleGenerator.js'
import { SendMessageRequest } from '../types/index.js'

const router = Router()

// Helper function to auto-generate title for new sessions
async function autoGenerateTitle(sessionId: string, userContent: string): Promise<void> {
  try {
    const storage = getStorage()
    const ollamaService = await getOllamaServiceWithSettings()
    const messages = await storage.getMessages(sessionId)
    
    // Check if this is the first user message (excluding system messages)
    const userMessages = messages.filter(msg => msg.role === 'user')
    
    logger.info(`Title generation check for session ${sessionId}: ${userMessages.length} user messages`)
    
    if (userMessages.length === 1) {
      // Get the session to know which model to use
      const session = await storage.getSession(sessionId)
      if (!session) {
        logger.warn(`Session ${sessionId} not found for title generation`)
        return
      }
      
      logger.info(`Generating title for session ${sessionId} using model ${session.model}`)
      
      // Use AI to generate a smart title
      const newTitle = await generateTitleWithAI(userContent, session.model, ollamaService)
      await storage.updateSession(sessionId, { title: newTitle })
      logger.info(`Auto-generated AI title for session ${sessionId}: "${newTitle}"`)
    } else {
      logger.info(`Skipping title generation for session ${sessionId}: not first user message`)
    }
  } catch (error) {
    // Don't fail the request if title generation fails
    logger.warn(`Failed to auto-generate title for session ${sessionId}:`, error)
  }
}

// Send message to a session (non-streaming)
router.post('/:sessionId/messages', asyncHandler(async (req: Request, res: Response) => {
  const storage = getStorage()
  const ollamaService = await getOllamaServiceWithSettings()
  const { sessionId } = req.params
  const { content, role = 'user' }: SendMessageRequest = req.body

  if (!content?.trim()) {
    throw createError('Message content is required', 400, 'INVALID_REQUEST')
  }

  // Check if session exists
  const session = await storage.getSession(sessionId)
  if (!session) {
    throw createError(`Session ${sessionId} not found`, 404, 'SESSION_NOT_FOUND')
  }

  // Check if model is available
  const isModelAvailable = await ollamaService.isModelAvailable(session.model)
  if (!isModelAvailable) {
    throw createError(
      `Model "${session.model}" is not available. Please ensure it's downloaded.`,
      400,
      'MODEL_NOT_AVAILABLE'
    )
  }

  // Add user message to storage
  const userMessage = await storage.addMessage({
    sessionId,
    role,
    content: content.trim(),
  })

  // Auto-generate title if this is the first user message
  await autoGenerateTitle(sessionId, content.trim())

  // Get conversation history
  const messages = await storage.getMessages(sessionId)

  try {
    // Get settings for AI options
    const settings = await storage.getSettings()
    
    // Generate AI response
    const aiResponse = await ollamaService.generateCompletion(
      session.model,
      messages,
      {
        temperature: settings.temperature,
        maxTokens: settings.maxTokens,
      }
    )

    // Add AI response to storage
    const aiMessage = await storage.addMessage({
      sessionId,
      role: 'assistant',
      content: aiResponse,
      tokens: ollamaService.estimateTokens(aiResponse),
    })

    logger.info(`Generated response for session ${sessionId}`)

    res.json({
      success: true,
      data: {
        userMessage,
        aiMessage,
        sessionId,
      },
    })

  } catch (error: any) {
    logger.error(`Failed to generate response for session ${sessionId}:`, error)
    throw createError(
      `Failed to generate AI response: ${error.message}`,
      500,
      'AI_GENERATION_FAILED'
    )
  }
}))

// Send message with streaming response
router.post('/:sessionId/stream', asyncHandler(async (req: Request, res: Response) => {
  const storage = getStorage()
  const ollamaService = await getOllamaServiceWithSettings()
  const { sessionId } = req.params
  const { content, role = 'user' }: SendMessageRequest = req.body

  if (!content?.trim()) {
    throw createError('Message content is required', 400, 'INVALID_REQUEST')
  }

  // Check if session exists
  const session = await storage.getSession(sessionId)
  if (!session) {
    throw createError(`Session ${sessionId} not found`, 404, 'SESSION_NOT_FOUND')
  }

  // Check if model is available
  const isModelAvailable = await ollamaService.isModelAvailable(session.model)
  if (!isModelAvailable) {
    throw createError(
      `Model "${session.model}" is not available. Please ensure it's downloaded.`,
      400,
      'MODEL_NOT_AVAILABLE'
    )
  }

  // Add user message to storage
  await storage.addMessage({
    sessionId,
    role,
    content: content.trim(),
  })

  // Auto-generate title if this is the first user message
  await autoGenerateTitle(sessionId, content.trim())

  // Get conversation history
  const messages = await storage.getMessages(sessionId)

  try {
    // Setup streaming response with correct headers
    res.writeHead(200, {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    })

    // Get settings for AI options
    const settings = await storage.getSettings()
    
    // Generate AI response stream
    const stream = await ollamaService.generateStream(
      session.model,
      messages,
      {
        temperature: settings.temperature,
        maxTokens: settings.maxTokens,
      }
    )

    let fullResponse = ''

    // Stream the response
    for await (const chunk of stream) {
      fullResponse += chunk
      res.write(chunk)
      // Force flush the response
      if (res.flush) {
        res.flush()
      }
    }

    // Save the complete AI response
    await storage.addMessage({
      sessionId,
      role: 'assistant',
      content: fullResponse,
      tokens: ollamaService.estimateTokens(fullResponse),
    })

    res.end()
    logger.info(`Streamed response for session ${sessionId}`)

  } catch (error: any) {
    logger.error(`Failed to stream response for session ${sessionId}:`, error)
    if (!res.headersSent) {
      res.status(500)
    }
    res.write(`Error: ${error.message}`)
    res.end()
  }
}))

// Get chat history for a session
router.get('/:sessionId/history', asyncHandler(async (req: Request, res: Response) => {
  const storage = getStorage()
  const { sessionId } = req.params
  const { limit = 50, offset = 0 } = req.query

  // Check if session exists
  const session = await storage.getSession(sessionId)
  if (!session) {
    throw createError(`Session ${sessionId} not found`, 404, 'SESSION_NOT_FOUND')
  }

  const allMessages = await storage.getMessages(sessionId)
  
  // Apply pagination
  const limitNum = parseInt(limit as string)
  const offsetNum = parseInt(offset as string)
  const messages = allMessages.slice(offsetNum, offsetNum + limitNum)

  res.json({
    success: true,
    data: {
      sessionId,
      messages,
      total: allMessages.length,
      limit: limitNum,
      offset: offsetNum,
    },
  })
}))

// Regenerate last AI response
router.post('/:sessionId/regenerate', asyncHandler(async (req: Request, res: Response) => {
  const storage = getStorage()
  const ollamaService = getOllamaService()
  const { sessionId } = req.params

  // Check if session exists
  const session = await storage.getSession(sessionId)
  if (!session) {
    throw createError(`Session ${sessionId} not found`, 404, 'SESSION_NOT_FOUND')
  }

  const messages = await storage.getMessages(sessionId)
  
  if (messages.length === 0) {
    throw createError('No messages in session to regenerate', 400, 'NO_MESSAGES')
  }

  // Find the last AI message
  let lastAIMessageIndex = -1
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === 'assistant') {
      lastAIMessageIndex = i
      break
    }
  }
  
  if (lastAIMessageIndex === -1) {
    throw createError('No AI message found to regenerate', 400, 'NO_AI_MESSAGE')
  }

  // Get messages up to the last user message
  const conversationHistory = messages.slice(0, lastAIMessageIndex)

  try {
    // Get settings for AI options
    const settings = await storage.getSettings()
    
    // Generate new AI response
    const aiResponse = await ollamaService.generateCompletion(
      session.model,
      conversationHistory,
      {
        temperature: settings.temperature,
        maxTokens: settings.maxTokens,
      }
    )

    // Replace the last AI message
    const updatedMessage = await storage.addMessage({
      sessionId,
      role: 'assistant',
      content: aiResponse,
      tokens: ollamaService.estimateTokens(aiResponse),
    })

    logger.info(`Regenerated response for session ${sessionId}`)

    res.json({
      success: true,
      data: {
        message: updatedMessage,
        sessionId,
      },
    })

  } catch (error: any) {
    logger.error(`Failed to regenerate response for session ${sessionId}:`, error)
    throw createError(
      `Failed to regenerate AI response: ${error.message}`,
      500,
      'AI_GENERATION_FAILED'
    )
  }
}))

export default router 