import { google } from 'googleapis'
import { PrismaClient, Ride, RideStatus } from '@prisma/client'
import { GoogleSheetsExportRequest, GoogleSheetsExportResponse } from '../types'
import { GoogleSheetsConnectionError, GoogleSheetsExportError, GoogleSheetsInvalidCredentialsError } from '../utils/errors'
import { GOOGLE_SHEETS_CONFIG } from '../utils/constants'
import { decryptPatientDetails } from '../utils/encryption'

const prisma = new PrismaClient()

export class GoogleSheetsService {
  private sheets: any
  private auth: any

  constructor() {
    this.initializeAuth()
  }

  /**
   * אתחול אימות Google Sheets
   */
  private async initializeAuth() {
    try {
      const credentials = process.env.GOOGLE_SHEETS_CREDENTIALS
      
      if (!credentials) {
        throw new GoogleSheetsInvalidCredentialsError('פרטי Google Sheets לא הוגדרו')
      }

      const credentialsJson = JSON.parse(credentials)
      
      this.auth = new google.auth.GoogleAuth({
        credentials: credentialsJson,
        scopes: GOOGLE_SHEETS_CONFIG.SCOPES,
      })

      this.sheets = google.sheets({ version: 'v4', auth: this.auth })
    } catch (error) {
      console.error('Error initializing Google Sheets auth:', error)
      throw new GoogleSheetsConnectionError('שגיאה באתחול חיבור ל-Google Sheets')
    }
  }

  /**
   * יצירת גיליון חדש לחודש
   */
  private async createMonthlySheet(spreadsheetId: string, year: number, month: number): Promise<string> {
    try {
      const sheetName = `${year}-${month.toString().padStart(2, '0')}`
      
      // בדיקה אם הגיליון כבר קיים
      const spreadsheet = await this.sheets.spreadsheets.get({
        spreadsheetId,
      })

      const existingSheet = spreadsheet.data.sheets?.find(
        (sheet: any) => sheet.properties.title === sheetName
      )

      if (existingSheet) {
        return sheetName
      }

      // יצירת גיליון חדש
      await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        resource: {
          requests: [
            {
              addSheet: {
                properties: {
                  title: sheetName,
                  gridProperties: {
                    rowCount: 1000,
                    columnCount: 10,
                  },
                },
              },
            },
          ],
        },
      })

      // הוספת כותרות
      await this.sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetName}!A1:E1`,
        valueInputOption: 'RAW',
        resource: {
          values: [
            [
              GOOGLE_SHEETS_CONFIG.SHEET_HEADERS.DATE,
              GOOGLE_SHEETS_CONFIG.SHEET_HEADERS.TASK,
              GOOGLE_SHEETS_CONFIG.SHEET_HEADERS.INVOICE_NUMBER,
              GOOGLE_SHEETS_CONFIG.SHEET_HEADERS.PRICE,
              GOOGLE_SHEETS_CONFIG.SHEET_HEADERS.TOTAL,
            ],
          ],
        },
      })

      // עיצוב הכותרות
      await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        resource: {
          requests: [
            {
              repeatCell: {
                range: {
                  sheetId: spreadsheet.data.sheets?.find((s: any) => s.properties.title === sheetName)?.properties.sheetId,
                  startRowIndex: 0,
                  endRowIndex: 1,
                  startColumnIndex: 0,
                  endColumnIndex: 5,
                },
                cell: {
                  userEnteredFormat: {
                    backgroundColor: { red: 0.2, green: 0.4, blue: 0.8 },
                    textFormat: {
                      foregroundColor: { red: 1, green: 1, blue: 1 },
                      bold: true,
                    },
                  },
                },
                fields: 'userEnteredFormat(backgroundColor,textFormat)',
              },
            },
          ],
        },
      })

      return sheetName
    } catch (error) {
      console.error('Error creating monthly sheet:', error)
      throw new GoogleSheetsExportError('שגיאה ביצירת גיליון חודשי')
    }
  }

  /**
   * ייצוא נסיעות ל-Google Sheets
   */
  async exportRides(
    exportRequest: GoogleSheetsExportRequest,
    exportedBy: string
  ): Promise<GoogleSheetsExportResponse> {
    try {
      const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID
      
      if (!spreadsheetId) {
        throw new GoogleSheetsInvalidCredentialsError('מזהה Google Sheets לא הוגדר')
      }

      // קבלת נסיעות לייצוא
      const rides = await this.getRidesForExport(exportRequest)
      
      if (rides.length === 0) {
        return {
          success: true,
          message: 'אין נסיעות לייצוא',
          exportedCount: 0,
        }
      }

      // יצירת גיליון חודשי
      const currentDate = new Date()
      const year = currentDate.getFullYear()
      const month = currentDate.getMonth() + 1
      
      const sheetName = await this.createMonthlySheet(spreadsheetId, year, month)

      // הכנת נתונים לייצוא
      const exportData = rides.map(ride => {
        const scheduledDate = new Date(ride.scheduledDate)
        const formattedDate = scheduledDate.toLocaleDateString('he-IL')
        
        return [
          formattedDate,
          ride.task,
          ride.invoiceNumber || '',
          ride.estimatedFare || 0,
          ride.estimatedFare || 0, // סה"כ זהה למחיר
        ]
      })

      // מציאת השורה הבאה הפנויה
      const range = `${sheetName}!A:E`
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId,
        range,
      })

      const nextRow = (response.data.values?.length || 1) + 1

      // הוספת הנתונים
      await this.sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetName}!A${nextRow}:E${nextRow + exportData.length - 1}`,
        valueInputOption: 'RAW',
        resource: {
          values: exportData,
        },
      })

      // רישום הייצוא במסד הנתונים
      await prisma.googleSheetsExport.create({
        data: {
          spreadsheetId,
          sheetName,
          exportedBy,
          rideIds: rides.map(ride => ride.id),
          status: 'completed',
        },
      })

      return {
        success: true,
        message: `ייצוא הושלם בהצלחה - ${rides.length} נסיעות`,
        exportedCount: rides.length,
        spreadsheetId,
        sheetName,
      }
    } catch (error) {
      console.error('Error exporting to Google Sheets:', error)
      
      if (error instanceof GoogleSheetsConnectionError || 
          error instanceof GoogleSheetsInvalidCredentialsError) {
        throw error
      }
      
      throw new GoogleSheetsExportError('שגיאה בייצוא ל-Google Sheets')
    }
  }

  /**
   * קבלת נסיעות לייצוא
   */
  private async getRidesForExport(request: GoogleSheetsExportRequest): Promise<Ride[]> {
    const where: any = {
      status: RideStatus.COMPLETED, // רק נסיעות שהושלמו
    }

    if (request.rideIds && request.rideIds.length > 0) {
      where.id = { in: request.rideIds }
    }

    if (request.dateFrom || request.dateTo) {
      where.scheduledDate = {}
      if (request.dateFrom) {
        where.scheduledDate.gte = new Date(request.dateFrom)
      }
      if (request.dateTo) {
        where.scheduledDate.lte = new Date(request.dateTo)
      }
    }

    if (request.driverId) {
      where.driverId = request.driverId
    }

    if (request.clientId) {
      where.clientId = request.clientId
    }

    if (request.status) {
      where.status = request.status
    }

    return await prisma.ride.findMany({
      where,
      include: {
        driver: true,
        client: true,
      },
      orderBy: {
        scheduledDate: 'desc',
      },
    })
  }

  /**
   * ייצוא אוטומטי של נסיעות שהושלמו
   */
  async autoExportCompletedRides(): Promise<void> {
    try {
      const autoSyncEnabled = await this.getSystemSetting('auto_sync_enabled')
      
      if (autoSyncEnabled !== 'true') {
        return
      }

      // קבלת נסיעות שהושלמו היום שעדיין לא יוצאו
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      const completedRides = await prisma.ride.findMany({
        where: {
          status: RideStatus.COMPLETED,
          updatedAt: {
            gte: today,
            lt: tomorrow,
          },
          // בדיקה שהנסיעה לא יוצאה כבר היום
          NOT: {
            googleSheetsExports: {
              some: {
                exportedAt: {
                  gte: today,
                },
              },
            },
          },
        },
      })

      if (completedRides.length > 0) {
        await this.exportRides(
          {
            rideIds: completedRides.map(ride => ride.id),
          },
          'system'
        )
      }
    } catch (error) {
      console.error('Error in auto export:', error)
      // לא לזרוק שגיאה כדי לא להפריע לפעולה המקורית
    }
  }

  /**
   * קבלת הגדרת מערכת
   */
  private async getSystemSetting(key: string): Promise<string> {
    const setting = await prisma.systemSettings.findUnique({
      where: { key },
    })
    return setting?.value || ''
  }

  /**
   * בדיקת חיבור ל-Google Sheets
   */
  async testConnection(): Promise<boolean> {
    try {
      const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID
      
      if (!spreadsheetId) {
        return false
      }

      await this.sheets.spreadsheets.get({
        spreadsheetId,
      })

      return true
    } catch (error) {
      console.error('Google Sheets connection test failed:', error)
      return false
    }
  }

  /**
   * קבלת היסטוריית ייצוא
   */
  async getExportHistory(limit: number = 50) {
    return await prisma.googleSheetsExport.findMany({
      take: limit,
      orderBy: {
        exportedAt: 'desc',
      },
      include: {
        exportedByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    })
  }

  /**
   * עדכון הגדרות Google Sheets
   */
  async updateSettings(settings: {
    spreadsheetId?: string
    autoSyncEnabled?: boolean
  }) {
    const updates = []

    if (settings.spreadsheetId !== undefined) {
      updates.push(
        prisma.systemSettings.upsert({
          where: { key: 'google_sheets_spreadsheet_id' },
          update: { value: settings.spreadsheetId },
          create: { key: 'google_sheets_spreadsheet_id', value: settings.spreadsheetId, type: 'string' },
        })
      )
    }

    if (settings.autoSyncEnabled !== undefined) {
      updates.push(
        prisma.systemSettings.upsert({
          where: { key: 'auto_sync_enabled' },
          update: { value: settings.autoSyncEnabled.toString() },
          create: { key: 'auto_sync_enabled', value: settings.autoSyncEnabled.toString(), type: 'boolean' },
        })
      )
    }

    await Promise.all(updates)
  }

  /**
   * קבלת הגדרות Google Sheets
   */
  async getSettings() {
    const settings = await prisma.systemSettings.findMany({
      where: {
        key: {
          in: ['google_sheets_spreadsheet_id', 'auto_sync_enabled'],
        },
      },
    })

    const settingsMap = settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value
      return acc
    }, {} as Record<string, string>)

    return {
      spreadsheetId: settingsMap.google_sheets_spreadsheet_id || '',
      autoSyncEnabled: settingsMap.auto_sync_enabled === 'true',
    }
  }
}
