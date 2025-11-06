import { Request, Response, NextFunction } from 'express'
import { RideService } from '../services/rideService'
import { validateData, createRideSchema, updateRideSchema, rideFiltersSchema } from '../utils/validation'
import { RideWithDetails } from '../types'
import { asyncHandler } from '../middleware/errorHandler'

export class RideController {
  /**
   * יצירת נסיעה חדשה
   */
  static createRide = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const validatedData = validateData(createRideSchema, req.body)
    const createdBy = req.user!.id

    const ride = await RideService.createRide(validatedData, createdBy)

    res.status(201).json({
      success: true,
      data: ride,
      message: 'נסיעה נוצרה בהצלחה'
    })
  })

  /**
   * קבלת נסיעה לפי מזהה
   */
  static getRideById = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params
    const ride = await RideService.getRideById(id)

    res.json({
      success: true,
      data: ride
    })
  })

  /**
   * קבלת נסיעות עם פילטרים
   */
  static getRides = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const validatedFilters = validateData(rideFiltersSchema, req.query)
    const result = await RideService.getRides(validatedFilters)

    res.json({
      success: true,
      data: result.rides,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages
      }
    })
  })

  /**
   * עדכון נסיעה
   */
  static updateRide = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params
    const validatedData = validateData(updateRideSchema, req.body)
    const updatedBy = req.user!.id

    const ride = await RideService.updateRide(id, validatedData, updatedBy)

    res.json({
      success: true,
      data: ride,
      message: 'נסיעה עודכנה בהצלחה'
    })
  })

  /**
   * עדכון סטטוס נסיעה
   */
  static updateRideStatus = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params
    const { status, notes } = req.body
    const updatedBy = req.user!.id

    const ride = await RideService.updateRideStatus(id, status, notes, updatedBy)

    res.json({
      success: true,
      data: ride,
      message: 'סטטוס נסיעה עודכן בהצלחה'
    })
  })

  /**
   * הקצאת נסיעה לנהג
   */
  static assignRide = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params
    const { driverId } = req.body
    const assignedBy = req.user!.id

    const ride = await RideService.assignRide(id, driverId, assignedBy)

    res.json({
      success: true,
      data: ride,
      message: 'נסיעה הוקצתה בהצלחה'
    })
  })

  /**
   * ביטול נסיעה
   */
  static cancelRide = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params
    const { reason } = req.body
    const cancelledBy = req.user!.id

    const ride = await RideService.cancelRide(id, reason, cancelledBy)

    res.json({
      success: true,
      data: ride,
      message: 'נסיעה בוטלה בהצלחה'
    })
  })

  /**
   * דחיית נסיעה על ידי נהג
   */
  static declineRide = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params
    const { reason } = req.body
    const declinedBy = req.user!.id

    const ride = await RideService.declineRide(id, reason, declinedBy)

    res.json({
      success: true,
      data: ride,
      message: 'נסיעה נדחתה בהצלחה'
    })
  })

  /**
   * קבלת נסיעות לפי נהג
   */
  static getRidesByDriver = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { driverId } = req.params
    const validatedFilters = validateData(rideFiltersSchema, req.query)
    
    const result = await RideService.getRidesByDriver(driverId, validatedFilters)

    res.json({
      success: true,
      data: result.rides,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages
      }
    })
  })

  /**
   * קבלת נסיעות לפי לקוח
   */
  static getRidesByClient = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { clientId } = req.params
    const validatedFilters = validateData(rideFiltersSchema, req.query)
    
    const result = await RideService.getRidesByClient(clientId, validatedFilters)

    res.json({
      success: true,
      data: result.rides,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages
      }
    })
  })

  /**
   * קבלת נסיעות לפי סטטוס
   */
  static getRidesByStatus = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { status } = req.params
    const validatedFilters = validateData(rideFiltersSchema, req.query)
    
    const result = await RideService.getRidesByStatus(status as any, validatedFilters)

    res.json({
      success: true,
      data: result.rides,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages
      }
    })
  })

  /**
   * קבלת נסיעות של המשתמש הנוכחי
   */
  static getMyRides = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user!.id
    const userRole = req.user!.role
    const validatedFilters = validateData(rideFiltersSchema, req.query)

    let result

    if (userRole === 'DRIVER') {
      result = await RideService.getRidesByDriver(userId, validatedFilters)
    } else if (userRole === 'INSTITUTIONAL_CLIENT') {
      result = await RideService.getRidesByClient(userId, validatedFilters)
    } else {
      // למנהלים - כל הנסיעות
      result = await RideService.getRides(validatedFilters)
    }

    res.json({
      success: true,
      data: result.rides,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages
      }
    })
  })

  /**
   * סטטיסטיקות נסיעות
   */
  static getRideStats = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const filters = {
      dateFrom: req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined,
      dateTo: req.query.dateTo ? new Date(req.query.dateTo as string) : undefined,
      driverId: req.query.driverId as string,
      clientId: req.query.clientId as string,
    }

    const stats = await RideService.getRideStats(filters)

    res.json({
      success: true,
      data: stats
    })
  })

  /**
   * קבלת נסיעות ממתינות
   */
  static getPendingRides = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const validatedFilters = validateData(rideFiltersSchema, req.query)
    const result = await RideService.getRidesByStatus('PENDING', validatedFilters)

    res.json({
      success: true,
      data: result.rides,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages
      }
    })
  })

  /**
   * קבלת נסיעות שהוקצו
   */
  static getAssignedRides = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const validatedFilters = validateData(rideFiltersSchema, req.query)
    const result = await RideService.getRidesByStatus('ASSIGNED', validatedFilters)

    res.json({
      success: true,
      data: result.rides,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages
      }
    })
  })

  /**
   * קבלת נסיעות שהושלמו
   */
  static getCompletedRides = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const validatedFilters = validateData(rideFiltersSchema, req.query)
    const result = await RideService.getRidesByStatus('COMPLETED', validatedFilters)

    res.json({
      success: true,
      data: result.rides,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages
      }
    })
  })
}
