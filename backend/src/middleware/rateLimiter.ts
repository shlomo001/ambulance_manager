import rateLimit from 'express-rate-limit'
import { RATE_LIMIT_CONFIG } from '../utils/constants'

/**
 * Rate limiter כללי
 */
export const generalRateLimiter = rateLimit({
  windowMs: RATE_LIMIT_CONFIG.WINDOW_MS,
  max: RATE_LIMIT_CONFIG.MAX_REQUESTS,
  message: {
    success: false,
    error: 'יותר מדי בקשות, נסה שוב מאוחר יותר'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: 'יותר מדי בקשות, נסה שוב מאוחר יותר',
      retryAfter: Math.round(RATE_LIMIT_CONFIG.WINDOW_MS / 1000)
    })
  }
})

/**
 * Rate limiter להתחברות
 */
export const loginRateLimiter = rateLimit({
  windowMs: RATE_LIMIT_CONFIG.LOGIN_WINDOW_MS,
  max: RATE_LIMIT_CONFIG.LOGIN_MAX_REQUESTS,
  message: {
    success: false,
    error: 'יותר מדי ניסיונות התחברות, נסה שוב מאוחר יותר'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // לא לספור בקשות מוצלחות
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: 'יותר מדי ניסיונות התחברות, נסה שוב מאוחר יותר',
      retryAfter: Math.round(RATE_LIMIT_CONFIG.LOGIN_WINDOW_MS / 1000)
    })
  }
})

/**
 * Rate limiter לייצוא Google Sheets
 */
export const exportRateLimiter = rateLimit({
  windowMs: 60 * 1000, // דקה אחת
  max: 5, // 5 ייצואים בדקה
  message: {
    success: false,
    error: 'יותר מדי ייצואים, נסה שוב מאוחר יותר'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: 'יותר מדי ייצואים, נסה שוב מאוחר יותר',
      retryAfter: 60
    })
  }
})

/**
 * Rate limiter ליצירת משתמשים
 */
export const createUserRateLimiter = rateLimit({
  windowMs: 60 * 1000, // דקה אחת
  max: 3, // 3 משתמשים בדקה
  message: {
    success: false,
    error: 'יותר מדי יצירת משתמשים, נסה שוב מאוחר יותר'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: 'יותר מדי יצירת משתמשים, נסה שוב מאוחר יותר',
      retryAfter: 60
    })
  }
})

/**
 * Rate limiter ליצירת נסיעות
 */
export const createRideRateLimiter = rateLimit({
  windowMs: 60 * 1000, // דקה אחת
  max: 10, // 10 נסיעות בדקה
  message: {
    success: false,
    error: 'יותר מדי יצירת נסיעות, נסה שוב מאוחר יותר'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: 'יותר מדי יצירת נסיעות, נסה שוב מאוחר יותר',
      retryAfter: 60
    })
  }
})
