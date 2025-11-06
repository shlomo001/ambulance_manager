import { PrismaClient, Permission, UserPermission } from '@prisma/client'
import { PERMISSIONS, DEFAULT_PERMISSIONS } from '../utils/constants'
import { UserNotFoundError, ValidationError } from '../utils/errors'

const prisma = new PrismaClient()

export class PermissionsService {
  /**
   * יצירת הרשאה חדשה
   */
  static async createPermission(data: {
    name: string
    description: string
    resource: string
    action: string
  }): Promise<Permission> {
    try {
      return await prisma.permission.create({
        data
      })
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ValidationError('הרשאה כבר קיימת')
      }
      throw error
    }
  }

  /**
   * קבלת כל ההרשאות
   */
  static async getAllPermissions(): Promise<Permission[]> {
    return await prisma.permission.findMany({
      orderBy: [
        { resource: 'asc' },
        { action: 'asc' }
      ]
    })
  }

  /**
   * קבלת הרשאות לפי משאב
   */
  static async getPermissionsByResource(resource: string): Promise<Permission[]> {
    return await prisma.permission.findMany({
      where: { resource },
      orderBy: { action: 'asc' }
    })
  }

  /**
   * מתן הרשאה למשתמש
   */
  static async grantPermission(
    userId: string,
    permissionId: string,
    grantedBy: string
  ): Promise<UserPermission> {
    // בדיקה שהמשתמש קיים
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      throw new UserNotFoundError()
    }

    // בדיקה שההרשאה קיימת
    const permission = await prisma.permission.findUnique({
      where: { id: permissionId }
    })

    if (!permission) {
      throw new ValidationError('הרשאה לא נמצאה')
    }

    return await prisma.userPermission.upsert({
      where: {
        userId_permissionId: {
          userId,
          permissionId
        }
      },
      update: {
        granted: true,
        grantedBy,
        grantedAt: new Date()
      },
      create: {
        userId,
        permissionId,
        granted: true,
        grantedBy,
        grantedAt: new Date()
      }
    })
  }

  /**
   * הסרת הרשאה ממשתמש
   */
  static async revokePermission(
    userId: string,
    permissionId: string,
    revokedBy: string
  ): Promise<UserPermission> {
    return await prisma.userPermission.upsert({
      where: {
        userId_permissionId: {
          userId,
          permissionId
        }
      },
      update: {
        granted: false,
        grantedBy: revokedBy,
        grantedAt: new Date()
      },
      create: {
        userId,
        permissionId,
        granted: false,
        grantedBy: revokedBy,
        grantedAt: new Date()
      }
    })
  }

  /**
   * מתן הרשאות מרובות למשתמש
   */
  static async grantMultiplePermissions(
    userId: string,
    permissionIds: string[],
    grantedBy: string
  ): Promise<UserPermission[]> {
    const permissions = []

    for (const permissionId of permissionIds) {
      const permission = await this.grantPermission(userId, permissionId, grantedBy)
      permissions.push(permission)
    }

    return permissions
  }

  /**
   * הסרת הרשאות מרובות ממשתמש
   */
  static async revokeMultiplePermissions(
    userId: string,
    permissionIds: string[],
    revokedBy: string
  ): Promise<UserPermission[]> {
    const permissions = []

    for (const permissionId of permissionIds) {
      const permission = await this.revokePermission(userId, permissionId, revokedBy)
      permissions.push(permission)
    }

    return permissions
  }

  /**
   * מתן הרשאות ברירת מחדל לפי תפקיד
   */
  static async grantDefaultPermissions(
    userId: string,
    role: string,
    grantedBy: string
  ): Promise<UserPermission[]> {
    const defaultPermissions = DEFAULT_PERMISSIONS[role as keyof typeof DEFAULT_PERMISSIONS]
    
    if (!defaultPermissions) {
      throw new ValidationError('תפקיד לא תקין')
    }

    // קבלת מזההי ההרשאות
    const permissionIds = []
    for (const permissionName of defaultPermissions) {
      const permission = await prisma.permission.findUnique({
        where: { name: permissionName }
      })
      if (permission) {
        permissionIds.push(permission.id)
      }
    }

    return await this.grantMultiplePermissions(userId, permissionIds, grantedBy)
  }

  /**
   * בדיקת הרשאה של משתמש
   */
  static async checkUserPermission(
    userId: string,
    resource: string,
    action: string
  ): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        permissions: {
          include: {
            permission: true
          }
        }
      }
    })

    if (!user) {
      return false
    }

    // Super Admin יש לו כל ההרשאות
    if (user.role === 'SUPER_ADMIN') {
      return true
    }

    const permissionName = `${resource}.${action}`
    const userPermission = user.permissions.find(
      up => up.permission.name === permissionName && up.granted
    )

    return !!userPermission
  }

  /**
   * קבלת הרשאות משתמש
   */
  static async getUserPermissions(userId: string): Promise<{
    permissions: UserPermission[]
    grantedPermissions: string[]
    deniedPermissions: string[]
  }> {
    const userPermissions = await prisma.userPermission.findMany({
      where: { userId },
      include: {
        permission: true
      }
    })

    const grantedPermissions = userPermissions
      .filter(up => up.granted)
      .map(up => up.permission.name)

    const deniedPermissions = userPermissions
      .filter(up => !up.granted)
      .map(up => up.permission.name)

    return {
      permissions: userPermissions,
      grantedPermissions,
      deniedPermissions
    }
  }

  /**
   * עדכון הרשאות משתמש
   */
  static async updateUserPermissions(
    userId: string,
    permissions: {
      granted: string[]
      denied: string[]
    },
    updatedBy: string
  ): Promise<UserPermission[]> {
    const allPermissionIds = [...permissions.granted, ...permissions.denied]
    const results = []

    // מתן הרשאות
    for (const permissionName of permissions.granted) {
      const permission = await prisma.permission.findUnique({
        where: { name: permissionName }
      })
      if (permission) {
        const result = await this.grantPermission(userId, permission.id, updatedBy)
        results.push(result)
      }
    }

    // הסרת הרשאות
    for (const permissionName of permissions.denied) {
      const permission = await prisma.permission.findUnique({
        where: { name: permissionName }
      })
      if (permission) {
        const result = await this.revokePermission(userId, permission.id, updatedBy)
        results.push(result)
      }
    }

    return results
  }

  /**
   * קבלת משתמשים עם הרשאה מסוימת
   */
  static async getUsersWithPermission(permissionName: string): Promise<any[]> {
    const permission = await prisma.permission.findUnique({
      where: { name: permissionName }
    })

    if (!permission) {
      throw new ValidationError('הרשאה לא נמצאה')
    }

    return await prisma.user.findMany({
      where: {
        permissions: {
          some: {
            permissionId: permission.id,
            granted: true
          }
        }
      },
      include: {
        permissions: {
          where: {
            permissionId: permission.id
          },
          include: {
            permission: true
          }
        }
      }
    })
  }

  /**
   * יצירת הרשאות ברירת מחדל במערכת
   */
  static async createDefaultPermissions(): Promise<Permission[]> {
    const defaultPermissions = [
      // הרשאות משתמשים
      { name: PERMISSIONS.USERS_CREATE, description: 'יצירת משתמשים', resource: 'users', action: 'create' },
      { name: PERMISSIONS.USERS_READ, description: 'צפייה במשתמשים', resource: 'users', action: 'read' },
      { name: PERMISSIONS.USERS_UPDATE, description: 'עריכת משתמשים', resource: 'users', action: 'update' },
      { name: PERMISSIONS.USERS_DELETE, description: 'מחיקת משתמשים', resource: 'users', action: 'delete' },
      
      // הרשאות נסיעות
      { name: PERMISSIONS.RIDES_CREATE, description: 'יצירת נסיעות', resource: 'rides', action: 'create' },
      { name: PERMISSIONS.RIDES_READ, description: 'צפייה בנסיעות', resource: 'rides', action: 'read' },
      { name: PERMISSIONS.RIDES_UPDATE, description: 'עריכת נסיעות', resource: 'rides', action: 'update' },
      { name: PERMISSIONS.RIDES_DELETE, description: 'מחיקת נסיעות', resource: 'rides', action: 'delete' },
      { name: PERMISSIONS.RIDES_ASSIGN, description: 'הקצאת נסיעות', resource: 'rides', action: 'assign' },
      { name: PERMISSIONS.RIDES_APPROVE, description: 'אישור נסיעות', resource: 'rides', action: 'approve' },
      
      // הרשאות דוחות
      { name: PERMISSIONS.REPORTS_READ, description: 'צפייה בדוחות', resource: 'reports', action: 'read' },
      { name: PERMISSIONS.REPORTS_EXPORT, description: 'ייצוא דוחות', resource: 'reports', action: 'export' },
      
      // הרשאות Google Sheets
      { name: PERMISSIONS.SHEETS_EXPORT, description: 'ייצוא ל-Google Sheets', resource: 'sheets', action: 'export' },
      { name: PERMISSIONS.SHEETS_SETTINGS, description: 'הגדרות Google Sheets', resource: 'sheets', action: 'settings' },
      
      // הרשאות מערכת
      { name: PERMISSIONS.SYSTEM_SETTINGS, description: 'הגדרות מערכת', resource: 'system', action: 'settings' },
      { name: PERMISSIONS.SYSTEM_AUDIT, description: 'צפייה ביומן ביקורת', resource: 'system', action: 'audit' },
    ]

    const createdPermissions = []

    for (const permissionData of defaultPermissions) {
      try {
        const permission = await prisma.permission.upsert({
          where: { name: permissionData.name },
          update: {},
          create: permissionData
        })
        createdPermissions.push(permission)
      } catch (error) {
        console.error(`Error creating permission ${permissionData.name}:`, error)
      }
    }

    return createdPermissions
  }
}
