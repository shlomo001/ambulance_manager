import { UserRole, RideStatus, NotificationType } from '@prisma/client'

// הרשאות במערכת
export const PERMISSIONS = {
  // הרשאות משתמשים
  USERS_CREATE: 'users.create',
  USERS_READ: 'users.read',
  USERS_UPDATE: 'users.update',
  USERS_DELETE: 'users.delete',
  
  // הרשאות נסיעות
  RIDES_CREATE: 'rides.create',
  RIDES_READ: 'rides.read',
  RIDES_UPDATE: 'rides.update',
  RIDES_DELETE: 'rides.delete',
  RIDES_ASSIGN: 'rides.assign',
  RIDES_APPROVE: 'rides.approve',
  
  // הרשאות דוחות
  REPORTS_READ: 'reports.read',
  REPORTS_EXPORT: 'reports.export',
  
  // הרשאות Google Sheets
  SHEETS_EXPORT: 'sheets.export',
  SHEETS_SETTINGS: 'sheets.settings',
  
  // הרשאות מערכת
  SYSTEM_SETTINGS: 'system.settings',
  SYSTEM_AUDIT: 'system.audit',
} as const

// הרשאות ברירת מחדל לפי תפקיד
export const DEFAULT_PERMISSIONS: Record<UserRole, string[]> = {
  [UserRole.SUPER_ADMIN]: Object.values(PERMISSIONS),
  [UserRole.SUB_ADMIN]: [
    PERMISSIONS.USERS_CREATE,
    PERMISSIONS.USERS_READ,
    PERMISSIONS.USERS_UPDATE,
    PERMISSIONS.RIDES_CREATE,
    PERMISSIONS.RIDES_READ,
    PERMISSIONS.RIDES_UPDATE,
    PERMISSIONS.RIDES_ASSIGN,
    PERMISSIONS.RIDES_APPROVE,
    PERMISSIONS.REPORTS_READ,
    PERMISSIONS.REPORTS_EXPORT,
    PERMISSIONS.SHEETS_EXPORT,
  ],
  [UserRole.ADMIN]: [
    PERMISSIONS.USERS_CREATE,
    PERMISSIONS.USERS_READ,
    PERMISSIONS.USERS_UPDATE,
    PERMISSIONS.RIDES_CREATE,
    PERMISSIONS.RIDES_READ,
    PERMISSIONS.RIDES_UPDATE,
    PERMISSIONS.RIDES_ASSIGN,
    PERMISSIONS.REPORTS_READ,
    PERMISSIONS.SHEETS_EXPORT,
  ],
  [UserRole.DRIVER]: [
    PERMISSIONS.RIDES_READ,
    PERMISSIONS.RIDES_UPDATE,
  ],
  [UserRole.INSTITUTIONAL_CLIENT]: [
    PERMISSIONS.RIDES_CREATE,
    PERMISSIONS.RIDES_READ,
  ],
}

// סטטוסי נסיעה עם תיאורים בעברית
export const RIDE_STATUS_LABELS: Record<RideStatus, string> = {
  [RideStatus.PENDING]: 'ממתין לאישור',
  [RideStatus.ASSIGNED]: 'הוקצה לנהג',
  [RideStatus.ACCEPTED]: 'נהג קיבל',
  [RideStatus.ON_THE_WAY]: 'בדרך',
  [RideStatus.COMPLETED]: 'הושלם',
  [RideStatus.CANCELLED]: 'בוטל',
  [RideStatus.DECLINED_BY_DRIVER]: 'נהג דחה',
}

// צבעים לסטטוסי נסיעה
export const RIDE_STATUS_COLORS: Record<RideStatus, string> = {
  [RideStatus.PENDING]: '#f59e0b', // צהוב
  [RideStatus.ASSIGNED]: '#3b82f6', // כחול
  [RideStatus.ACCEPTED]: '#10b981', // ירוק
  [RideStatus.ON_THE_WAY]: '#8b5cf6', // סגול
  [RideStatus.COMPLETED]: '#059669', // ירוק כהה
  [RideStatus.CANCELLED]: '#ef4444', // אדום
  [RideStatus.DECLINED_BY_DRIVER]: '#dc2626', // אדום כהה
}

// תפקידי משתמש עם תיאורים בעברית
export const USER_ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.SUPER_ADMIN]: 'מנהל על',
  [UserRole.SUB_ADMIN]: 'סגן מנהל',
  [UserRole.ADMIN]: 'מנהל',
  [UserRole.DRIVER]: 'נהג',
  [UserRole.INSTITUTIONAL_CLIENT]: 'לקוח מוסדי',
}

// סוגי התראות עם תיאורים בעברית
export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  [NotificationType.RIDE_ASSIGNED]: 'נסיעה הוקצתה',
  [NotificationType.RIDE_ACCEPTED]: 'נסיעה אושרה',
  [NotificationType.RIDE_DECLINED]: 'נסיעה נדחתה',
  [NotificationType.RIDE_COMPLETED]: 'נסיעה הושלמה',
  [NotificationType.RIDE_CANCELLED]: 'נסיעה בוטלה',
  [NotificationType.DRIVER_DECLINED]: 'נהג דחה נסיעה',
  [NotificationType.SYSTEM_ALERT]: 'התראת מערכת',
}

// הגדרות מערכת ברירת מחדל
export const DEFAULT_SYSTEM_SETTINGS = {
  GOOGLE_SHEETS_SPREADSHEET_ID: '',
  AUTO_SYNC_ENABLED: 'false',
  DEFAULT_TIMEZONE: 'Asia/Jerusalem',
  BUSINESS_CURRENCY: '₪',
  ACCEPTANCE_TIMEOUT_MINUTES: '30',
  COMPANY_NAME: 'אמבולנסים פרטיים בע"מ',
  COMPANY_PHONE: '03-1234567',
  COMPANY_EMAIL: 'info@ambulance.com',
} as const

// הגדרות JWT
export const JWT_CONFIG = {
  ACCESS_TOKEN_EXPIRES_IN: '15m',
  REFRESH_TOKEN_EXPIRES_IN: '7d',
  ALGORITHM: 'HS256',
} as const

// הגדרות Rate Limiting
export const RATE_LIMIT_CONFIG = {
  WINDOW_MS: 15 * 60 * 1000, // 15 דקות
  MAX_REQUESTS: 100, // 100 בקשות בחלון זמן
  LOGIN_MAX_REQUESTS: 5, // 5 ניסיונות התחברות
  LOGIN_WINDOW_MS: 15 * 60 * 1000, // 15 דקות
} as const

// הגדרות Google Sheets
export const GOOGLE_SHEETS_CONFIG = {
  SCOPES: ['https://www.googleapis.com/auth/spreadsheets'],
  SHEET_HEADERS: {
    DATE: 'תאריך',
    TASK: 'משימה',
    INVOICE_NUMBER: 'מספר חשבונית',
    PRICE: 'מחיר',
    TOTAL: 'סה"כ',
  },
  DATE_FORMAT: 'DD/MM/YYYY',
  CURRENCY_FORMAT: '₪#,##0.00',
} as const

// הגדרות PWA
export const PWA_CONFIG = {
  NAME: 'מערכת ניהול אמבולנסים',
  SHORT_NAME: 'אמבולנסים',
  DESCRIPTION: 'מערכת ניהול אמבולנסים פרטית',
  THEME_COLOR: '#1f2937',
  BACKGROUND_COLOR: '#ffffff',
  DISPLAY: 'standalone',
  ORIENTATION: 'portrait',
} as const

// הודעות שגיאה
export const ERROR_MESSAGES = {
  // אימות
  INVALID_CREDENTIALS: 'פרטי התחברות לא תקינים',
  TOKEN_EXPIRED: 'טוקן פג תוקף',
  TOKEN_INVALID: 'טוקן לא תקין',
  ACCESS_DENIED: 'אין הרשאה לגשת למשאב זה',
  
  // משתמשים
  USER_NOT_FOUND: 'משתמש לא נמצא',
  USER_ALREADY_EXISTS: 'משתמש כבר קיים',
  USER_INACTIVE: 'משתמש לא פעיל',
  
  // נסיעות
  RIDE_NOT_FOUND: 'נסיעה לא נמצאה',
  RIDE_ALREADY_ASSIGNED: 'נסיעה כבר הוקצתה',
  RIDE_CANNOT_BE_MODIFIED: 'לא ניתן לשנות נסיעה במצב זה',
  
  // Google Sheets
  SHEETS_CONNECTION_FAILED: 'חיבור ל-Google Sheets נכשל',
  SHEETS_EXPORT_FAILED: 'ייצוא ל-Google Sheets נכשל',
  SHEETS_INVALID_CREDENTIALS: 'פרטי Google Sheets לא תקינים',
  
  // כללי
  VALIDATION_ERROR: 'שגיאת אימות נתונים',
  INTERNAL_SERVER_ERROR: 'שגיאה פנימית בשרת',
  NETWORK_ERROR: 'שגיאת רשת',
} as const

// הודעות הצלחה
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'התחברות בוצעה בהצלחה',
  LOGOUT_SUCCESS: 'התנתקות בוצעה בהצלחה',
  USER_CREATED: 'משתמש נוצר בהצלחה',
  USER_UPDATED: 'משתמש עודכן בהצלחה',
  USER_DELETED: 'משתמש נמחק בהצלחה',
  RIDE_CREATED: 'נסיעה נוצרה בהצלחה',
  RIDE_UPDATED: 'נסיעה עודכנה בהצלחה',
  RIDE_DELETED: 'נסיעה נמחקה בהצלחה',
  RIDE_ASSIGNED: 'נסיעה הוקצתה בהצלחה',
  RIDE_COMPLETED: 'נסיעה הושלמה בהצלחה',
  SHEETS_EXPORT_SUCCESS: 'ייצוא ל-Google Sheets בוצע בהצלחה',
  SETTINGS_UPDATED: 'הגדרות עודכנו בהצלחה',
} as const

// הגדרות מסד נתונים
export const DATABASE_CONFIG = {
  CONNECTION_TIMEOUT: 30000, // 30 שניות
  QUERY_TIMEOUT: 10000, // 10 שניות
  MAX_CONNECTIONS: 10,
} as const

// הגדרות קבצים
export const FILE_CONFIG = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
  UPLOAD_PATH: 'uploads/',
} as const

// הגדרות התראות
export const NOTIFICATION_CONFIG = {
  PUSH_ENABLED: true,
  EMAIL_ENABLED: false,
  SMS_ENABLED: false,
  RETENTION_DAYS: 30,
} as const
