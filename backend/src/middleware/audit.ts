import { Request, Response, NextFunction } from 'express'
import { PrismaClient } from '@prisma/client'
import { UserWithPermissions } from '../types'

const prisma = new PrismaClient()

/**
 * Middleware לרישום פעולות במערכת
 */
export function auditLog(action: string, resource: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const originalSend = res.send

    res.send = function(data: any) {
      // רישום הפעולה רק אם הבקשה הצליחה
      if (res.statusCode >= 200 && res.statusCode < 300) {
        logAuditAction(req, action, resource)
      }
      return originalSend.call(this, data)
    }

    next()
  }
}

/**
 * רישום פעולת ביקורת
 */
async function logAuditAction(req: Request, action: string, resource: string) {
  try {
    const user = req.user as UserWithPermissions
    if (!user) return

    const resourceId = req.params.id || req.params.rideId || req.params.userId

    await prisma.auditLog.create({
      data: {
        action,
        resource,
        resourceId,
        details: {
          method: req.method,
          url: req.url,
          body: sanitizeRequestBody(req.body),
          query: req.query,
          params: req.params,
          userAgent: req.get('User-Agent'),
          ip: req.ip,
        },
        userId: user.id,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      },
    })
  } catch (error) {
    console.error('Error logging audit action:', error)
    // לא לזרוק שגיאה כדי לא להפריע לפעולה המקורית
  }
}

/**
 * ניקוי נתונים רגישים מהבקשה
 */
function sanitizeRequestBody(body: any): any {
  if (!body || typeof body !== 'object') {
    return body
  }

  const sensitiveFields = ['password', 'token', 'secret', 'key', 'patientDetails']
  const sanitized = { ...body }

  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]'
    }
  }

  return sanitized
}

/**
 * Middleware לרישום התחברות
 */
export const auditLogin = auditLog('LOGIN', 'auth')

/**
 * Middleware לרישום התנתקות
 */
export const auditLogout = auditLog('LOGOUT', 'auth')

/**
 * Middleware לרישום יצירת משתמש
 */
export const auditCreateUser = auditLog('CREATE', 'user')

/**
 * Middleware לרישום עדכון משתמש
 */
export const auditUpdateUser = auditLog('UPDATE', 'user')

/**
 * Middleware לרישום מחיקת משתמש
 */
export const auditDeleteUser = auditLog('DELETE', 'user')

/**
 * Middleware לרישום יצירת נסיעה
 */
export const auditCreateRide = auditLog('CREATE', 'ride')

/**
 * Middleware לרישום עדכון נסיעה
 */
export const auditUpdateRide = auditLog('UPDATE', 'ride')

/**
 * Middleware לרישום מחיקת נסיעה
 */
export const auditDeleteRide = auditLog('DELETE', 'ride')

/**
 * Middleware לרישום הקצאת נסיעה
 */
export const auditAssignRide = auditLog('ASSIGN', 'ride')

/**
 * Middleware לרישום ייצוא Google Sheets
 */
export const auditExportSheets = auditLog('EXPORT', 'google_sheets')

/**
 * Middleware לרישום עדכון הגדרות
 */
export const auditUpdateSettings = auditLog('UPDATE', 'system_settings')

/**
 * Middleware לרישום פעולות הרשאות
 */
export const auditPermissionChange = auditLog('UPDATE', 'user_permissions')

/**
 * פונקציה לקבלת יומן ביקורת
 */
export async function getAuditLogs(filters: {
  userId?: string
  action?: string
  resource?: string
  dateFrom?: Date
  dateTo?: Date
  page?: number
  limit?: number
}) {
  const { userId, action, resource, dateFrom, dateTo, page = 1, limit = 10 } = filters

  const where: any = {}

  if (userId) where.userId = userId
  if (action) where.action = action
  if (resource) where.resource = resource
  if (dateFrom || dateTo) {
    where.createdAt = {}
    if (dateFrom) where.createdAt.gte = dateFrom
    if (dateTo) where.createdAt.lte = dateTo
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.auditLog.count({ where }),
  ])

  return {
    logs,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  }
}
