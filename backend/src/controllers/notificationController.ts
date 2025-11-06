import { Request, Response, NextFunction } from 'express'
import { NotificationService } from '../services/notificationService'
import { validateData, createNotificationSchema } from '../utils/validation'
import { asyncHandler } from '../middleware/errorHandler'

export class NotificationController {
  /**
   * יצירת התראה חדשה
   */
  static createNotification = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const validatedData = validateData(createNotificationSchema, req.body)
    const notification = await NotificationService.createNotification(validatedData)

    res.status(201).json({
      success: true,
      data: notification,
      message: 'התראה נוצרה בהצלחה'
    })
  })

  /**
   * קבלת התראות של המשתמש הנוכחי
   */
  static getMyNotifications = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user!.id
    const { isRead, limit, offset } = req.query

    const notifications = await NotificationService.getUserNotifications(userId, {
      isRead: isRead ? isRead === 'true' : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined,
    })

    res.json({
      success: true,
      data: notifications
    })
  })

  /**
   * סימון התראה כנקראה
   */
  static markAsRead = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params
    const userId = req.user!.id

    const notification = await NotificationService.markAsRead(id, userId)

    res.json({
      success: true,
      data: notification,
      message: 'התראה סומנה כנקראה'
    })
  })

  /**
   * סימון כל ההתראות כנקראות
   */
  static markAllAsRead = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user!.id

    await NotificationService.markAllAsRead(userId)

    res.json({
      success: true,
      message: 'כל ההתראות סומנו כנקראות'
    })
  })

  /**
   * מחיקת התראה
   */
  static deleteNotification = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params
    const userId = req.user!.id

    await NotificationService.deleteNotification(id, userId)

    res.json({
      success: true,
      message: 'התראה נמחקה בהצלחה'
    })
  })

  /**
   * סטטיסטיקות התראות
   */
  static getNotificationStats = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user!.id
    const stats = await NotificationService.getNotificationStats(userId)

    res.json({
      success: true,
      data: stats
    })
  })

  /**
   * יצירת התראה לכל המשתמשים
   */
  static notifyAllUsers = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { title, message, type } = req.body

    await NotificationService.notifyAllUsers(title, message, type)

    res.json({
      success: true,
      message: 'התראה נשלחה לכל המשתמשים'
    })
  })

  /**
   * יצירת התראה למשתמשים לפי תפקיד
   */
  static notifyUsersByRole = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { role, title, message, type } = req.body

    await NotificationService.notifyUsersByRole(role, title, message, type)

    res.json({
      success: true,
      message: `התראה נשלחה למשתמשים עם תפקיד: ${role}`
    })
  })
}
