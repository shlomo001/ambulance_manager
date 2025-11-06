import { PrismaClient, User, UserRole } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { UserWithPermissions, CreateUserRequest, UpdateUserRequest } from '../types'
import { UserNotFoundError, UserAlreadyExistsError, ValidationError } from '../utils/errors'
import { PermissionsService } from './permissionsService'

const prisma = new PrismaClient()

export class UserService {
  /**
   * יצירת משתמש חדש
   */
  static async createUser(data: CreateUserRequest, createdBy: string): Promise<UserWithPermissions> {
    // בדיקה שהמשתמש לא קיים
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email }
    })

    if (existingUser) {
      throw new UserAlreadyExistsError()
    }

    // הצפנת סיסמה
    const hashedPassword = await bcrypt.hash(data.password, 12)

    // יצירת המשתמש
    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        role: data.role,
        createdById: createdBy,
      },
      include: {
        permissions: {
          include: {
            permission: true
          }
        }
      }
    })

    // מתן הרשאות ברירת מחדל לפי תפקיד
    if (data.permissions && data.permissions.length > 0) {
      // מתן הרשאות מותאמות אישית
      await PermissionsService.updateUserPermissions(
        user.id,
        {
          granted: data.permissions,
          denied: []
        },
        createdBy
      )
    } else {
      // מתן הרשאות ברירת מחדל
      await PermissionsService.grantDefaultPermissions(user.id, data.role, createdBy)
    }

    // החזרת המשתמש עם ההרשאות המעודכנות
    return await this.getUserById(user.id)
  }

  /**
   * קבלת משתמש לפי מזהה
   */
  static async getUserById(id: string): Promise<UserWithPermissions> {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        permissions: {
          include: {
            permission: true
          }
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    })

    if (!user) {
      throw new UserNotFoundError()
    }

    return user as UserWithPermissions
  }

  /**
   * קבלת משתמש לפי אימייל
   */
  static async getUserByEmail(email: string): Promise<UserWithPermissions> {
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
      throw new UserNotFoundError()
    }

    return user as UserWithPermissions
  }

  /**
   * קבלת כל המשתמשים עם פילטרים
   */
  static async getUsers(filters: {
    role?: UserRole
    isActive?: boolean
    search?: string
    page?: number
    limit?: number
  }) {
    const { role, isActive, search, page = 1, limit = 10 } = filters

    const where: any = {}

    if (role) where.role = role
    if (isActive !== undefined) where.isActive = isActive
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ]
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          permissions: {
            include: {
              permission: true
            }
          },
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where })
    ])

    return {
      users: users as UserWithPermissions[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  }

  /**
   * עדכון משתמש
   */
  static async updateUser(
    id: string,
    data: UpdateUserRequest,
    updatedBy: string
  ): Promise<UserWithPermissions> {
    const user = await prisma.user.findUnique({
      where: { id }
    })

    if (!user) {
      throw new UserNotFoundError()
    }

    // בדיקה שהאימייל לא תפוס
    if (data.email && data.email !== user.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email: data.email }
      })

      if (existingUser) {
        throw new UserAlreadyExistsError()
      }
    }

    // עדכון המשתמש
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date()
      },
      include: {
        permissions: {
          include: {
            permission: true
          }
        }
      }
    })

    // עדכון הרשאות אם ניתנו
    if (data.permissions) {
      await PermissionsService.updateUserPermissions(
        id,
        {
          granted: data.permissions,
          denied: []
        },
        updatedBy
      )
    }

    return await this.getUserById(id)
  }

  /**
   * מחיקת משתמש (soft delete)
   */
  static async deleteUser(id: string, deletedBy: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id }
    })

    if (!user) {
      throw new UserNotFoundError()
    }

    // בדיקה שלא מוחקים Super Admin
    if (user.role === 'SUPER_ADMIN') {
      throw new ValidationError('לא ניתן למחוק Super Admin')
    }

    // בדיקה שלא מוחקים את עצמך
    if (id === deletedBy) {
      throw new ValidationError('לא ניתן למחוק את עצמך')
    }

    await prisma.user.update({
      where: { id },
      data: {
        isActive: false,
        updatedAt: new Date()
      }
    })
  }

  /**
   * הפעלת משתמש
   */
  static async activateUser(id: string, activatedBy: string): Promise<UserWithPermissions> {
    const user = await prisma.user.findUnique({
      where: { id }
    })

    if (!user) {
      throw new UserNotFoundError()
    }

    await prisma.user.update({
      where: { id },
      data: {
        isActive: true,
        updatedAt: new Date()
      }
    })

    return await this.getUserById(id)
  }

  /**
   * שינוי סיסמה
   */
  static async changePassword(
    id: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id }
    })

    if (!user) {
      throw new UserNotFoundError()
    }

    // בדיקת סיסמה נוכחית
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password)
    if (!isCurrentPasswordValid) {
      throw new ValidationError('סיסמה נוכחית לא תקינה')
    }

    // הצפנת סיסמה חדשה
    const hashedNewPassword = await bcrypt.hash(newPassword, 12)

    await prisma.user.update({
      where: { id },
      data: {
        password: hashedNewPassword,
        updatedAt: new Date()
      }
    })
  }

  /**
   * איפוס סיסמה
   */
  static async resetPassword(id: string, newPassword: string, resetBy: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id }
    })

    if (!user) {
      throw new UserNotFoundError()
    }

    // הצפנת סיסמה חדשה
    const hashedPassword = await bcrypt.hash(newPassword, 12)

    await prisma.user.update({
      where: { id },
      data: {
        password: hashedPassword,
        updatedAt: new Date()
      }
    })
  }

  /**
   * בדיקת סיסמה
   */
  static async verifyPassword(userId: string, password: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return false
    }

    return await bcrypt.compare(password, user.password)
  }

  /**
   * קבלת משתמשים לפי תפקיד
   */
  static async getUsersByRole(role: UserRole): Promise<UserWithPermissions[]> {
    const users = await prisma.user.findMany({
      where: {
        role,
        isActive: true
      },
      include: {
        permissions: {
          include: {
            permission: true
          }
        }
      },
      orderBy: { firstName: 'asc' }
    })

    return users as UserWithPermissions[]
  }

  /**
   * קבלת נהגים פעילים
   */
  static async getActiveDrivers(): Promise<UserWithPermissions[]> {
    return await this.getUsersByRole('DRIVER')
  }

  /**
   * קבלת לקוחות מוסדיים פעילים
   */
  static async getActiveClients(): Promise<UserWithPermissions[]> {
    return await this.getUsersByRole('INSTITUTIONAL_CLIENT')
  }

  /**
   * סטטיסטיקות משתמשים
   */
  static async getUserStats() {
    const [
      totalUsers,
      activeUsers,
      usersByRole,
      recentUsers
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.user.groupBy({
        by: ['role'],
        _count: { role: true },
        where: { isActive: true }
      }),
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 ימים אחרונים
          }
        }
      })
    ])

    return {
      totalUsers,
      activeUsers,
      inactiveUsers: totalUsers - activeUsers,
      usersByRole: usersByRole.map(item => ({
        role: item.role,
        count: item._count.role
      })),
      recentUsers
    }
  }
}
