import { Request, Response, NextFunction } from 'express'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { UserService } from '../services/userService'
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt'
import { validateData, loginSchema, refreshTokenSchema } from '../utils/validation'
import { AuthenticationError, UserNotFoundError, UserInactiveError } from '../utils/errors'
import { asyncHandler } from '../middleware/errorHandler'
import { auditLogin, auditLogout } from '../middleware/audit'

const prisma = new PrismaClient()

export class AuthController {
  /**
   * התחברות
   */
  static login = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const validatedData = validateData(loginSchema, req.body)
    const { email, password } = validatedData

    // מציאת המשתמש
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        permissions: {
          include: {
            permission: true
          }
        }
      }
    })

    if (!user) {
      throw new AuthenticationError()
    }

    // בדיקה שהמשתמש פעיל
    if (!user.isActive) {
      throw new UserInactiveError()
    }

    // בדיקת סיסמה
    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      throw new AuthenticationError()
    }

    // יצירת טוקנים
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role
    })

    const refreshToken = generateRefreshToken({
      userId: user.id,
      tokenId: 'temp' // נשמור את ה-refresh token במסד הנתונים
    })

    // שמירת refresh token במסד הנתונים
    const savedRefreshToken = await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 ימים
      }
    })

    // עדכון הטוקן עם המזהה האמיתי
    const finalRefreshToken = generateRefreshToken({
      userId: user.id,
      tokenId: savedRefreshToken.id
    })

    // עדכון הטוקן במסד הנתונים
    await prisma.refreshToken.update({
      where: { id: savedRefreshToken.id },
      data: { token: finalRefreshToken }
    })

    // הסרת הסיסמה מהתגובה
    const { password: _, ...userWithoutPassword } = user

    res.json({
      success: true,
      data: {
        user: userWithoutPassword,
        accessToken,
        refreshToken: finalRefreshToken
      },
      message: 'התחברות בוצעה בהצלחה'
    })
  })

  /**
   * רענון טוקן
   */
  static refreshToken = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const validatedData = validateData(refreshTokenSchema, req.body)
    const { refreshToken } = validatedData

    // אימות refresh token
    const payload = verifyRefreshToken(refreshToken)

    // בדיקה שהטוקן קיים במסד הנתונים
    const storedToken = await prisma.refreshToken.findUnique({
      where: { id: payload.tokenId },
      include: {
        user: {
          include: {
            permissions: {
              include: {
                permission: true
              }
            }
          }
        }
      }
    })

    if (!storedToken || storedToken.token !== refreshToken) {
      throw new AuthenticationError('טוקן רענון לא תקין')
    }

    // בדיקה שהטוקן לא פג תוקף
    if (storedToken.expiresAt < new Date()) {
      // מחיקת הטוקן הפג
      await prisma.refreshToken.delete({
        where: { id: payload.tokenId }
      })
      throw new AuthenticationError('טוקן רענון פג תוקף')
    }

    // בדיקה שהמשתמש עדיין פעיל
    if (!storedToken.user.isActive) {
      throw new UserInactiveError()
    }

    // יצירת access token חדש
    const newAccessToken = generateAccessToken({
      userId: storedToken.user.id,
      email: storedToken.user.email,
      role: storedToken.user.role
    })

    // הסרת הסיסמה מהתגובה
    const { password: _, ...userWithoutPassword } = storedToken.user

    res.json({
      success: true,
      data: {
        user: userWithoutPassword,
        accessToken: newAccessToken
      },
      message: 'טוקן רענון בוצע בהצלחה'
    })
  })

  /**
   * התנתקות
   */
  static logout = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { refreshToken } = req.body

    if (refreshToken) {
      try {
        const payload = verifyRefreshToken(refreshToken)
        
        // מחיקת refresh token ממסד הנתונים
        await prisma.refreshToken.deleteMany({
          where: { id: payload.tokenId }
        })
      } catch (error) {
        // אם הטוקן לא תקין, פשוט ממשיכים
        console.log('Invalid refresh token during logout:', error)
      }
    }

    res.json({
      success: true,
      message: 'התנתקות בוצעה בהצלחה'
    })
  })

  /**
   * התנתקות מכל המכשירים
   */
  static logoutAll = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user!.id

    // מחיקת כל ה-refresh tokens של המשתמש
    await prisma.refreshToken.deleteMany({
      where: { userId }
    })

    res.json({
      success: true,
      message: 'התנתקות מכל המכשירים בוצעה בהצלחה'
    })
  })

  /**
   * קבלת פרופיל המשתמש הנוכחי
   */
  static getProfile = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user!

    res.json({
      success: true,
      data: user
    })
  })

  /**
   * שינוי סיסמה
   */
  static changePassword = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user!.id
    const { currentPassword, newPassword } = req.body

    await UserService.changePassword(userId, currentPassword, newPassword)

    res.json({
      success: true,
      message: 'סיסמה שונתה בהצלחה'
    })
  })

  /**
   * איפוס סיסמה (על ידי מנהל)
   */
  static resetPassword = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { email } = req.body
    const resetBy = req.user!.id

    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      throw new UserNotFoundError()
    }

    // יצירת סיסמה זמנית
    const tempPassword = Math.random().toString(36).slice(-8)
    await UserService.resetPassword(user.id, tempPassword, resetBy)

    // כאן ניתן לשלוח אימייל עם הסיסמה הזמנית
    // await emailService.sendPasswordReset(user.email, tempPassword)

    res.json({
      success: true,
      message: 'סיסמה אופסה בהצלחה',
      data: {
        tempPassword // רק לצורך פיתוח - לא לשלוח בייצור!
      }
    })
  })

  /**
   * בדיקת סטטוס אימות
   */
  static checkAuth = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user!

    res.json({
      success: true,
      data: {
        isAuthenticated: true,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          permissions: user.permissions
        }
      }
    })
  })
}
