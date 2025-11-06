import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { GoogleSheetsService } from '../../services/googleSheetsService'
import { testUtils, resetDatabase } from '../setup'
import { RideStatus } from '@prisma/client'

// Mock Google Sheets API
jest.mock('googleapis', () => ({
  google: {
    auth: {
      GoogleAuth: jest.fn().mockImplementation(() => ({
        // Mock auth implementation
      }))
    },
    sheets: jest.fn().mockReturnValue({
      spreadsheets: {
        get: jest.fn(),
        batchUpdate: jest.fn(),
        values: {
          get: jest.fn(),
          update: jest.fn(),
        }
      }
    })
  }
}))

describe('GoogleSheetsService', () => {
  let googleSheetsService: GoogleSheetsService
  let testUsers: any = {}
  let testRides: any = {}

  beforeEach(async () => {
    googleSheetsService = new GoogleSheetsService()
    await resetDatabase()

    // Create test users
    testUsers.admin = await testUtils.createTestUser({
      email: 'admin@test.com',
      password: 'hashedpassword',
      firstName: 'מנהל',
      lastName: 'מבחן',
      role: 'ADMIN',
      isActive: true,
    })

    testUsers.driver = await testUtils.createTestUser({
      email: 'driver@test.com',
      password: 'hashedpassword',
      firstName: 'נהג',
      lastName: 'מבחן',
      role: 'DRIVER',
      isActive: true,
    })

    testUsers.client = await testUtils.createTestUser({
      email: 'client@test.com',
      password: 'hashedpassword',
      firstName: 'לקוח',
      lastName: 'מבחן',
      role: 'INSTITUTIONAL_CLIENT',
      isActive: true,
    })

    // Create test rides
    testRides.completed1 = await testUtils.createTestRide({
      task: 'נסיעה הושלמה 1',
      pickupAddress: 'תל אביב, רחוב הרצל 1',
      dropoffAddress: 'ירושלים, רחוב יפו 10',
      scheduledDate: new Date('2024-01-15'),
      scheduledTime: '10:00',
      clientId: testUsers.client.id,
      driverId: testUsers.driver.id,
      estimatedFare: 150,
      invoiceNumber: 'INV-001',
      status: RideStatus.COMPLETED,
      createdById: testUsers.admin.id,
    })

    testRides.completed2 = await testUtils.createTestRide({
      task: 'נסיעה הושלמה 2',
      pickupAddress: 'חיפה, רחוב הרצל 1',
      dropoffAddress: 'נהריה, רחוב הרצל 10',
      scheduledDate: new Date('2024-01-16'),
      scheduledTime: '14:00',
      clientId: testUsers.client.id,
      driverId: testUsers.driver.id,
      estimatedFare: 80,
      invoiceNumber: 'INV-002',
      status: RideStatus.COMPLETED,
      createdById: testUsers.admin.id,
    })

    testRides.pending = await testUtils.createTestRide({
      task: 'נסיעה ממתינה',
      pickupAddress: 'באר שבע, רחוב הרצל 1',
      dropoffAddress: 'אילת, רחוב הרצל 10',
      scheduledDate: new Date('2024-01-17'),
      scheduledTime: '16:00',
      clientId: testUsers.client.id,
      driverId: testUsers.driver.id,
      estimatedFare: 200,
      status: RideStatus.PENDING,
      createdById: testUsers.admin.id,
    })

    // Set environment variables for testing
    process.env.GOOGLE_SHEETS_SPREADSHEET_ID = 'test-spreadsheet-id'
    process.env.GOOGLE_SHEETS_CREDENTIALS = JSON.stringify({
      type: 'service_account',
      project_id: 'test-project',
      private_key_id: 'test-key-id',
      private_key: 'test-private-key',
      client_email: 'test@test-project.iam.gserviceaccount.com',
      client_id: 'test-client-id',
      auth_uri: 'https://accounts.google.com/o/oauth2/auth',
      token_uri: 'https://oauth2.googleapis.com/token',
    })
  })

  describe('testConnection', () => {
    it('should return true when connection is successful', async () => {
      // Mock successful connection
      const mockSheets = {
        spreadsheets: {
          get: jest.fn().mockResolvedValue({
            data: {
              sheets: [
                { properties: { title: 'Sheet1' } }
              ]
            }
          })
        }
      }

      // Replace the mocked sheets instance
      ;(googleSheetsService as any).sheets = mockSheets

      const result = await googleSheetsService.testConnection()
      expect(result).toBe(true)
    })

    it('should return false when connection fails', async () => {
      // Mock failed connection
      const mockSheets = {
        spreadsheets: {
          get: jest.fn().mockRejectedValue(new Error('Connection failed'))
        }
      }

      ;(googleSheetsService as any).sheets = mockSheets

      const result = await googleSheetsService.testConnection()
      expect(result).toBe(false)
    })

    it('should return false when spreadsheet ID is not set', async () => {
      delete process.env.GOOGLE_SHEETS_SPREADSHEET_ID

      const result = await googleSheetsService.testConnection()
      expect(result).toBe(false)
    })
  })

  describe('exportRides', () => {
    it('should export completed rides successfully', async () => {
      // Mock successful export
      const mockSheets = {
        spreadsheets: {
          get: jest.fn().mockResolvedValue({
            data: {
              sheets: [
                { properties: { title: '2024-01', sheetId: 1 } }
              ]
            }
          }),
          batchUpdate: jest.fn().mockResolvedValue({}),
          values: {
            get: jest.fn().mockResolvedValue({
              data: {
                values: [
                  ['תאריך', 'משימה', 'מספר חשבונית', 'מחיר', 'סה"כ']
                ]
              }
            }),
            update: jest.fn().mockResolvedValue({})
          }
        }
      }

      ;(googleSheetsService as any).sheets = mockSheets

      const exportRequest = {
        rideIds: [testRides.completed1.id, testRides.completed2.id]
      }

      const result = await googleSheetsService.exportRides(exportRequest, testUsers.admin.id)

      expect(result.success).toBe(true)
      expect(result.exportedCount).toBe(2)
      expect(result.message).toContain('ייצוא הושלם בהצלחה')
    })

    it('should create new monthly sheet when needed', async () => {
      // Mock spreadsheet with no existing monthly sheet
      const mockSheets = {
        spreadsheets: {
          get: jest.fn().mockResolvedValue({
            data: {
              sheets: [
                { properties: { title: 'Sheet1' } }
              ]
            }
          }),
          batchUpdate: jest.fn().mockResolvedValue({}),
          values: {
            get: jest.fn().mockResolvedValue({
              data: {
                values: [
                  ['תאריך', 'משימה', 'מספר חשבונית', 'מחיר', 'סה"כ']
                ]
              }
            }),
            update: jest.fn().mockResolvedValue({})
          }
        }
      }

      ;(googleSheetsService as any).sheets = mockSheets

      const exportRequest = {
        rideIds: [testRides.completed1.id]
      }

      const result = await googleSheetsService.exportRides(exportRequest, testUsers.admin.id)

      expect(result.success).toBe(true)
      expect(result.sheetName).toMatch(/^\d{4}-\d{2}$/) // Should match YYYY-MM format
    })

    it('should return empty result when no rides to export', async () => {
      const exportRequest = {
        rideIds: [testRides.pending.id] // Pending ride should not be exported
      }

      const result = await googleSheetsService.exportRides(exportRequest, testUsers.admin.id)

      expect(result.success).toBe(true)
      expect(result.exportedCount).toBe(0)
      expect(result.message).toBe('אין נסיעות לייצוא')
    })

    it('should filter rides by date range', async () => {
      const mockSheets = {
        spreadsheets: {
          get: jest.fn().mockResolvedValue({
            data: {
              sheets: [
                { properties: { title: '2024-01', sheetId: 1 } }
              ]
            }
          }),
          batchUpdate: jest.fn().mockResolvedValue({}),
          values: {
            get: jest.fn().mockResolvedValue({
              data: {
                values: [
                  ['תאריך', 'משימה', 'מספר חשבונית', 'מחיר', 'סה"כ']
                ]
              }
            }),
            update: jest.fn().mockResolvedValue({})
          }
        }
      }

      ;(googleSheetsService as any).sheets = mockSheets

      const exportRequest = {
        dateFrom: '2024-01-15',
        dateTo: '2024-01-15'
      }

      const result = await googleSheetsService.exportRides(exportRequest, testUsers.admin.id)

      expect(result.success).toBe(true)
      expect(result.exportedCount).toBe(1) // Only one ride on 2024-01-15
    })

    it('should throw error when spreadsheet ID is not configured', async () => {
      delete process.env.GOOGLE_SHEETS_SPREADSHEET_ID

      const exportRequest = {
        rideIds: [testRides.completed1.id]
      }

      await expect(
        googleSheetsService.exportRides(exportRequest, testUsers.admin.id)
      ).rejects.toThrow('מזהה Google Sheets לא הוגדר')
    })
  })

  describe('getSettings', () => {
    it('should return Google Sheets settings', async () => {
      const settings = await googleSheetsService.getSettings()

      expect(settings).toBeDefined()
      expect(settings.spreadsheetId).toBe('test-spreadsheet-id')
      expect(settings.autoSyncEnabled).toBe(true)
    })
  })

  describe('updateSettings', () => {
    it('should update Google Sheets settings', async () => {
      const newSettings = {
        spreadsheetId: 'new-spreadsheet-id',
        autoSyncEnabled: false
      }

      await googleSheetsService.updateSettings(newSettings)

      const updatedSettings = await googleSheetsService.getSettings()
      expect(updatedSettings.spreadsheetId).toBe('new-spreadsheet-id')
      expect(updatedSettings.autoSyncEnabled).toBe(false)
    })
  })

  describe('getExportHistory', () => {
    it('should return export history', async () => {
      // Create a test export record
      const { prisma } = await import('../setup')
      await prisma.googleSheetsExport.create({
        data: {
          spreadsheetId: 'test-spreadsheet-id',
          sheetName: '2024-01',
          exportedBy: testUsers.admin.id,
          rideIds: [testRides.completed1.id],
          status: 'completed',
        }
      })

      const history = await googleSheetsService.getExportHistory()

      expect(history).toHaveLength(1)
      expect(history[0].spreadsheetId).toBe('test-spreadsheet-id')
      expect(history[0].sheetName).toBe('2024-01')
      expect(history[0].rideIds).toContain(testRides.completed1.id)
    })
  })

  describe('autoExportCompletedRides', () => {
    it('should export completed rides when auto-sync is enabled', async () => {
      // Mock successful export
      const mockSheets = {
        spreadsheets: {
          get: jest.fn().mockResolvedValue({
            data: {
              sheets: [
                { properties: { title: '2024-01', sheetId: 1 } }
              ]
            }
          }),
          batchUpdate: jest.fn().mockResolvedValue({}),
          values: {
            get: jest.fn().mockResolvedValue({
              data: {
                values: [
                  ['תאריך', 'משימה', 'מספר חשבונית', 'מחיר', 'סה"כ']
                ]
              }
            }),
            update: jest.fn().mockResolvedValue({})
          }
        }
      }

      ;(googleSheetsService as any).sheets = mockSheets

      // Should not throw error
      await expect(googleSheetsService.autoExportCompletedRides()).resolves.not.toThrow()
    })

    it('should not export when auto-sync is disabled', async () => {
      // Disable auto-sync
      const { prisma } = await import('../setup')
      await prisma.systemSettings.update({
        where: { key: 'auto_sync_enabled' },
        data: { value: 'false' }
      })

      // Should not throw error and should not export
      await expect(googleSheetsService.autoExportCompletedRides()).resolves.not.toThrow()
    })
  })
})
