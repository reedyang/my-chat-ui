import { createServer } from './app.js'
import { logger } from './utils/logger.js'

const PORT = process.env.PORT || 3001

async function startServer() {
  try {
    const app = await createServer()
    
    const server = app.listen(PORT, () => {
      logger.info(`🚀 Server started on port ${PORT}`)
      logger.info(`📁 Environment: ${process.env.NODE_ENV || 'development'}`)
      logger.info(`🤖 Ollama API: ${process.env.OLLAMA_BASE_URL || 'http://localhost:11434'}`)
    })

    // Graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received, shutting down gracefully')
      server.close(() => {
        logger.info('Process terminated')
        process.exit(0)
      })
    })

    process.on('SIGINT', () => {
      logger.info('SIGINT received, shutting down gracefully')
      server.close(() => {
        logger.info('Process terminated')
        process.exit(0)
      })
    })

  } catch (error) {
    logger.error('Failed to start server:', error)
    process.exit(1)
  }
}

startServer() 