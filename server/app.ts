import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import rateLimit from 'express-rate-limit'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { logger } from './utils/logger.js'
import { errorHandler } from './middleware/errorHandler.js'
import { setupRoutes } from './routes/index.js'
import { createStorage } from './storage/index.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export async function createServer(): Promise<express.Application> {
  const app = express()

  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  }))

  // CORS configuration
  app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  }))

  // Compression
  app.use(compression())

  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  })
  app.use('/api', limiter)

  // OpenAI API rate limiting (more restrictive)
  const openaiLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 20, // Limit each IP to 20 requests per minute for OpenAI API
    message: 'Too many API requests, please try again later.',
  })
  app.use('/v1', openaiLimiter)

  // Body parsing
  app.use(express.json({ limit: '10mb' }))
  app.use(express.urlencoded({ extended: true, limit: '10mb' }))

  // Request logging
  app.use((req, res, next) => {
    logger.info(`${req.method} ${req.path}`)
    next()
  })

  // Health check
  app.get('/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0'
    })
  })

  // Initialize storage
  await createStorage()
  
  // Setup API routes
  await setupRoutes(app)

  // Serve static files in production
  if (process.env.NODE_ENV === 'production') {
    const staticPath = join(__dirname, '../../dist')
    app.use(express.static(staticPath))
    
    // SPA fallback
    app.get('*', (req, res) => {
      res.sendFile(join(staticPath, 'index.html'))
    })
  }

  // Error handling
  app.use(errorHandler)

  return app
} 