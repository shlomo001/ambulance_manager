import { Router } from 'express'
import { NotificationController } from '../controllers/notificationController'
import { authenticateToken, requirePermission, requireRole } from '../middleware/auth'
import { validateRequest } from '../middleware/validation'
import { createNotificationSchema } from '../utils/validation'

const router = Router()

// כל הנתיבים דורשים אימות
router.use(authenticateToken)

/**
 * @route GET /api/notifications/my
 * @desc קבלת התראות של המשתמש הנוכחי
 * @access כל המשתמשים המאומתים
 */
router.get('/my',
  NotificationController.getMyNotifications
)

/**
 * @route GET /api/notifications/stats
 * @desc סטטיסטיקות התראות
 * @access כל המשתמשים המאומתים
 */
router.get('/stats',
  NotificationController.getNotificationStats
)

/**
 * @route POST /api/notifications
 * @desc יצירת התראה חדשה
 * @access Super Admin, Sub Admin, Admin
 */
router.post('/',
  requirePermission('notifications', 'create'),
  validateRequest(createNotificationSchema),
  NotificationController.createNotification
)

/**
 * @route PUT /api/notifications/:id/read
 * @desc סימון התראה כנקראה
 * @access כל המשתמשים המאומתים
 */
router.put('/:id/read',
  NotificationController.markAsRead
)

/**
 * @route PUT /api/notifications/read-all
 * @desc סימון כל ההתראות כנקראות
 * @access כל המשתמשים המאומתים
 */
router.put('/read-all',
  NotificationController.markAllAsRead
)

/**
 * @route DELETE /api/notifications/:id
 * @desc מחיקת התראה
 * @access כל המשתמשים המאומתים
 */
router.delete('/:id',
  NotificationController.deleteNotification
)

/**
 * @route POST /api/notifications/notify-all
 * @desc יצירת התראה לכל המשתמשים
 * @access Super Admin, Sub Admin
 */
router.post('/notify-all',
  requireRole(['SUPER_ADMIN', 'SUB_ADMIN']),
  requirePermission('notifications', 'create'),
  NotificationController.notifyAllUsers
)

/**
 * @route POST /api/notifications/notify-role
 * @desc יצירת התראה למשתמשים לפי תפקיד
 * @access Super Admin, Sub Admin
 */
router.post('/notify-role',
  requireRole(['SUPER_ADMIN', 'SUB_ADMIN']),
  requirePermission('notifications', 'create'),
  NotificationController.notifyUsersByRole
)

export default router
