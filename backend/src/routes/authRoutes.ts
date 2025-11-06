import { Router } from 'express'
import { AuthController } from '../controllers/authController'
import { authenticateToken, requireRole } from '../middleware/auth'
import { validateRequest } from '../middleware/validation'
import { loginSchema, refreshTokenSchema } from '../utils/validation'
import { loginRateLimiter } from '../middleware/rateLimiter'
import { auditLogin, auditLogout } from '../middleware/audit'

const router = Router()

/**
 * @route POST /api/auth/login
 * @desc התחברות
 * @access Public
 */
router.post('/login',
  loginRateLimiter,
  validateRequest(loginSchema),
  auditLogin,
  AuthController.login
)

/**
 * @route POST /api/auth/refresh
 * @desc רענון טוקן
 * @access Public
 */
router.post('/refresh',
  validateRequest(refreshTokenSchema),
  AuthController.refreshToken
)

/**
 * @route POST /api/auth/logout
 * @desc התנתקות
 * @access Authenticated
 */
router.post('/logout',
  authenticateToken,
  auditLogout,
  AuthController.logout
)

/**
 * @route POST /api/auth/logout-all
 * @desc התנתקות מכל המכשירים
 * @access Authenticated
 */
router.post('/logout-all',
  authenticateToken,
  AuthController.logoutAll
)

/**
 * @route GET /api/auth/profile
 * @desc קבלת פרופיל המשתמש הנוכחי
 * @access Authenticated
 */
router.get('/profile',
  authenticateToken,
  AuthController.getProfile
)

/**
 * @route POST /api/auth/change-password
 * @desc שינוי סיסמה
 * @access Authenticated
 */
router.post('/change-password',
  authenticateToken,
  AuthController.changePassword
)

/**
 * @route POST /api/auth/reset-password
 * @desc איפוס סיסמה
 * @access Super Admin, Sub Admin
 */
router.post('/reset-password',
  authenticateToken,
  requireRole(['SUPER_ADMIN', 'SUB_ADMIN']),
  AuthController.resetPassword
)

/**
 * @route GET /api/auth/check
 * @desc בדיקת סטטוס אימות
 * @access Authenticated
 */
router.get('/check',
  authenticateToken,
  AuthController.checkAuth
)

export default router
