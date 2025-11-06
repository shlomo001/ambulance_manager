import { PrismaClient, Notification, NotificationType, User } from '@prisma/client'
import { CreateNotificationRequest, NotificationWithDetails } from '../types'
import { UserNotFoundError, ValidationError } from '../utils/errors'

const prisma = new PrismaClient()

export class NotificationService {
  /**
   * יצירת התראה חדשה
   */
  static async createNotification(data: CreateNotificationRequest): Promise<NotificationWithDetails> {
    // בדיקה שהמשתמש קיים
    const user = await prisma.user.findUnique({
      where: { id: data.userId }
    })

    if (!user) {
      throw new UserNotFoundError()
    }

    const notification = await prisma.notification.create({
      data: {
        title: data.title,
        message: data.message,
        type: data.type as NotificationType,
        userId: data.userId,
        rideId: data.rideId,
      },
      include: {
        user: true,
        ride: {
          include: {
            driver: true,
            client: true,
          }
        }
      }
    })

    return notification as NotificationWithDetails
  }

  /**
   * יצירת התראות מרובות
   */
  static async createMultipleNotifications(notifications: CreateNotificationRequest[]): Promise<NotificationWithDetails[]> {
    const createdNotifications = []

    for (const notificationData of notifications) {
      try {
        const notification = await this.createNotification(notificationData)
        createdNotifications.push(notification)
      } catch (error) {
        console.error('Error creating notification:', error)
      }
    }

    return createdNotifications
  }

  /**
   * קבלת התראות של משתמש
   */
  static async getUserNotifications(
    userId: string,
    options: {
      isRead?: boolean
      limit?: number
      offset?: number
    } = {}
  ): Promise<NotificationWithDetails[]> {
    const { isRead, limit = 50, offset = 0 } = options

    const where: any = { userId }
    if (isRead !== undefined) {
      where.isRead = isRead
    }

    const notifications = await prisma.notification.findMany({
      where,
      include: {
        user: true,
        ride: {
          include: {
            driver: true,
            client: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    })

    return notifications as NotificationWithDetails[]
  }

  /**
   * סימון התראה כנקראה
   */
  static async markAsRead(notificationId: string, userId: string): Promise<NotificationWithDetails> {
    const notification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId,
      }
    })

    if (!notification) {
      throw new ValidationError('התראה לא נמצאה')
    }

    const updatedNotification = await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
      include: {
        user: true,
        ride: {
          include: {
            driver: true,
            client: true,
          }
        }
      }
    })

    return updatedNotification as NotificationWithDetails
  }

  /**
   * סימון כל ההתראות כנקראות
   */
  static async markAllAsRead(userId: string): Promise<void> {
    await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: { isRead: true }
    })
  }

  /**
   * מחיקת התראה
   */
  static async deleteNotification(notificationId: string, userId: string): Promise<void> {
    const notification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId,
      }
    })

    if (!notification) {
      throw new ValidationError('התראה לא נמצאה')
    }

    await prisma.notification.delete({
      where: { id: notificationId }
    })
  }

  /**
   * מחיקת התראות ישנות
   */
  static async deleteOldNotifications(daysOld: number = 30): Promise<number> {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysOld)

    const result = await prisma.notification.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate
        },
        isRead: true
      }
    })

    return result.count
  }

  /**
   * יצירת התראה על הקצאת נסיעה
   */
  static async notifyRideAssigned(rideId: string, driverId: string): Promise<void> {
    const ride = await prisma.ride.findUnique({
      where: { id: rideId },
      include: {
        driver: true,
        client: true,
        createdBy: true,
      }
    })

    if (!ride || !ride.driver) {
      return
    }

    // התראה לנהג
    await this.createNotification({
      title: 'נסיעה הוקצתה לך',
      message: `נסיעה הוקצתה לך: ${ride.task}`,
      type: 'RIDE_ASSIGNED',
      userId: driverId,
      rideId,
    })

    // התראה ללקוח אם קיים
    if (ride.clientId) {
      await this.createNotification({
        title: 'נסיעה הוקצתה',
        message: `נסיעה הוקצתה לנהג: ${ride.driver.firstName} ${ride.driver.lastName}`,
        type: 'RIDE_ASSIGNED',
        userId: ride.clientId,
        rideId,
      })
    }
  }

  /**
   * יצירת התראה על קבלת נסיעה
   */
  static async notifyRideAccepted(rideId: string): Promise<void> {
    const ride = await prisma.ride.findUnique({
      where: { id: rideId },
      include: {
        driver: true,
        client: true,
        createdBy: true,
      }
    })

    if (!ride) {
      return
    }

    // התראה למנהל שיצר את הנסיעה
    await this.createNotification({
      title: 'נסיעה אושרה',
      message: `נסיעה אושרה על ידי הנהג: ${ride.driver?.firstName} ${ride.driver?.lastName}`,
      type: 'RIDE_ACCEPTED',
      userId: ride.createdById,
      rideId,
    })

    // התראה ללקוח אם קיים
    if (ride.clientId) {
      await this.createNotification({
        title: 'נסיעה אושרה',
        message: `הנהג אישר את הנסיעה: ${ride.driver?.firstName} ${ride.driver?.lastName}`,
        type: 'RIDE_ACCEPTED',
        userId: ride.clientId,
        rideId,
      })
    }
  }

  /**
   * יצירת התראה על דחיית נסיעה
   */
  static async notifyRideDeclined(rideId: string, reason: string): Promise<void> {
    const ride = await prisma.ride.findUnique({
      where: { id: rideId },
      include: {
        driver: true,
        client: true,
        createdBy: true,
      }
    })

    if (!ride) {
      return
    }

    // התראה למנהל שיצר את הנסיעה
    await this.createNotification({
      title: 'נסיעה נדחתה',
      message: `נסיעה נדחתה על ידי הנהג: ${ride.driver?.firstName} ${ride.driver?.lastName}. סיבה: ${reason}`,
      type: 'DRIVER_DECLINED',
      userId: ride.createdById,
      rideId,
    })

    // התראה ללקוח אם קיים
    if (ride.clientId) {
      await this.createNotification({
        title: 'נסיעה נדחתה',
        message: `הנהג דחה את הנסיעה. סיבה: ${reason}`,
        type: 'DRIVER_DECLINED',
        userId: ride.clientId,
        rideId,
      })
    }
  }

  /**
   * יצירת התראה על השלמת נסיעה
   */
  static async notifyRideCompleted(rideId: string): Promise<void> {
    const ride = await prisma.ride.findUnique({
      where: { id: rideId },
      include: {
        driver: true,
        client: true,
        createdBy: true,
      }
    })

    if (!ride) {
      return
    }

    // התראה למנהל שיצר את הנסיעה
    await this.createNotification({
      title: 'נסיעה הושלמה',
      message: `נסיעה הושלמה על ידי הנהג: ${ride.driver?.firstName} ${ride.driver?.lastName}`,
      type: 'RIDE_COMPLETED',
      userId: ride.createdById,
      rideId,
    })

    // התראה ללקוח אם קיים
    if (ride.clientId) {
      await this.createNotification({
        title: 'נסיעה הושלמה',
        message: `הנסיעה הושלמה בהצלחה`,
        type: 'RIDE_COMPLETED',
        userId: ride.clientId,
        rideId,
      })
    }
  }

  /**
   * יצירת התראה על ביטול נסיעה
   */
  static async notifyRideCancelled(rideId: string, reason: string): Promise<void> {
    const ride = await prisma.ride.findUnique({
      where: { id: rideId },
      include: {
        driver: true,
        client: true,
        createdBy: true,
      }
    })

    if (!ride) {
      return
    }

    const notifications = []

    // התראה לנהג אם קיים
    if (ride.driverId) {
      notifications.push({
        title: 'נסיעה בוטלה',
        message: `נסיעה בוטלה. סיבה: ${reason}`,
        type: 'RIDE_CANCELLED' as NotificationType,
        userId: ride.driverId,
        rideId,
      })
    }

    // התראה ללקוח אם קיים
    if (ride.clientId) {
      notifications.push({
        title: 'נסיעה בוטלה',
        message: `נסיעה בוטלה. סיבה: ${reason}`,
        type: 'RIDE_CANCELLED' as NotificationType,
        userId: ride.clientId,
        rideId,
      })
    }

    if (notifications.length > 0) {
      await this.createMultipleNotifications(notifications)
    }
  }

  /**
   * יצירת התראה כללית
   */
  static async notifyAllUsers(
    title: string,
    message: string,
    type: NotificationType = 'SYSTEM_ALERT'
  ): Promise<void> {
    const users = await prisma.user.findMany({
      where: { isActive: true },
      select: { id: true }
    })

    const notifications = users.map(user => ({
      title,
      message,
      type,
      userId: user.id,
    }))

    await this.createMultipleNotifications(notifications)
  }

  /**
   * יצירת התראה למשתמשים לפי תפקיד
   */
  static async notifyUsersByRole(
    role: string,
    title: string,
    message: string,
    type: NotificationType = 'SYSTEM_ALERT'
  ): Promise<void> {
    const users = await prisma.user.findMany({
      where: { 
        isActive: true,
        role: role as any
      },
      select: { id: true }
    })

    const notifications = users.map(user => ({
      title,
      message,
      type,
      userId: user.id,
    }))

    await this.createMultipleNotifications(notifications)
  }

  /**
   * סטטיסטיקות התראות
   */
  static async getNotificationStats(userId: string) {
    const [total, unread, byType] = await Promise.all([
      prisma.notification.count({
        where: { userId }
      }),
      prisma.notification.count({
        where: { userId, isRead: false }
      }),
      prisma.notification.groupBy({
        by: ['type'],
        where: { userId },
        _count: { type: true }
      })
    ])

    return {
      total,
      unread,
      read: total - unread,
      byType: byType.map(item => ({
        type: item.type,
        count: item._count.type
      }))
    }
  }
}
