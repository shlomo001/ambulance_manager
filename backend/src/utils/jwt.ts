import jwt from 'jsonwebtoken'
import { JwtPayload, RefreshTokenPayload } from '../types'
import { JWT_CONFIG } from './constants'

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key'
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key'

/**
 * יצירת Access Token
 */
export function generateAccessToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_CONFIG.ACCESS_TOKEN_EXPIRES_IN,
    algorithm: JWT_CONFIG.ALGORITHM as jwt.Algorithm,
  })
}

/**
 * יצירת Refresh Token
 */
export function generateRefreshToken(payload: Omit<RefreshTokenPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: JWT_CONFIG.REFRESH_TOKEN_EXPIRES_IN,
    algorithm: JWT_CONFIG.ALGORITHM as jwt.Algorithm,
  })
}

/**
 * אימות Access Token
 */
export function verifyAccessToken(token: string): JwtPayload {
  try {
    return jwt.verify(token, JWT_SECRET, {
      algorithms: [JWT_CONFIG.ALGORITHM as jwt.Algorithm],
    }) as JwtPayload
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('TOKEN_EXPIRED')
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('INVALID_TOKEN')
    }
    throw error
  }
}

/**
 * אימות Refresh Token
 */
export function verifyRefreshToken(token: string): RefreshTokenPayload {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET, {
      algorithms: [JWT_CONFIG.ALGORITHM as jwt.Algorithm],
    }) as RefreshTokenPayload
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('REFRESH_TOKEN_EXPIRED')
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('INVALID_REFRESH_TOKEN')
    }
    throw error
  }
}

/**
 * חילוץ טוקן מ-Header
 */
export function extractTokenFromHeader(authHeader: string | undefined): string | null {
  if (!authHeader) {
    return null
  }

  const parts = authHeader.split(' ')
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null
  }

  return parts[1]
}

/**
 * בדיקת תפוגת טוקן
 */
export function isTokenExpired(token: string): boolean {
  try {
    const decoded = jwt.decode(token) as any
    if (!decoded || !decoded.exp) {
      return true
    }
    
    const currentTime = Math.floor(Date.now() / 1000)
    return decoded.exp < currentTime
  } catch {
    return true
  }
}

/**
 * חילוץ מידע מטוקן ללא אימות
 */
export function decodeToken(token: string): any {
  return jwt.decode(token)
}
