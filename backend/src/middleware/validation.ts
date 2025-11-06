import { Request, Response, NextFunction } from 'express'
import Joi from 'joi'
import { validateData } from '../utils/validation'
import { ValidationError } from '../utils/errors'

/**
 * Middleware לאימות נתונים
 */
export function validateRequest(schema: Joi.ObjectSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // אימות נתוני הבקשה
      const validatedData = validateData(schema, req.body)
      req.body = validatedData
      next()
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({
          success: false,
          error: error.message,
          code: 'VALIDATION_ERROR'
        })
      }
      next(error)
    }
  }
}

/**
 * Middleware לאימות פרמטרים
 */
export function validateParams(schema: Joi.ObjectSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedParams = validateData(schema, req.params)
      req.params = validatedParams
      next()
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({
          success: false,
          error: error.message,
          code: 'VALIDATION_ERROR'
        })
      }
      next(error)
    }
  }
}

/**
 * Middleware לאימות query parameters
 */
export function validateQuery(schema: Joi.ObjectSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedQuery = validateData(schema, req.query)
      req.query = validatedQuery
      next()
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({
          success: false,
          error: error.message,
          code: 'VALIDATION_ERROR'
        })
      }
      next(error)
    }
  }
}

/**
 * Middleware לאימות מזהה
 */
export function validateId(paramName: string = 'id') {
  const schema = Joi.object({
    [paramName]: Joi.string().required().messages({
      'any.required': 'מזהה נדרש',
      'string.empty': 'מזהה לא יכול להיות ריק'
    })
  })

  return validateParams(schema)
}

/**
 * Middleware לאימות pagination
 */
export function validatePagination() {
  const schema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    sortBy: Joi.string().optional(),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc')
  })

  return validateQuery(schema)
}

/**
 * Middleware לאימות תאריכים
 */
export function validateDateRange() {
  const schema = Joi.object({
    dateFrom: Joi.date().optional(),
    dateTo: Joi.date().min(Joi.ref('dateFrom')).optional()
  })

  return validateQuery(schema)
}

/**
 * Middleware לאימות חיפוש
 */
export function validateSearch() {
  const schema = Joi.object({
    search: Joi.string().min(1).max(100).optional().messages({
      'string.min': 'חיפוש חייב להכיל לפחות תו אחד',
      'string.max': 'חיפוש לא יכול להכיל יותר מ-100 תווים'
    })
  })

  return validateQuery(schema)
}

/**
 * Middleware לאימות קבצים
 */
export function validateFileUpload(options: {
  maxSize?: number
  allowedTypes?: string[]
  required?: boolean
} = {}) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file && options.required) {
        return res.status(400).json({
          success: false,
          error: 'קובץ נדרש',
          code: 'FILE_REQUIRED'
        })
      }

      if (req.file) {
        // בדיקת גודל קובץ
        if (options.maxSize && req.file.size > options.maxSize) {
          return res.status(400).json({
            success: false,
            error: `קובץ גדול מדי. גודל מקסימלי: ${Math.round(options.maxSize / 1024 / 1024)}MB`,
            code: 'FILE_TOO_LARGE'
          })
        }

        // בדיקת סוג קובץ
        if (options.allowedTypes && !options.allowedTypes.includes(req.file.mimetype)) {
          return res.status(400).json({
            success: false,
            error: `סוג קובץ לא נתמך. סוגים מותרים: ${options.allowedTypes.join(', ')}`,
            code: 'INVALID_FILE_TYPE'
          })
        }
      }

      next()
    } catch (error) {
      next(error)
    }
  }
}

/**
 * Middleware לאימות JSON
 */
export function validateJSON() {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (req.body && typeof req.body === 'string') {
        req.body = JSON.parse(req.body)
      }
      next()
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: 'JSON לא תקין',
        code: 'INVALID_JSON'
      })
    }
  }
}

/**
 * Middleware לאימות Content-Type
 */
export function validateContentType(allowedTypes: string[] = ['application/json']) {
  return (req: Request, res: Response, next: NextFunction) => {
    const contentType = req.get('Content-Type')
    
    if (!contentType) {
      return res.status(400).json({
        success: false,
        error: 'Content-Type נדרש',
        code: 'MISSING_CONTENT_TYPE'
      })
    }

    const isValidType = allowedTypes.some(type => 
      contentType.toLowerCase().includes(type.toLowerCase())
    )

    if (!isValidType) {
      return res.status(415).json({
        success: false,
        error: `Content-Type לא נתמך. סוגים מותרים: ${allowedTypes.join(', ')}`,
        code: 'UNSUPPORTED_CONTENT_TYPE'
      })
    }

    next()
  }
}
