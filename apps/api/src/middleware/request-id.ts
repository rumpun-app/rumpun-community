import { Request, Response, NextFunction } from 'express'
import { ulid } from 'ulid'

declare global {
  namespace Express {
    interface Locals {
      requestId: string
    }
  }
}

export function requestId(req: Request, res: Response, next: NextFunction) {
  const id = (req.headers['x-request-id'] as string) || ulid()
  res.locals.requestId = id
  res.setHeader('X-Request-Id', id)
  next()
}
