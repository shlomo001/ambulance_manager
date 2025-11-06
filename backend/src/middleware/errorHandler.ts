import { Request, Response, NextFunction } from 'express'
import { Prisma } from '@prisma/client'
import { handleError, sendErrorResponse, logError } from '../utils/errors'
import { ERROR_MESSAGES } from '../utils/constants'

/**
 * Middleware לטיפול בשגיאות
 */
export function errorHandler(
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // רישום השגיאה
  logError(error, {
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id,
  })

  // טיפול בשגיאות Prisma
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        return res.status(409).json({
          success: false,
          error: 'הנתונים כבר קיימים במערכת',
          code: 'DUPLICATE_ENTRY'
        })
      
      case 'P2025':
        return res.status(404).json({
          success: false,
          error: 'המשאב לא נמצא',
          code: 'NOT_FOUND'
        })
      
      case 'P2003':
        return res.status(400).json({
          success: false,
          error: 'קישור למשאב לא קיים',
          code: 'FOREIGN_KEY_CONSTRAINT'
        })
      
      default:
        return res.status(500).json({
          success: false,
          error: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
          code: 'DATABASE_ERROR'
        })
    }
  }

  // טיפול בשגיאות Prisma אחרות
  if (error instanceof Prisma.PrismaClientUnknownRequestError) {
    return res.status(500).json({
      success: false,
      error: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
      code: 'UNKNOWN_DATABASE_ERROR'
    })
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return res.status(400).json({
      success: false,
      error: 'שגיאת אימות נתונים',
      code: 'VALIDATION_ERROR'
    })
  }

  // טיפול בשגיאות JWT
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: 'טוקן לא תקין',
      code: 'INVALID_TOKEN'
    })
  }

  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: 'טוקן פג תוקף',
      code: 'TOKEN_EXPIRED'
    })
  }

  // טיפול בשגיאות אימות
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: error.message || ERROR_MESSAGES.VALIDATION_ERROR,
      code: 'VALIDATION_ERROR'
    })
  }

  // טיפול בשגיאות רשת
  if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
    return res.status(503).json({
      success: false,
      error: ERROR_MESSAGES.NETWORK_ERROR,
      code: 'NETWORK_ERROR'
    })
  }

  // טיפול בשגיאות AppError
  if (error.statusCode) {
    return sendErrorResponse(res, error)
  }

  // שגיאה לא ידועה
  const appError = handleError(error)
  sendErrorResponse(res, appError)
}

/**
 * Middleware לטיפול בבקשות שלא נמצאו
 */
export function notFoundHandler(req: Request, res: Response, next: NextFunction) {
  res.status(404).json({
    success: false,
    error: 'המשאב לא נמצא',
    code: 'NOT_FOUND'
  })
}

/**
 * Middleware לטיפול בבקשות לא נתמכות
 */
export function methodNotAllowedHandler(req: Request, res: Response, next: NextFunction) {
  res.status(405).json({
    success: false,
    error: 'שיטת בקשה לא נתמכת',
    code: 'METHOD_NOT_ALLOWED'
  })
}

/**
 * Middleware לטיפול בשגיאות async
 */
export function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

/**
 * Middleware לבדיקת JSON תקין
 */
export function validateJSON(error: any, req: Request, res: Response, next: NextFunction) {
  if (error instanceof SyntaxError && 'body' in error) {
    return res.status(400).json({
      success: false,
      error: 'JSON לא תקין',
      code: 'INVALID_JSON'
    })
  }
  next()
}
