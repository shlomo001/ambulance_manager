import { Request, Response, NextFunction } from 'express'
import { UserService } from '../services/userService'
import { PermissionsService } from '../services/permissionsService'
import { validateData, createUserSchema, updateUserSchema, userFiltersSchema } from '../utils/validation'
import { UserWithPermissions } from '../types'
import { asyncHandler } from '../middleware/errorHandler'

export class UserController {
  /**
   * יצירת משתמש חדש
   */
  static createUser = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const validatedData = validateData(createUserSchema, req.body)
    const createdBy = req.user!.id

    const user = await UserService.createUser(validatedData, createdBy)

    res.status(201).json({
      success: true,
      data: user,
      message: 'משתמש נוצר בהצלחה'
    })
  })

  /**
   * קבלת משתמש לפי מזהה
   */
  static getUserById = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params
    const user = await UserService.getUserById(id)

    res.json({
      success: true,
      data: user
    })
  })

  /**
   * קבלת כל המשתמשים
   */
  static getUsers = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const validatedFilters = validateData(userFiltersSchema, req.query)
    const result = await UserService.getUsers(validatedFilters)

    res.json({
      success: true,
      data: result.users,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages
      }
    })
  })

  /**
   * עדכון משתמש
   */
  static updateUser = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params
    const validatedData = validateData(updateUserSchema, req.body)
    const updatedBy = req.user!.id

    const user = await UserService.updateUser(id, validatedData, updatedBy)

    res.json({
      success: true,
      data: user,
      message: 'משתמש עודכן בהצלחה'
    })
  })

  /**
   * מחיקת משתמש
   */
  static deleteUser = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params
    const deletedBy = req.user!.id

    await UserService.deleteUser(id, deletedBy)

    res.json({
      success: true,
      message: 'משתמש נמחק בהצלחה'
    })
  })

  /**
   * הפעלת משתמש
   */
  static activateUser = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params
    const activatedBy = req.user!.id

    const user = await UserService.activateUser(id, activatedBy)

    res.json({
      success: true,
      data: user,
      message: 'משתמש הופעל בהצלחה'
    })
  })

  /**
   * שינוי סיסמה
   */
  static changePassword = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params
    const { currentPassword, newPassword } = req.body

    await UserService.changePassword(id, currentPassword, newPassword)

    res.json({
      success: true,
      message: 'סיסמה שונתה בהצלחה'
    })
  })

  /**
   * איפוס סיסמה
   */
  static resetPassword = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params
    const { newPassword } = req.body
    const resetBy = req.user!.id

    await UserService.resetPassword(id, newPassword, resetBy)

    res.json({
      success: true,
      message: 'סיסמה אופסה בהצלחה'
    })
  })

  /**
   * קבלת הרשאות משתמש
   */
  static getUserPermissions = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params
    const permissions = await PermissionsService.getUserPermissions(id)

    res.json({
      success: true,
      data: permissions
    })
  })

  /**
   * עדכון הרשאות משתמש
   */
  static updateUserPermissions = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params
    const { permissions } = req.body
    const updatedBy = req.user!.id

    await PermissionsService.updateUserPermissions(id, permissions, updatedBy)

    res.json({
      success: true,
      message: 'הרשאות עודכנו בהצלחה'
    })
  })

  /**
   * קבלת נהגים פעילים
   */
  static getActiveDrivers = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const drivers = await UserService.getActiveDrivers()

    res.json({
      success: true,
      data: drivers
    })
  })

  /**
   * קבלת לקוחות מוסדיים פעילים
   */
  static getActiveClients = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const clients = await UserService.getActiveClients()

    res.json({
      success: true,
      data: clients
    })
  })

  /**
   * סטטיסטיקות משתמשים
   */
  static getUserStats = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const stats = await UserService.getUserStats()

    res.json({
      success: true,
      data: stats
    })
  })

  /**
   * קבלת פרופיל המשתמש הנוכחי
   */
  static getCurrentUser = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as UserWithPermissions

    res.json({
      success: true,
      data: user
    })
  })

  /**
   * עדכון פרופיל המשתמש הנוכחי
   */
  static updateCurrentUser = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user!.id
    const validatedData = validateData(updateUserSchema, req.body)

    // הסרת שדות שלא ניתן לעדכן
    delete validatedData.role
    delete validatedData.permissions

    const user = await UserService.updateUser(userId, validatedData, userId)

    res.json({
      success: true,
      data: user,
      message: 'פרופיל עודכן בהצלחה'
    })
  })

  /**
   * קבלת כל ההרשאות במערכת
   */
  static getAllPermissions = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const permissions = await PermissionsService.getAllPermissions()

    res.json({
      success: true,
      data: permissions
    })
  })

  /**
   * קבלת הרשאות לפי משאב
   */
  static getPermissionsByResource = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { resource } = req.params
    const permissions = await PermissionsService.getPermissionsByResource(resource)

    res.json({
      success: true,
      data: permissions
    })
  })
}
