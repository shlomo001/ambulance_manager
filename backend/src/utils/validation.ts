import Joi from 'joi'
import { UserRole, RideStatus } from '@prisma/client'

// סכמות אימות למשתמשים
export const createUserSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'כתובת אימייל לא תקינה',
    'any.required': 'כתובת אימייל נדרשת'
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'סיסמה חייבת להכיל לפחות 6 תווים',
    'any.required': 'סיסמה נדרשת'
  }),
  firstName: Joi.string().min(2).max(50).required().messages({
    'string.min': 'שם פרטי חייב להכיל לפחות 2 תווים',
    'string.max': 'שם פרטי לא יכול להכיל יותר מ-50 תווים',
    'any.required': 'שם פרטי נדרש'
  }),
  lastName: Joi.string().min(2).max(50).required().messages({
    'string.min': 'שם משפחה חייב להכיל לפחות 2 תווים',
    'string.max': 'שם משפחה לא יכול להכיל יותר מ-50 תווים',
    'any.required': 'שם משפחה נדרש'
  }),
  phone: Joi.string().pattern(/^[0-9-+\s()]+$/).optional().messages({
    'string.pattern.base': 'מספר טלפון לא תקין'
  }),
  role: Joi.string().valid(...Object.values(UserRole)).required().messages({
    'any.only': 'תפקיד לא תקין',
    'any.required': 'תפקיד נדרש'
  }),
  permissions: Joi.array().items(Joi.string()).optional()
})

export const updateUserSchema = Joi.object({
  email: Joi.string().email().optional(),
  firstName: Joi.string().min(2).max(50).optional(),
  lastName: Joi.string().min(2).max(50).optional(),
  phone: Joi.string().pattern(/^[0-9-+\s()]+$/).optional(),
  role: Joi.string().valid(...Object.values(UserRole)).optional(),
  isActive: Joi.boolean().optional(),
  permissions: Joi.array().items(Joi.string()).optional()
})

// סכמות אימות לנסיעות
export const createRideSchema = Joi.object({
  task: Joi.string().min(5).max(200).required().messages({
    'string.min': 'משימה חייבת להכיל לפחות 5 תווים',
    'string.max': 'משימה לא יכולה להכיל יותר מ-200 תווים',
    'any.required': 'משימה נדרשת'
  }),
  pickupAddress: Joi.string().min(5).max(200).required().messages({
    'string.min': 'כתובת איסוף חייבת להכיל לפחות 5 תווים',
    'string.max': 'כתובת איסוף לא יכולה להכיל יותר מ-200 תווים',
    'any.required': 'כתובת איסוף נדרשת'
  }),
  dropoffAddress: Joi.string().min(5).max(200).required().messages({
    'string.min': 'כתובת יעד חייבת להכיל לפחות 5 תווים',
    'string.max': 'כתובת יעד לא יכולה להכיל יותר מ-200 תווים',
    'any.required': 'כתובת יעד נדרשת'
  }),
  scheduledDate: Joi.date().min('now').required().messages({
    'date.min': 'תאריך נסיעה חייב להיות בעתיד',
    'any.required': 'תאריך נסיעה נדרש'
  }),
  estimatedFare: Joi.number().min(0).optional().messages({
    'number.min': 'מחיר משוער לא יכול להיות שלילי'
  }),
  invoiceNumber: Joi.string().max(50).optional().messages({
    'string.max': 'מספר חשבונית לא יכול להכיל יותר מ-50 תווים'
  }),
  notes: Joi.string().max(500).optional().messages({
    'string.max': 'הערות לא יכולות להכיל יותר מ-500 תווים'
  }),
  patientDetails: Joi.string().max(1000).optional().messages({
    'string.max': 'פרטי חולה לא יכולים להכיל יותר מ-1000 תווים'
  }),
  clientId: Joi.string().optional(),
  driverId: Joi.string().optional()
})

export const updateRideSchema = Joi.object({
  task: Joi.string().min(5).max(200).optional(),
  pickupAddress: Joi.string().min(5).max(200).optional(),
  dropoffAddress: Joi.string().min(5).max(200).optional(),
  scheduledDate: Joi.date().min('now').optional(),
  estimatedFare: Joi.number().min(0).optional(),
  invoiceNumber: Joi.string().max(50).optional(),
  notes: Joi.string().max(500).optional(),
  patientDetails: Joi.string().max(1000).optional(),
  clientId: Joi.string().optional(),
  driverId: Joi.string().optional(),
  status: Joi.string().valid(...Object.values(RideStatus)).optional()
})

// סכמות אימות לאימות
export const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'כתובת אימייל לא תקינה',
    'any.required': 'כתובת אימייל נדרשת'
  }),
  password: Joi.string().required().messages({
    'any.required': 'סיסמה נדרשת'
  })
})

export const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required().messages({
    'any.required': 'טוקן רענון נדרש'
  })
})

// סכמות אימות ל-Google Sheets
export const googleSheetsExportSchema = Joi.object({
  rideIds: Joi.array().items(Joi.string()).optional(),
  dateFrom: Joi.date().optional(),
  dateTo: Joi.date().optional(),
  driverId: Joi.string().optional(),
  clientId: Joi.string().optional(),
  status: Joi.string().valid(...Object.values(RideStatus)).optional()
})

// סכמות אימות לדוחות
export const reportSchema = Joi.object({
  dateFrom: Joi.date().required().messages({
    'any.required': 'תאריך התחלה נדרש'
  }),
  dateTo: Joi.date().min(Joi.ref('dateFrom')).required().messages({
    'any.required': 'תאריך סיום נדרש',
    'date.min': 'תאריך סיום חייב להיות אחרי תאריך התחלה'
  }),
  driverId: Joi.string().optional(),
  clientId: Joi.string().optional(),
  status: Joi.string().valid(...Object.values(RideStatus)).optional()
})

// סכמות אימות להתראות
export const createNotificationSchema = Joi.object({
  title: Joi.string().min(1).max(100).required().messages({
    'string.min': 'כותרת חייבת להכיל לפחות תו אחד',
    'string.max': 'כותרת לא יכולה להכיל יותר מ-100 תווים',
    'any.required': 'כותרת נדרשת'
  }),
  message: Joi.string().min(1).max(500).required().messages({
    'string.min': 'הודעה חייבת להכיל לפחות תו אחד',
    'string.max': 'הודעה לא יכולה להכיל יותר מ-500 תווים',
    'any.required': 'הודעה נדרשת'
  }),
  type: Joi.string().valid(
    'RIDE_ASSIGNED',
    'RIDE_ACCEPTED',
    'RIDE_DECLINED',
    'RIDE_COMPLETED',
    'RIDE_CANCELLED',
    'DRIVER_DECLINED',
    'SYSTEM_ALERT'
  ).required().messages({
    'any.only': 'סוג התראה לא תקין',
    'any.required': 'סוג התראה נדרש'
  }),
  userId: Joi.string().required().messages({
    'any.required': 'מזהה משתמש נדרש'
  }),
  rideId: Joi.string().optional()
})

// סכמות אימות להגדרות מערכת
export const updateSystemSettingsSchema = Joi.object({
  settings: Joi.array().items(
    Joi.object({
      key: Joi.string().required(),
      value: Joi.string().required()
    })
  ).required()
})

// סכמות אימות לפילטרים
export const rideFiltersSchema = Joi.object({
  dateFrom: Joi.date().optional(),
  dateTo: Joi.date().min(Joi.ref('dateFrom')).optional(),
  driverId: Joi.string().optional(),
  clientId: Joi.string().optional(),
  status: Joi.string().valid(...Object.values(RideStatus)).optional(),
  invoiceNumber: Joi.string().optional(),
  page: Joi.number().min(1).default(1),
  limit: Joi.number().min(1).max(100).default(10)
})

export const userFiltersSchema = Joi.object({
  role: Joi.string().valid(...Object.values(UserRole)).optional(),
  isActive: Joi.boolean().optional(),
  search: Joi.string().optional(),
  page: Joi.number().min(1).default(1),
  limit: Joi.number().min(1).max(100).default(10)
})

// פונקציה לאימות נתונים
export function validateData<T>(schema: Joi.ObjectSchema, data: any): T {
  const { error, value } = schema.validate(data, {
    abortEarly: false,
    stripUnknown: true
  })

  if (error) {
    const errorMessages = error.details.map(detail => detail.message).join(', ')
    throw new Error(`Validation error: ${errorMessages}`)
  }

  return value
}

// פונקציה לאימות מזהה
export function validateId(id: string): boolean {
  return Joi.string().required().validate(id).error === undefined
}

// פונקציה לאימות כתובת אימייל
export function validateEmail(email: string): boolean {
  return Joi.string().email().validate(email).error === undefined
}

// פונקציה לאימות מספר טלפון ישראלי
export function validateIsraeliPhone(phone: string): boolean {
  const phoneRegex = /^(\+972|0)([23489]|5[012345689]|77)[0-9]{7}$/
  return phoneRegex.test(phone.replace(/[\s-]/g, ''))
}
