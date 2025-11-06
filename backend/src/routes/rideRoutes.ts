import { Router } from 'express'
import { RideController } from '../controllers/rideController'
import { authenticateToken, requirePermission, requireRole } from '../middleware/auth'
import { validateRequest, validateId, validatePagination } from '../middleware/validation'
import { createRideSchema, updateRideSchema, rideFiltersSchema } from '../utils/validation'
import { auditCreateRide, auditUpdateRide, auditDeleteRide, auditAssignRide } from '../middleware/audit'
import { createRideRateLimiter } from '../middleware/rateLimiter'

const router = Router()

// כל הנתיבים דורשים אימות
router.use(authenticateToken)

/**
 * @route GET /api/rides/stats
 * @desc קבלת סטטיסטיקות נסיעות
 * @access Super Admin, Sub Admin, Admin
 */
router.get('/stats',
  requirePermission('rides', 'read'),
  RideController.getRideStats
)

/**
 * @route GET /api/rides/pending
 * @desc קבלת נסיעות ממתינות
 * @access Super Admin, Sub Admin, Admin
 */
router.get('/pending',
  requirePermission('rides', 'read'),
  validateRequest(rideFiltersSchema),
  validatePagination(),
  RideController.getPendingRides
)

/**
 * @route GET /api/rides/assigned
 * @desc קבלת נסיעות שהוקצו
 * @access Super Admin, Sub Admin, Admin
 */
router.get('/assigned',
  requirePermission('rides', 'read'),
  validateRequest(rideFiltersSchema),
  validatePagination(),
  RideController.getAssignedRides
)

/**
 * @route GET /api/rides/completed
 * @desc קבלת נסיעות שהושלמו
 * @access Super Admin, Sub Admin, Admin
 */
router.get('/completed',
  requirePermission('rides', 'read'),
  validateRequest(rideFiltersSchema),
  validatePagination(),
  RideController.getCompletedRides
)

/**
 * @route GET /api/rides/my
 * @desc קבלת נסיעות של המשתמש הנוכחי
 * @access כל המשתמשים המאומתים
 */
router.get('/my',
  validateRequest(rideFiltersSchema),
  validatePagination(),
  RideController.getMyRides
)

/**
 * @route GET /api/rides/driver/:driverId
 * @desc קבלת נסיעות לפי נהג
 * @access Super Admin, Sub Admin, Admin
 */
router.get('/driver/:driverId',
  requirePermission('rides', 'read'),
  validateId('driverId'),
  validateRequest(rideFiltersSchema),
  validatePagination(),
  RideController.getRidesByDriver
)

/**
 * @route GET /api/rides/client/:clientId
 * @desc קבלת נסיעות לפי לקוח
 * @access Super Admin, Sub Admin, Admin
 */
router.get('/client/:clientId',
  requirePermission('rides', 'read'),
  validateId('clientId'),
  validateRequest(rideFiltersSchema),
  validatePagination(),
  RideController.getRidesByClient
)

/**
 * @route GET /api/rides/status/:status
 * @desc קבלת נסיעות לפי סטטוס
 * @access Super Admin, Sub Admin, Admin
 */
router.get('/status/:status',
  requirePermission('rides', 'read'),
  validateId('status'),
  validateRequest(rideFiltersSchema),
  validatePagination(),
  RideController.getRidesByStatus
)

/**
 * @route GET /api/rides
 * @desc קבלת כל הנסיעות
 * @access Super Admin, Sub Admin, Admin
 */
router.get('/',
  requirePermission('rides', 'read'),
  validateRequest(rideFiltersSchema),
  validatePagination(),
  RideController.getRides
)

/**
 * @route POST /api/rides
 * @desc יצירת נסיעה חדשה
 * @access Super Admin, Sub Admin, Admin, Institutional Client
 */
router.post('/',
  requirePermission('rides', 'create'),
  createRideRateLimiter,
  validateRequest(createRideSchema),
  auditCreateRide,
  RideController.createRide
)

/**
 * @route GET /api/rides/:id
 * @desc קבלת נסיעה לפי מזהה
 * @access Super Admin, Sub Admin, Admin, Driver, Institutional Client
 */
router.get('/:id',
  requirePermission('rides', 'read'),
  validateId(),
  RideController.getRideById
)

/**
 * @route PUT /api/rides/:id
 * @desc עדכון נסיעה
 * @access Super Admin, Sub Admin, Admin
 */
router.put('/:id',
  requirePermission('rides', 'update'),
  validateId(),
  validateRequest(updateRideSchema),
  auditUpdateRide,
  RideController.updateRide
)

/**
 * @route PUT /api/rides/:id/status
 * @desc עדכון סטטוס נסיעה
 * @access Super Admin, Sub Admin, Admin, Driver
 */
router.put('/:id/status',
  requirePermission('rides', 'update'),
  validateId(),
  RideController.updateRideStatus
)

/**
 * @route POST /api/rides/:id/assign
 * @desc הקצאת נסיעה לנהג
 * @access Super Admin, Sub Admin, Admin
 */
router.post('/:id/assign',
  requirePermission('rides', 'assign'),
  validateId(),
  auditAssignRide,
  RideController.assignRide
)

/**
 * @route POST /api/rides/:id/cancel
 * @desc ביטול נסיעה
 * @access Super Admin, Sub Admin, Admin
 */
router.post('/:id/cancel',
  requirePermission('rides', 'update'),
  validateId(),
  RideController.cancelRide
)

/**
 * @route POST /api/rides/:id/decline
 * @desc דחיית נסיעה על ידי נהג
 * @access Driver
 */
router.post('/:id/decline',
  requireRole(['DRIVER']),
  validateId(),
  RideController.declineRide
)

export default router
