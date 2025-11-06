import { Request, Response, NextFunction } from 'express'
import { PrismaClient } from '@prisma/client'
import { verifyAccessToken, extractTokenFromHeader } from '../utils/jwt'
import { AuthenticationError, AuthorizationError, UserNotFoundError } from '../utils/errors'
import { UserWithPermissions } from '../types'

const prisma = new PrismaClient()

// הרחבת Request interface
declare global {
  namespace Express {
    interface Request {
      user?: UserWithPermissions
    }
  }
}

/**
 * Middleware לאימות משתמש
 */
export async function authenticateToken(req: Request, res: Response, next: NextFunction) {
  try {
    const token = extractTokenFromHeader(req.headers.authorization)
    
    if (!token) {
      throw new AuthenticationError('טוקן אימות נדרש')
    }

    const payload = verifyAccessToken(token)
    
    // בדיקה שהמשתמש עדיין קיים ופעיל
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        permissions: {
          include: {
            permission: true
          }
        }
      }
    })

    if (!user) {
      throw new UserNotFoundError()
    }

    if (!user.isActive) {
      throw new AuthenticationError('משתמש לא פעיל')
    }

    req.user = user as UserWithPermissions
    next()
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'TOKEN_EXPIRED') {
        return res.status(401).json({
          success: false,
          error: 'טוקן פג תוקף',
          code: 'TOKEN_EXPIRED'
        })
      }
      
      if (error.message === 'INVALID_TOKEN') {
        return res.status(401).json({
          success: false,
          error: 'טוקן לא תקין',
          code: 'INVALID_TOKEN'
        })
      }
    }

    next(error)
  }
}

/**
 * Middleware לבדיקת הרשאות
 */
export function requirePermission(resource: string, action: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AuthenticationError()
      }

      const hasPermission = checkUserPermission(req.user, resource, action)
      
      if (!hasPermission) {
        throw new AuthorizationError(`אין הרשאה לבצע ${action} על ${resource}`)
      }

      next()
    } catch (error) {
      next(error)
    }
  }
}

/**
 * Middleware לבדיקת תפקיד
 */
export function requireRole(roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AuthenticationError()
      }

      if (!roles.includes(req.user.role)) {
        throw new AuthorizationError('אין הרשאה לגשת למשאב זה')
      }

      next()
    } catch (error) {
      next(error)
    }
  }
}

/**
 * בדיקת הרשאה של משתמש
 */
export function checkUserPermission(user: UserWithPermissions, resource: string, action: string): boolean {
  // Super Admin יש לו כל ההרשאות
  if (user.role === 'SUPER_ADMIN') {
    return true
  }

  // בדיקת הרשאות ספציפיות
  const permissionName = `${resource}.${action}`
  const userPermission = user.permissions.find(
    up => up.permission.name === permissionName && up.granted
  )

  return !!userPermission
}

/**
 * Middleware אופציונלי - לא דורש אימות
 */
export async function optionalAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const token = extractTokenFromHeader(req.headers.authorization)
    
    if (token) {
      const payload = verifyAccessToken(token)
      
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        include: {
          permissions: {
            include: {
              permission: true
            }
          }
        }
      })

      if (user && user.isActive) {
        req.user = user as UserWithPermissions
      }
    }

    next()
  } catch (error) {
    // במקרה של שגיאה, פשוט ממשיכים ללא משתמש
    next()
  }
}

/**
 * Middleware לבדיקת בעלות על משאב
 */
export function requireOwnership(resourceIdParam: string = 'id') {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AuthenticationError()
      }

      const resourceId = req.params[resourceIdParam]
      
      // Super Admin יכול לגשת לכל דבר
      if (req.user.role === 'SUPER_ADMIN') {
        return next()
      }

      // בדיקה שהמשתמש הוא הבעלים של המשאב
      if (req.user.id !== resourceId) {
        throw new AuthorizationError('אין הרשאה לגשת למשאב זה')
      }

      next()
    } catch (error) {
      next(error)
    }
  }
}

/**
 * Middleware לבדיקת הרשאות מתקדמות
 */
export function requireAdvancedPermission(permissions: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AuthenticationError()
      }

      // Super Admin יש לו כל ההרשאות
      if (req.user.role === 'SUPER_ADMIN') {
        return next()
      }

      // בדיקה שיש את כל ההרשאות הנדרשות
      const hasAllPermissions = permissions.every(permissionName => {
        const userPermission = req.user!.permissions.find(
          up => up.permission.name === permissionName && up.granted
        )
        return !!userPermission
      })

      if (!hasAllPermissions) {
        throw new AuthorizationError('אין הרשאה לבצע פעולה זו')
      }

      next()
    } catch (error) {
      next(error)
    }
  }
}
