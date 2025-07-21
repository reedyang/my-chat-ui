import { Application } from 'express'
import sessionRoutes from './sessions.js'
import chatRoutes from './chat.js'
import modelRoutes from './models.js'
import settingsRoutes from './settings.js'
import openaiRoutes from './openai.js'

export async function setupRoutes(app: Application): Promise<void> {
  // API routes
  app.use('/api/sessions', sessionRoutes)
  app.use('/api/chat', chatRoutes)
  app.use('/api/models', modelRoutes)
  app.use('/api/settings', settingsRoutes)
  
  // OpenAI compatible API
  app.use('/v1', openaiRoutes)
} 