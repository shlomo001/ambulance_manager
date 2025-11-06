import { PrismaClient, Ride, RideStatus, User } from '@prisma/client'
import { RideWithDetails, CreateRideRequest, UpdateRideRequest, RideFilters } from '../types'
import { RideNotFoundError, RideCannotBeModifiedError, ValidationError } from '../utils/errors'
import { encryptPatientDetails, decryptPatientDetails } from '../utils/encryption'
import { RIDE_STATUS_LABELS } from '../utils/constants'

const prisma = new PrismaClient()

export class RideService {
  /**
   * יצירת נסיעה חדשה
   */
  static async createRide(data: CreateRideRequest, createdBy: string): Promise<RideWithDetails> {
    // הצפנת פרטי חולה אם ניתנו
    const encryptedPatientDetails = data.patientDetails 
      ? encryptPatientDetails(data.patientDetails)
      : null

    const ride = await prisma.ride.create({
      data: {
        task: data.task,
        pickupAddress: data.pickupAddress,
        dropoffAddress: data.dropoffAddress,
        scheduledDate: data.scheduledDate,
        estimatedFare: data.estimatedFare,
        invoiceNumber: data.invoiceNumber,
        notes: data.notes,
        patientDetails: encryptedPatientDetails,
        clientId: data.clientId,
        driverId: data.driverId,
        status: data.driverId ? RideStatus.ASSIGNED : RideStatus.PENDING,
        createdById: createdBy,
      },
      include: {
        client: true,
        driver: true,
        createdBy: true,
        statusHistory: {
          orderBy: { timestamp: 'desc' }
        }
      }
    })

    // יצירת היסטוריית סטטוס ראשונית
    await prisma.rideStatusHistory.create({
      data: {
        rideId: ride.id,
        status: ride.status,
        timestamp: ride.createdAt,
        changedBy: createdBy,
      }
    })

    return ride as RideWithDetails
  }

  /**
   * קבלת נסיעה לפי מזהה
   */
  static async getRideById(id: string): Promise<RideWithDetails> {
    const ride = await prisma.ride.findUnique({
      where: { id },
      include: {
        client: true,
        driver: true,
        createdBy: true,
        statusHistory: {
          orderBy: { timestamp: 'desc' }
        }
      }
    })

    if (!ride) {
      throw new RideNotFoundError()
    }

    // פענוח פרטי חולה
    if (ride.patientDetails) {
      ride.patientDetails = decryptPatientDetails(ride.patientDetails)
    }

    return ride as RideWithDetails
  }

  /**
   * קבלת נסיעות עם פילטרים
   */
  static async getRides(filters: RideFilters) {
    const {
      dateFrom,
      dateTo,
      driverId,
      clientId,
      status,
      invoiceNumber,
      page = 1,
      limit = 10
    } = filters

    const where: any = {}

    if (dateFrom || dateTo) {
      where.scheduledDate = {}
      if (dateFrom) where.scheduledDate.gte = dateFrom
      if (dateTo) where.scheduledDate.lte = dateTo
    }

    if (driverId) where.driverId = driverId
    if (clientId) where.clientId = clientId
    if (status) where.status = status
    if (invoiceNumber) where.invoiceNumber = { contains: invoiceNumber }

    const [rides, total] = await Promise.all([
      prisma.ride.findMany({
        where,
        include: {
          client: true,
          driver: true,
          createdBy: true,
          statusHistory: {
            orderBy: { timestamp: 'desc' },
            take: 1
          }
        },
        orderBy: { scheduledDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.ride.count({ where })
    ])

    // פענוח פרטי חולה
    const ridesWithDecryptedDetails = rides.map(ride => ({
      ...ride,
      patientDetails: ride.patientDetails ? decryptPatientDetails(ride.patientDetails) : null
    }))

    return {
      rides: ridesWithDecryptedDetails as RideWithDetails[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  }

  /**
   * עדכון נסיעה
   */
  static async updateRide(
    id: string,
    data: UpdateRideRequest,
    updatedBy: string
  ): Promise<RideWithDetails> {
    const ride = await prisma.ride.findUnique({
      where: { id }
    })

    if (!ride) {
      throw new RideNotFoundError()
    }

    // בדיקה שניתן לעדכן את הנסיעה
    if (ride.status === RideStatus.COMPLETED) {
      throw new RideCannotBeModifiedError('לא ניתן לעדכן נסיעה שהושלמה')
    }

    // הצפנת פרטי חולה אם ניתנו
    const encryptedPatientDetails = data.patientDetails 
      ? encryptPatientDetails(data.patientDetails)
      : ride.patientDetails

    const updatedRide = await prisma.ride.update({
      where: { id },
      data: {
        ...data,
        patientDetails: encryptedPatientDetails,
        updatedAt: new Date()
      },
      include: {
        client: true,
        driver: true,
        createdBy: true,
        statusHistory: {
          orderBy: { timestamp: 'desc' }
        }
      }
    })

    // פענוח פרטי חולה
    if (updatedRide.patientDetails) {
      updatedRide.patientDetails = decryptPatientDetails(updatedRide.patientDetails)
    }

    return updatedRide as RideWithDetails
  }

  /**
   * עדכון סטטוס נסיעה
   */
  static async updateRideStatus(
    id: string,
    status: RideStatus,
    notes: string | null,
    updatedBy: string
  ): Promise<RideWithDetails> {
    const ride = await prisma.ride.findUnique({
      where: { id }
    })

    if (!ride) {
      throw new RideNotFoundError()
    }

    // בדיקות סטטוס
    if (status === RideStatus.ACCEPTED && ride.status !== RideStatus.ASSIGNED) {
      throw new RideCannotBeModifiedError('ניתן לקבל רק נסיעה שהוקצתה')
    }

    if (status === RideStatus.ON_THE_WAY && ride.status !== RideStatus.ACCEPTED) {
      throw new RideCannotBeModifiedError('ניתן להתחיל נסיעה רק לאחר קבלתה')
    }

    if (status === RideStatus.COMPLETED && ride.status !== RideStatus.ON_THE_WAY) {
      throw new RideCannotBeModifiedError('ניתן להשלים רק נסיעה שהחלה')
    }

    const updatedRide = await prisma.ride.update({
      where: { id },
      data: {
        status,
        updatedAt: new Date()
      },
      include: {
        client: true,
        driver: true,
        createdBy: true,
        statusHistory: {
          orderBy: { timestamp: 'desc' }
        }
      }
    })

    // יצירת היסטוריית סטטוס
    await prisma.rideStatusHistory.create({
      data: {
        rideId: id,
        status,
        timestamp: new Date(),
        notes,
        changedBy: updatedBy,
      }
    })

    // פענוח פרטי חולה
    if (updatedRide.patientDetails) {
      updatedRide.patientDetails = decryptPatientDetails(updatedRide.patientDetails)
    }

    return updatedRide as RideWithDetails
  }

  /**
   * הקצאת נסיעה לנהג
   */
  static async assignRide(
    id: string,
    driverId: string,
    assignedBy: string
  ): Promise<RideWithDetails> {
    const ride = await prisma.ride.findUnique({
      where: { id }
    })

    if (!ride) {
      throw new RideNotFoundError()
    }

    if (ride.status !== RideStatus.PENDING) {
      throw new RideCannotBeModifiedError('ניתן להקצות רק נסיעות ממתינות')
    }

    const updatedRide = await prisma.ride.update({
      where: { id },
      data: {
        driverId,
        status: RideStatus.ASSIGNED,
        updatedAt: new Date()
      },
      include: {
        client: true,
        driver: true,
        createdBy: true,
        statusHistory: {
          orderBy: { timestamp: 'desc' }
        }
      }
    })

    // יצירת היסטוריית סטטוס
    await prisma.rideStatusHistory.create({
      data: {
        rideId: id,
        status: RideStatus.ASSIGNED,
        timestamp: new Date(),
        notes: `הוקצה לנהג: ${updatedRide.driver?.firstName} ${updatedRide.driver?.lastName}`,
        changedBy: assignedBy,
      }
    })

    // פענוח פרטי חולה
    if (updatedRide.patientDetails) {
      updatedRide.patientDetails = decryptPatientDetails(updatedRide.patientDetails)
    }

    return updatedRide as RideWithDetails
  }

  /**
   * ביטול נסיעה
   */
  static async cancelRide(
    id: string,
    reason: string,
    cancelledBy: string
  ): Promise<RideWithDetails> {
    const ride = await prisma.ride.findUnique({
      where: { id }
    })

    if (!ride) {
      throw new RideNotFoundError()
    }

    if (ride.status === RideStatus.COMPLETED) {
      throw new RideCannotBeModifiedError('לא ניתן לבטל נסיעה שהושלמה')
    }

    const updatedRide = await prisma.ride.update({
      where: { id },
      data: {
        status: RideStatus.CANCELLED,
        updatedAt: new Date()
      },
      include: {
        client: true,
        driver: true,
        createdBy: true,
        statusHistory: {
          orderBy: { timestamp: 'desc' }
        }
      }
    })

    // יצירת היסטוריית סטטוס
    await prisma.rideStatusHistory.create({
      data: {
        rideId: id,
        status: RideStatus.CANCELLED,
        timestamp: new Date(),
        notes: reason,
        changedBy: cancelledBy,
      }
    })

    // פענוח פרטי חולה
    if (updatedRide.patientDetails) {
      updatedRide.patientDetails = decryptPatientDetails(updatedRide.patientDetails)
    }

    return updatedRide as RideWithDetails
  }

  /**
   * דחיית נסיעה על ידי נהג
   */
  static async declineRide(
    id: string,
    reason: string,
    declinedBy: string
  ): Promise<RideWithDetails> {
    const ride = await prisma.ride.findUnique({
      where: { id }
    })

    if (!ride) {
      throw new RideNotFoundError()
    }

    if (ride.status !== RideStatus.ASSIGNED) {
      throw new RideCannotBeModifiedError('ניתן לדחות רק נסיעות שהוקצו')
    }

    const updatedRide = await prisma.ride.update({
      where: { id },
      data: {
        driverId: null,
        status: RideStatus.DECLINED_BY_DRIVER,
        updatedAt: new Date()
      },
      include: {
        client: true,
        driver: true,
        createdBy: true,
        statusHistory: {
          orderBy: { timestamp: 'desc' }
        }
      }
    })

    // יצירת היסטוריית סטטוס
    await prisma.rideStatusHistory.create({
      data: {
        rideId: id,
        status: RideStatus.DECLINED_BY_DRIVER,
        timestamp: new Date(),
        notes: reason,
        changedBy: declinedBy,
      }
    })

    // פענוח פרטי חולה
    if (updatedRide.patientDetails) {
      updatedRide.patientDetails = decryptPatientDetails(updatedRide.patientDetails)
    }

    return updatedRide as RideWithDetails
  }

  /**
   * קבלת נסיעות לפי נהג
   */
  static async getRidesByDriver(driverId: string, filters: RideFilters = {}) {
    return await this.getRides({
      ...filters,
      driverId
    })
  }

  /**
   * קבלת נסיעות לפי לקוח
   */
  static async getRidesByClient(clientId: string, filters: RideFilters = {}) {
    return await this.getRides({
      ...filters,
      clientId
    })
  }

  /**
   * קבלת נסיעות לפי סטטוס
   */
  static async getRidesByStatus(status: RideStatus, filters: RideFilters = {}) {
    return await this.getRides({
      ...filters,
      status
    })
  }

  /**
   * סטטיסטיקות נסיעות
   */
  static async getRideStats(filters: {
    dateFrom?: Date
    dateTo?: Date
    driverId?: string
    clientId?: string
  } = {}) {
    const { dateFrom, dateTo, driverId, clientId } = filters

    const where: any = {}
    if (dateFrom || dateTo) {
      where.scheduledDate = {}
      if (dateFrom) where.scheduledDate.gte = dateFrom
      if (dateTo) where.scheduledDate.lte = dateTo
    }
    if (driverId) where.driverId = driverId
    if (clientId) where.clientId = clientId

    const [
      totalRides,
      completedRides,
      pendingRides,
      cancelledRides,
      totalRevenue,
      ridesByStatus,
      ridesByDriver,
      ridesByClient
    ] = await Promise.all([
      prisma.ride.count({ where }),
      prisma.ride.count({ where: { ...where, status: RideStatus.COMPLETED } }),
      prisma.ride.count({ where: { ...where, status: RideStatus.PENDING } }),
      prisma.ride.count({ where: { ...where, status: RideStatus.CANCELLED } }),
      prisma.ride.aggregate({
        where: { ...where, status: RideStatus.COMPLETED },
        _sum: { estimatedFare: true }
      }),
      prisma.ride.groupBy({
        by: ['status'],
        _count: { status: true },
        where
      }),
      prisma.ride.groupBy({
        by: ['driverId'],
        _count: { driverId: true },
        _sum: { estimatedFare: true },
        where: { ...where, status: RideStatus.COMPLETED }
      }),
      prisma.ride.groupBy({
        by: ['clientId'],
        _count: { clientId: true },
        _sum: { estimatedFare: true },
        where: { ...where, status: RideStatus.COMPLETED }
      })
    ])

    return {
      totalRides,
      completedRides,
      pendingRides,
      cancelledRides,
      totalRevenue: totalRevenue._sum.estimatedFare || 0,
      averageFare: completedRides > 0 ? (totalRevenue._sum.estimatedFare || 0) / completedRides : 0,
      ridesByStatus: ridesByStatus.map(item => ({
        status: item.status,
        count: item._count.status,
        label: RIDE_STATUS_LABELS[item.status]
      })),
      ridesByDriver: ridesByDriver.map(item => ({
        driverId: item.driverId,
        rideCount: item._count.driverId,
        revenue: item._sum.estimatedFare || 0
      })),
      ridesByClient: ridesByClient.map(item => ({
        clientId: item.clientId,
        rideCount: item._count.clientId,
        revenue: item._sum.estimatedFare || 0
      }))
    }
  }
}
