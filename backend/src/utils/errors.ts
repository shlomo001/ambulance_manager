import { ERROR_MESSAGES } from './constants'

export class AppError extends Error {
  public readonly statusCode: number
  public readonly isOperational: boolean

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = isOperational

    Error.captureStackTrace(this, this.constructor)
  }
}

// שגיאות אימות
export class AuthenticationError extends AppError {
  constructor(message: string = ERROR_MESSAGES.INVALID_CREDENTIALS) {
    super(message, 401)
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = ERROR_MESSAGES.ACCESS_DENIED) {
    super(message, 403)
  }
}

export class TokenExpiredError extends AppError {
  constructor(message: string = ERROR_MESSAGES.TOKEN_EXPIRED) {
    super(message, 401)
  }
}

export class InvalidTokenError extends AppError {
  constructor(message: string = ERROR_MESSAGES.TOKEN_INVALID) {
    super(message, 401)
  }
}

// שגיאות משתמשים
export class UserNotFoundError extends AppError {
  constructor(message: string = ERROR_MESSAGES.USER_NOT_FOUND) {
    super(message, 404)
  }
}

export class UserAlreadyExistsError extends AppError {
  constructor(message: string = ERROR_MESSAGES.USER_ALREADY_EXISTS) {
    super(message, 409)
  }
}

export class UserInactiveError extends AppError {
  constructor(message: string = ERROR_MESSAGES.USER_INACTIVE) {
    super(message, 403)
  }
}

// שגיאות נסיעות
export class RideNotFoundError extends AppError {
  constructor(message: string = ERROR_MESSAGES.RIDE_NOT_FOUND) {
    super(message, 404)
  }
}

export class RideAlreadyAssignedError extends AppError {
  constructor(message: string = ERROR_MESSAGES.RIDE_ALREADY_ASSIGNED) {
    super(message, 409)
  }
}

export class RideCannotBeModifiedError extends AppError {
  constructor(message: string = ERROR_MESSAGES.RIDE_CANNOT_BE_MODIFIED) {
    super(message, 400)
  }
}

// שגיאות Google Sheets
export class GoogleSheetsConnectionError extends AppError {
  constructor(message: string = ERROR_MESSAGES.SHEETS_CONNECTION_FAILED) {
    super(message, 502)
  }
}

export class GoogleSheetsExportError extends AppError {
  constructor(message: string = ERROR_MESSAGES.SHEETS_EXPORT_FAILED) {
    super(message, 500)
  }
}

export class GoogleSheetsInvalidCredentialsError extends AppError {
  constructor(message: string = ERROR_MESSAGES.SHEETS_INVALID_CREDENTIALS) {
    super(message, 401)
  }
}

// שגיאות אימות נתונים
export class ValidationError extends AppError {
  constructor(message: string = ERROR_MESSAGES.VALIDATION_ERROR) {
    super(message, 400)
  }
}

// שגיאות רשת
export class NetworkError extends AppError {
  constructor(message: string = ERROR_MESSAGES.NETWORK_ERROR) {
    super(message, 503)
  }
}

// שגיאות פנימיות
export class InternalServerError extends AppError {
  constructor(message: string = ERROR_MESSAGES.INTERNAL_SERVER_ERROR) {
    super(message, 500)
  }
}

// פונקציה לטיפול בשגיאות
export function handleError(error: any): AppError {
  // אם זה כבר AppError, החזר אותו
  if (error instanceof AppError) {
    return error
  }

  // שגיאות Prisma
  if (error.code === 'P2002') {
    return new ValidationError('הנתונים כבר קיימים במערכת')
  }

  if (error.code === 'P2025') {
    return new UserNotFoundError()
  }

  // שגיאות JWT
  if (error.name === 'JsonWebTokenError') {
    return new InvalidTokenError()
  }

  if (error.name === 'TokenExpiredError') {
    return new TokenExpiredError()
  }

  // שגיאות אימות
  if (error.name === 'ValidationError') {
    return new ValidationError(error.message)
  }

  // שגיאות רשת
  if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
    return new NetworkError()
  }

  // שגיאה כללית
  return new InternalServerError(error.message || 'שגיאה לא ידועה')
}

// פונקציה לבדיקת שגיאות אופרציונליות
export function isOperationalError(error: Error): boolean {
  if (error instanceof AppError) {
    return error.isOperational
  }
  return false
}

// פונקציה לרישום שגיאות
export function logError(error: Error, context?: any): void {
  const timestamp = new Date().toISOString()
  const errorInfo = {
    timestamp,
    message: error.message,
    stack: error.stack,
    context,
  }

  if (error instanceof AppError) {
    console.error(`[${timestamp}] AppError:`, errorInfo)
  } else {
    console.error(`[${timestamp}] Unexpected Error:`, errorInfo)
  }
}

// פונקציה לשליחת תגובת שגיאה
export function sendErrorResponse(res: any, error: AppError): void {
  const statusCode = error.statusCode || 500
  const message = error.message || ERROR_MESSAGES.INTERNAL_SERVER_ERROR

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
  })
}
