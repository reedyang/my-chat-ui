import { Router, Request, Response } from 'express'
import { getStorage } from '../storage/index.js'
import { asyncHandler, createError } from '../middleware/errorHandler.js'
import { logger } from '../utils/logger.js'
import { validateTitle, normalizeTitle } from '../utils/titleGenerator.js'
import { CreateSessionRequest, UpdateSessionRequest } from '../types/index.js'

const router = Router()

// Get all sessions
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const storage = getStorage()
  const sessions = await storage.getSessions()
  
  // Sort by updatedAt descending (most recent first)
  sessions.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  
  res.json({
    success: true,
    data: {
      sessions,
      total: sessions.length,
    },
  })
}))

// Create new session
router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const storage = getStorage()
  const { title, model }: CreateSessionRequest = req.body
  
  // Get default model from settings if not provided
  const settings = await storage.getSettings()
  const sessionModel = model || settings.defaultModel
  
  // Generate default title if not provided
  const sessionTitle = title || `New Chat ${new Date().toLocaleDateString()}`
  
  const session = await storage.createSession({
    title: sessionTitle,
    model: sessionModel,
    messageCount: 0,
  })
  
  logger.info(`Created new session: ${session.id}`)
  
  res.status(201).json({
    success: true,
    data: session,
  })
}))

// Get specific session
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const storage = getStorage()
  const { id } = req.params
  
  const session = await storage.getSession(id)
  
  if (!session) {
    throw createError(`Session ${id} not found`, 404, 'SESSION_NOT_FOUND')
  }
  
  res.json({
    success: true,
    data: session,
  })
}))

// Update session
router.put('/:id', asyncHandler(async (req: Request, res: Response) => {
  const storage = getStorage()
  const { id } = req.params
  const updates: UpdateSessionRequest = req.body
  
  // Validate request body
  if (!updates.title && !updates.model) {
    throw createError('No updates provided', 400, 'INVALID_REQUEST')
  }
  
  const session = await storage.updateSession(id, updates)
  
  if (!session) {
    throw createError(`Session ${id} not found`, 404, 'SESSION_NOT_FOUND')
  }
  
  logger.info(`Updated session: ${id}`)
  
  res.json({
    success: true,
    data: session,
  })
}))

// Delete session
router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  const storage = getStorage()
  const { id } = req.params
  
  const deleted = await storage.deleteSession(id)
  
  if (!deleted) {
    throw createError(`Session ${id} not found`, 404, 'SESSION_NOT_FOUND')
  }
  
  logger.info(`Deleted session: ${id}`)
  
  res.json({
    success: true,
    data: {
      id,
      deleted: true,
    },
  })
}))

// Get session messages
router.get('/:id/messages', asyncHandler(async (req: Request, res: Response) => {
  const storage = getStorage()
  const { id } = req.params
  
  // Check if session exists
  const session = await storage.getSession(id)
  if (!session) {
    throw createError(`Session ${id} not found`, 404, 'SESSION_NOT_FOUND')
  }
  
  const messages = await storage.getMessages(id)
  
  res.json({
    success: true,
    data: {
      sessionId: id,
      messages,
      total: messages.length,
    },
  })
}))

// Update session title
router.patch('/:id/title', asyncHandler(async (req: Request, res: Response) => {
  const storage = getStorage()
  const { id } = req.params
  const { title } = req.body

  if (!title || typeof title !== 'string') {
    throw createError('Title is required and must be a string', 400, 'INVALID_REQUEST')
  }

  // Validate title
  const validation = validateTitle(title)
  if (!validation.valid) {
    throw createError(validation.message || 'Invalid title', 400, 'INVALID_TITLE')
  }

  // Check if session exists
  const session = await storage.getSession(id)
  if (!session) {
    throw createError(`Session ${id} not found`, 404, 'SESSION_NOT_FOUND')
  }

  // Update session title
  const normalizedTitle = normalizeTitle(title)
  const updatedSession = await storage.updateSession(id, { title: normalizedTitle })

  if (!updatedSession) {
    throw createError(`Failed to update session ${id}`, 500, 'UPDATE_FAILED')
  }

  logger.info(`Updated title for session ${id}: "${normalizedTitle}"`)

  res.json({
    success: true,
    data: updatedSession,
  })
}))

export default router 