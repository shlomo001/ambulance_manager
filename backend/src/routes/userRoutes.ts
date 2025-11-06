import { Router } from 'express'
import { UserController } from '../controllers/userController'
import { authenticateToken, requirePermission, requireRole } from '../middleware/auth'
import { validateRequest, validateId, validatePagination } from '../middleware/validation'
import { createUserSchema, updateUserSchema, userFiltersSchema } from '../utils/validation'
import { auditCreateUser, auditUpdateUser, auditDeleteUser, auditPermissionChange } from '../middleware/audit'
import { createUserRateLimiter } from '../middleware/rateLimiter'

const router = Router()

// כל הנתיבים דורשים אימות
router.use(authenticateToken)

/**
 * @route GET /api/users/stats
 * @desc קבלת סטטיסטיקות משתמשים
 * @access Super Admin, Sub Admin
 */
router.get('/stats',
  requireRole(['SUPER_ADMIN', 'SUB_ADMIN']),
  UserController.getUserStats
)

/**
 * @route GET /api/users/permissions
 * @desc קבלת כל ההרשאות במערכת
 * @access Super Admin, Sub Admin
 */
router.get('/permissions',
  requireRole(['SUPER_ADMIN', 'SUB_ADMIN']),
  UserController.getAllPermissions
)

/**
 * @route GET /api/users/permissions/:resource
 * @desc קבלת הרשאות לפי משאב
 * @access Super Admin, Sub Admin
 */
router.get('/permissions/:resource',
  requireRole(['SUPER_ADMIN', 'SUB_ADMIN']),
  UserController.getPermissionsByResource
)

/**
 * @route GET /api/users/drivers
 * @desc קבלת נהגים פעילים
 * @access Super Admin, Sub Admin, Admin
 */
router.get('/drivers',
  requirePermission('users', 'read'),
  UserController.getActiveDrivers
)

/**
 * @route GET /api/users/clients
 * @desc קבלת לקוחות מוסדיים פעילים
 * @access Super Admin, Sub Admin, Admin
 */
router.get('/clients',
  requirePermission('users', 'read'),
  UserController.getActiveClients
)

/**
 * @route GET /api/users
 * @desc קבלת כל המשתמשים
 * @access Super Admin, Sub Admin, Admin
 */
router.get('/',
  requirePermission('users', 'read'),
  validateRequest(userFiltersSchema),
  validatePagination(),
  UserController.getUsers
)

/**
 * @route POST /api/users
 * @desc יצירת משתמש חדש
 * @access Super Admin, Sub Admin, Admin
 */
router.post('/',
  requirePermission('users', 'create'),
  createUserRateLimiter,
  validateRequest(createUserSchema),
  auditCreateUser,
  UserController.createUser
)

/**
 * @route GET /api/users/me
 * @desc קבלת פרופיל המשתמש הנוכחי
 * @access כל המשתמשים המאומתים
 */
router.get('/me',
  UserController.getCurrentUser
)

/**
 * @route PUT /api/users/me
 * @desc עדכון פרופיל המשתמש הנוכחי
 * @access כל המשתמשים המאומתים
 */
router.put('/me',
  validateRequest(updateUserSchema),
  UserController.updateCurrentUser
)

/**
 * @route GET /api/users/:id
 * @desc קבלת משתמש לפי מזהה
 * @access Super Admin, Sub Admin, Admin
 */
router.get('/:id',
  requirePermission('users', 'read'),
  validateId(),
  UserController.getUserById
)

/**
 * @route PUT /api/users/:id
 * @desc עדכון משתמש
 * @access Super Admin, Sub Admin, Admin
 */
router.put('/:id',
  requirePermission('users', 'update'),
  validateId(),
  validateRequest(updateUserSchema),
  auditUpdateUser,
  UserController.updateUser
)

/**
 * @route DELETE /api/users/:id
 * @desc מחיקת משתמש
 * @access Super Admin, Sub Admin
 */
router.delete('/:id',
  requireRole(['SUPER_ADMIN', 'SUB_ADMIN']),
  requirePermission('users', 'delete'),
  validateId(),
  auditDeleteUser,
  UserController.deleteUser
)

/**
 * @route POST /api/users/:id/activate
 * @desc הפעלת משתמש
 * @access Super Admin, Sub Admin
 */
router.post('/:id/activate',
  requireRole(['SUPER_ADMIN', 'SUB_ADMIN']),
  requirePermission('users', 'update'),
  validateId(),
  UserController.activateUser
)

/**
 * @route POST /api/users/:id/change-password
 * @desc שינוי סיסמה
 * @access המשתמש עצמו
 */
router.post('/:id/change-password',
  validateId(),
  UserController.changePassword
)

/**
 * @route POST /api/users/:id/reset-password
 * @desc איפוס סיסמה
 * @access Super Admin, Sub Admin
 */
router.post('/:id/reset-password',
  requireRole(['SUPER_ADMIN', 'SUB_ADMIN']),
  requirePermission('users', 'update'),
  validateId(),
  UserController.resetPassword
)

/**
 * @route GET /api/users/:id/permissions
 * @desc קבלת הרשאות משתמש
 * @access Super Admin, Sub Admin, Admin
 */
router.get('/:id/permissions',
  requirePermission('users', 'read'),
  validateId(),
  UserController.getUserPermissions
)

/**
 * @route PUT /api/users/:id/permissions
 * @desc עדכון הרשאות משתמש
 * @access Super Admin, Sub Admin
 */
router.put('/:id/permissions',
  requireRole(['SUPER_ADMIN', 'SUB_ADMIN']),
  requirePermission('users', 'update'),
  validateId(),
  auditPermissionChange,
  UserController.updateUserPermissions
)

export default router
