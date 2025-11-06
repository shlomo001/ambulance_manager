import { PrismaClient } from '@prisma/client'
import { execSync } from 'child_process'
import { join } from 'path'

const prisma = new PrismaClient()

// Global test setup
beforeAll(async () => {
  // Reset database before tests
  await resetDatabase()
  
  // Run seed data
  await seedTestData()
})

// Global test teardown
afterAll(async () => {
  await prisma.$disconnect()
})

// Reset database
export async function resetDatabase() {
  try {
    // Delete all data in reverse order of dependencies
    await prisma.googleSheetsExport.deleteMany()
    await prisma.notification.deleteMany()
    await prisma.auditLog.deleteMany()
    await prisma.refreshToken.deleteMany()
    await prisma.ride.deleteMany()
    await prisma.userPermission.deleteMany()
    await prisma.user.deleteMany()
    await prisma.permission.deleteMany()
    await prisma.role.deleteMany()
    await prisma.systemSettings.deleteMany()
  } catch (error) {
    console.error('Error resetting database:', error)
  }
}

// Seed test data
export async function seedTestData() {
  try {
    // Create roles
    const superAdminRole = await prisma.role.create({
      data: {
        name: 'SUPER_ADMIN',
        description: 'מנהל על',
        permissions: {
          create: [
            { name: 'users.create', description: 'יצירת משתמשים' },
            { name: 'users.read', description: 'צפייה במשתמשים' },
            { name: 'users.update', description: 'עדכון משתמשים' },
            { name: 'users.delete', description: 'מחיקת משתמשים' },
            { name: 'rides.create', description: 'יצירת נסיעות' },
            { name: 'rides.read', description: 'צפייה בנסיעות' },
            { name: 'rides.update', description: 'עדכון נסיעות' },
            { name: 'rides.delete', description: 'מחיקת נסיעות' },
            { name: 'sheets.export', description: 'ייצוא ל-Google Sheets' },
            { name: 'sheets.settings', description: 'הגדרות Google Sheets' },
            { name: 'notifications.create', description: 'יצירת התראות' },
          ]
        }
      }
    })

    const adminRole = await prisma.role.create({
      data: {
        name: 'ADMIN',
        description: 'מנהל',
        permissions: {
          create: [
            { name: 'users.create', description: 'יצירת משתמשים' },
            { name: 'users.read', description: 'צפייה במשתמשים' },
            { name: 'rides.create', description: 'יצירת נסיעות' },
            { name: 'rides.read', description: 'צפייה בנסיעות' },
            { name: 'rides.update', description: 'עדכון נסיעות' },
            { name: 'sheets.export', description: 'ייצוא ל-Google Sheets' },
          ]
        }
      }
    })

    const driverRole = await prisma.role.create({
      data: {
        name: 'DRIVER',
        description: 'נהג',
        permissions: {
          create: [
            { name: 'rides.read', description: 'צפייה בנסיעות' },
            { name: 'rides.update', description: 'עדכון נסיעות' },
          ]
        }
      }
    })

    // Create test users
    const superAdmin = await prisma.user.create({
      data: {
        email: 'superadmin@test.com',
        password: '$2b$10$test.hash.for.superadmin',
        firstName: 'מנהל',
        lastName: 'על',
        role: 'SUPER_ADMIN',
        isActive: true,
      }
    })

    const admin = await prisma.user.create({
      data: {
        email: 'admin@test.com',
        password: '$2b$10$test.hash.for.admin',
        firstName: 'מנהל',
        lastName: 'רגיל',
        role: 'ADMIN',
        isActive: true,
      }
    })

    const driver = await prisma.user.create({
      data: {
        email: 'driver@test.com',
        password: '$2b$10$test.hash.for.driver',
        firstName: 'נהג',
        lastName: 'מבחן',
        role: 'DRIVER',
        isActive: true,
      }
    })

    // Create test rides
    await prisma.ride.create({
      data: {
        task: 'נסיעה מבחן 1',
        pickupAddress: 'תל אביב, רחוב הרצל 1',
        dropoffAddress: 'ירושלים, רחוב יפו 10',
        scheduledDate: new Date('2024-01-15'),
        scheduledTime: '10:00',
        clientId: admin.id,
        driverId: driver.id,
        estimatedFare: 150,
        invoiceNumber: 'INV-001',
        notes: 'נסיעה רגילה',
        status: 'PENDING',
        createdById: superAdmin.id,
      }
    })

    await prisma.ride.create({
      data: {
        task: 'נסיעה מבחן 2',
        pickupAddress: 'חיפה, רחוב הרצל 5',
        dropoffAddress: 'נהריה, רחוב הרצל 20',
        scheduledDate: new Date('2024-01-16'),
        scheduledTime: '14:00',
        clientId: admin.id,
        estimatedFare: 80,
        invoiceNumber: 'INV-002',
        notes: 'נסיעה דחופה',
        status: 'COMPLETED',
        createdById: superAdmin.id,
      }
    })

    // Create system settings
    await prisma.systemSettings.create({
      data: {
        key: 'google_sheets_spreadsheet_id',
        value: 'test-spreadsheet-id',
        type: 'string',
      }
    })

    await prisma.systemSettings.create({
      data: {
        key: 'auto_sync_enabled',
        value: 'true',
        type: 'boolean',
      }
    })

  } catch (error) {
    console.error('Error seeding test data:', error)
  }
}

// Test utilities
export const testUtils = {
  async createTestUser(userData: any) {
    return await prisma.user.create({
      data: userData
    })
  },

  async createTestRide(rideData: any) {
    return await prisma.ride.create({
      data: rideData
    })
  },

  async createTestNotification(notificationData: any) {
    return await prisma.notification.create({
      data: notificationData
    })
  },

  async getUserByEmail(email: string) {
    return await prisma.user.findUnique({
      where: { email }
    })
  },

  async getRideById(id: string) {
    return await prisma.ride.findUnique({
      where: { id }
    })
  },

  async getNotificationById(id: string) {
    return await prisma.notification.findUnique({
      where: { id }
    })
  }
}

export { prisma }
