import { User, UserRole, Ride, RideStatus, Permission, Notification, AuditLog } from '@prisma/client'

// טיפוסי משתמש
export interface UserWithPermissions extends User {
  permissions: {
    permission: Permission
    granted: boolean
  }[]
}

export interface CreateUserRequest {
  email: string
  password: string
  firstName: string
  lastName: string
  phone?: string
  role: UserRole
  permissions?: string[]
}

export interface UpdateUserRequest {
  email?: string
  firstName?: string
  lastName?: string
  phone?: string
  role?: UserRole
  isActive?: boolean
  permissions?: string[]
}

// טיפוסי נסיעה
export interface CreateRideRequest {
  task: string
  pickupAddress: string
  dropoffAddress: string
  scheduledDate: Date
  estimatedFare?: number
  invoiceNumber?: string
  notes?: string
  patientDetails?: string
  clientId?: string
  driverId?: string
}

export interface UpdateRideRequest {
  task?: string
  pickupAddress?: string
  dropoffAddress?: string
  scheduledDate?: Date
  estimatedFare?: number
  invoiceNumber?: string
  notes?: string
  patientDetails?: string
  clientId?: string
  driverId?: string
  status?: RideStatus
}

export interface RideWithDetails extends Ride {
  client?: User
  driver?: User
  createdBy: User
  statusHistory: {
    status: RideStatus
    timestamp: Date
    notes?: string
    changedBy?: string
  }[]
}

// טיפוסי אימות
export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  user: UserWithPermissions
  accessToken: string
  refreshToken: string
}

export interface RefreshTokenRequest {
  refreshToken: string
}

// טיפוסי הרשאות
export interface PermissionCheck {
  resource: string
  action: string
}

export interface UserPermissions {
  [key: string]: boolean
}

// טיפוסי Google Sheets
export interface GoogleSheetsExportRequest {
  rideIds?: string[]
  dateFrom?: Date
  dateTo?: Date
  driverId?: string
  clientId?: string
  status?: RideStatus
}

export interface GoogleSheetsExportResponse {
  success: boolean
  message: string
  exportedCount?: number
  spreadsheetId?: string
  sheetName?: string
}

// טיפוסי דוחות
export interface ReportRequest {
  dateFrom: Date
  dateTo: Date
  driverId?: string
  clientId?: string
  status?: RideStatus
}

export interface RideReport {
  totalRides: number
  completedRides: number
  cancelledRides: number
  totalRevenue: number
  averageFare: number
  ridesByDriver: {
    driverId: string
    driverName: string
    rideCount: number
    revenue: number
  }[]
  ridesByClient: {
    clientId: string
    clientName: string
    rideCount: number
    revenue: number
  }[]
  ridesByDate: {
    date: string
    rideCount: number
    revenue: number
  }[]
}

// טיפוסי התראות
export interface CreateNotificationRequest {
  title: string
  message: string
  type: string
  userId: string
  rideId?: string
}

export interface NotificationWithDetails extends Notification {
  user: User
  ride?: Ride
}

// טיפוסי הגדרות מערכת
export interface SystemSetting {
  key: string
  value: string
  type: 'string' | 'number' | 'boolean' | 'json'
}

export interface UpdateSystemSettingsRequest {
  settings: {
    key: string
    value: string
  }[]
}

// טיפוסי API
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// טיפוסי פילטרים
export interface RideFilters {
  dateFrom?: Date
  dateTo?: Date
  driverId?: string
  clientId?: string
  status?: RideStatus
  invoiceNumber?: string
  page?: number
  limit?: number
}

export interface UserFilters {
  role?: UserRole
  isActive?: boolean
  search?: string
  page?: number
  limit?: number
}

// טיפוסי לוח שנה
export interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  status: RideStatus
  driverName?: string
  clientName?: string
  color: string
}

// טיפוסי סטטיסטיקות
export interface DashboardStats {
  totalRides: number
  pendingRides: number
  completedRides: number
  totalRevenue: number
  activeDrivers: number
  activeClients: number
  todayRides: number
  weeklyRides: number
  monthlyRides: number
}

// טיפוסי WebSocket
export interface WebSocketMessage {
  type: string
  data: any
  timestamp: Date
}

export interface RideStatusUpdate {
  rideId: string
  status: RideStatus
  driverId?: string
  notes?: string
}

// טיפוסי שגיאות
export interface AppError extends Error {
  statusCode: number
  isOperational: boolean
}

// טיפוסי JWT
export interface JwtPayload {
  userId: string
  email: string
  role: UserRole
  iat: number
  exp: number
}

export interface RefreshTokenPayload {
  userId: string
  tokenId: string
  iat: number
  exp: number
}
