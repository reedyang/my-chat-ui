import { Request, Response, NextFunction } from 'express'
import { logger } from '../utils/logger.js'

export interface ApiError extends Error {
  status?: number
  code?: string
  details?: any
}

export class AppError extends Error implements ApiError {
  public status: number
  public code: string
  public details?: any

  constructor(message: string, status: number = 500, code: string = 'INTERNAL_ERROR', details?: any) {
    super(message)
    this.name = 'AppError'
    this.status = status
    this.code = code
    this.details = details
  }
}

export function createError(message: string, status: number = 500, code: string = 'INTERNAL_ERROR', details?: any): AppError {
  return new AppError(message, status, code, details)
}

export function errorHandler(error: ApiError, req: Request, res: Response, next: NextFunction): void {
  // Log error
  logger.error('Error occurred:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
  })

  // Default error values
  let status = error.status || 500
  let message = error.message || 'Internal Server Error'
  let code = (error as AppError).code || 'INTERNAL_ERROR'

  // Handle specific error types
  if (error.name === 'ValidationError') {
    status = 400
    code = 'VALIDATION_ERROR'
  } else if (error.name === 'CastError') {
    status = 400
    code = 'INVALID_ID'
    message = 'Invalid ID format'
  } else if (error.name === 'MongoNetworkError') {
    status = 503
    code = 'DATABASE_ERROR'
    message = 'Database connection error'
  }

  // Don't leak error details in production
  if (process.env.NODE_ENV === 'production' && status === 500) {
    message = 'Internal Server Error'
  }

  const errorResponse = {
    error: {
      message,
      code,
      status,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
      ...(error.details && { details: error.details }),
    },
  }

  res.status(status).json(errorResponse)
}

// Async error wrapper
export function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
} 