import { Request, Response, NextFunction } from 'express'
import { logger } from '../lib/logger.js'

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public detail?: string
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction) {
  const requestId = res.locals.requestId || 'unknown'

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      type: 'about:blank',
      title: err.message,
      status: err.statusCode,
      code: err.code,
      detail: err.detail,
      requestId,
    })
    return
  }

  logger.error({ err, requestId }, 'unhandled error')
  res.status(500).json({
    type: 'about:blank',
    title: 'Internal Server Error',
    status: 500,
    code: 'internal_error',
    requestId,
  })
}
