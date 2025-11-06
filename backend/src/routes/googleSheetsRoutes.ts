import { Router } from 'express'
import { GoogleSheetsController } from '../controllers/googleSheetsController'
import { authenticateToken, requirePermission, requireRole } from '../middleware/auth'
import { validateRequest } from '../middleware/validation'
import { googleSheetsExportSchema } from '../utils/validation'
import { exportRateLimiter } from '../middleware/rateLimiter'
import { auditExportSheets } from '../middleware/audit'

const router = Router()
const googleSheetsController = new GoogleSheetsController()

// כל הנתיבים דורשים אימות
router.use(authenticateToken)

/**
 * @route GET /api/sheets/settings
 * @desc קבלת הגדרות Google Sheets
 * @access Super Admin, Sub Admin, Admin
 */
router.get('/settings',
  requirePermission('sheets', 'settings'),
  googleSheetsController.getSettings
)

/**
 * @route PUT /api/sheets/settings
 * @desc עדכון הגדרות Google Sheets
 * @access Super Admin, Sub Admin
 */
router.put('/settings',
  requireRole(['SUPER_ADMIN', 'SUB_ADMIN']),
  requirePermission('sheets', 'settings'),
  googleSheetsController.updateSettings
)

/**
 * @route GET /api/sheets/test-connection
 * @desc בדיקת חיבור ל-Google Sheets
 * @access Super Admin, Sub Admin, Admin
 */
router.get('/test-connection',
  requirePermission('sheets', 'export'),
  googleSheetsController.testConnection
)

/**
 * @route GET /api/sheets/history
 * @desc קבלת היסטוריית ייצוא
 * @access Super Admin, Sub Admin, Admin
 */
router.get('/history',
  requirePermission('sheets', 'export'),
  googleSheetsController.getExportHistory
)

/**
 * @route POST /api/sheets/export
 * @desc ייצוא נסיעות ל-Google Sheets
 * @access Super Admin, Sub Admin, Admin
 */
router.post('/export',
  requirePermission('sheets', 'export'),
  exportRateLimiter,
  validateRequest(googleSheetsExportSchema),
  auditExportSheets,
  googleSheetsController.exportRides
)

/**
 * @route POST /api/sheets/auto-export
 * @desc ייצוא אוטומטי של נסיעות שהושלמו
 * @access Super Admin, Sub Admin
 */
router.post('/auto-export',
  requireRole(['SUPER_ADMIN', 'SUB_ADMIN']),
  requirePermission('sheets', 'export'),
  googleSheetsController.autoExport
)

export default router
