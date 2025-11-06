import { Request, Response, NextFunction } from 'express'
import { GoogleSheetsService } from '../services/googleSheetsService'
import { validateData, googleSheetsExportSchema } from '../utils/validation'
import { asyncHandler } from '../middleware/errorHandler'

export class GoogleSheetsController {
  private googleSheetsService: GoogleSheetsService

  constructor() {
    this.googleSheetsService = new GoogleSheetsService()
  }

  /**
   * ייצוא נסיעות ל-Google Sheets
   */
  exportRides = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const validatedData = validateData(googleSheetsExportSchema, req.body)
    const exportedBy = req.user!.id

    const result = await this.googleSheetsService.exportRides(validatedData, exportedBy)

    res.json({
      success: true,
      data: result,
      message: result.message
    })
  })

  /**
   * בדיקת חיבור ל-Google Sheets
   */
  testConnection = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const isConnected = await this.googleSheetsService.testConnection()

    res.json({
      success: true,
      data: { connected: isConnected },
      message: isConnected ? 'חיבור תקין' : 'חיבור נכשל'
    })
  })

  /**
   * קבלת היסטוריית ייצוא
   */
  getExportHistory = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const limit = parseInt(req.query.limit as string) || 50
    const history = await this.googleSheetsService.getExportHistory(limit)

    res.json({
      success: true,
      data: history
    })
  })

  /**
   * עדכון הגדרות Google Sheets
   */
  updateSettings = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { spreadsheetId, autoSyncEnabled } = req.body

    await this.googleSheetsService.updateSettings({
      spreadsheetId,
      autoSyncEnabled
    })

    res.json({
      success: true,
      message: 'הגדרות Google Sheets עודכנו בהצלחה'
    })
  })

  /**
   * קבלת הגדרות Google Sheets
   */
  getSettings = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const settings = await this.googleSheetsService.getSettings()

    res.json({
      success: true,
      data: settings
    })
  })

  /**
   * ייצוא אוטומטי (למנהלי מערכת)
   */
  autoExport = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    await this.googleSheetsService.autoExportCompletedRides()

    res.json({
      success: true,
      message: 'ייצוא אוטומטי הושלם'
    })
  })
}
