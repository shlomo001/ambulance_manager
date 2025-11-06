// User types
export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  phone?: string
  role: UserRole
  isActive: boolean
  createdAt: string
  updatedAt: string
  permissions?: UserPermission[]
  createdBy?: User
}

export type UserRole = 'SUPER_ADMIN' | 'SUB_ADMIN' | 'ADMIN' | 'DRIVER' | 'INSTITUTIONAL_CLIENT'

export interface UserPermission {
  id: string
  userId: string
  permissionId: string
  granted: boolean
  grantedBy?: string
  grantedAt: string
  permission: Permission
}

export interface Permission {
  id: string
  name: string
  description: string
  resource: string
  action: string
}

// Ride types
export interface Ride {
  id: string
  task: string
  pickupAddress: string
  dropoffAddress: string
  scheduledDate: string
  estimatedFare?: number
  invoiceNumber?: string
  notes?: string
  patientDetails?: string
  status: RideStatus
  createdAt: string
  updatedAt: string
  clientId?: string
  driverId?: string
  createdById: string
  client?: User
  driver?: User
  createdBy: User
  statusHistory?: RideStatusHistory[]
}

export type RideStatus = 
  | 'PENDING' 
  | 'ASSIGNED' 
  | 'ACCEPTED' 
  | 'ON_THE_WAY' 
  | 'COMPLETED' 
  | 'CANCELLED' 
  | 'DECLINED_BY_DRIVER'

export interface RideStatusHistory {
  id: string
  rideId: string
  status: RideStatus
  timestamp: string
  notes?: string
  changedBy?: string
}

// Auth types
export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  user: User
  accessToken: string
  refreshToken: string
}

export interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
}

// API types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

// Filter types
export interface UserFilters {
  role?: UserRole
  isActive?: boolean
  search?: string
  page?: number
  limit?: number
}

export interface RideFilters {
  dateFrom?: string
  dateTo?: string
  driverId?: string
  clientId?: string
  status?: RideStatus
  invoiceNumber?: string
  page?: number
  limit?: number
}

// Dashboard types
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

export interface RideStats {
  totalRides: number
  completedRides: number
  pendingRides: number
  cancelledRides: number
  totalRevenue: number
  averageFare: number
  ridesByStatus: {
    status: RideStatus
    count: number
    label: string
  }[]
  ridesByDriver: {
    driverId: string
    rideCount: number
    revenue: number
  }[]
  ridesByClient: {
    clientId: string
    rideCount: number
    revenue: number
  }[]
}

// Calendar types
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

// Notification types
export interface Notification {
  id: string
  title: string
  message: string
  type: NotificationType
  isRead: boolean
  createdAt: string
  userId: string
  rideId?: string
  user?: User
  ride?: Ride
}

export type NotificationType = 
  | 'RIDE_ASSIGNED'
  | 'RIDE_ACCEPTED'
  | 'RIDE_DECLINED'
  | 'RIDE_COMPLETED'
  | 'RIDE_CANCELLED'
  | 'DRIVER_DECLINED'
  | 'SYSTEM_ALERT'

// Google Sheets types
export interface GoogleSheetsExportRequest {
  rideIds?: string[]
  dateFrom?: string
  dateTo?: string
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

// Form types
export interface CreateUserForm {
  email: string
  password: string
  firstName: string
  lastName: string
  phone?: string
  role: UserRole
  permissions?: string[]
}

export interface UpdateUserForm {
  email?: string
  firstName?: string
  lastName?: string
  phone?: string
  role?: UserRole
  isActive?: boolean
  permissions?: string[]
}

export interface CreateRideForm {
  task: string
  pickupAddress: string
  dropoffAddress: string
  scheduledDate: string
  estimatedFare?: number
  invoiceNumber?: string
  notes?: string
  patientDetails?: string
  clientId?: string
  driverId?: string
}

export interface UpdateRideForm {
  task?: string
  pickupAddress?: string
  dropoffAddress?: string
  scheduledDate?: string
  estimatedFare?: number
  invoiceNumber?: string
  notes?: string
  patientDetails?: string
  clientId?: string
  driverId?: string
  status?: RideStatus
}

// Constants
export const RIDE_STATUS_LABELS: Record<RideStatus, string> = {
  PENDING: 'ממתין לאישור',
  ASSIGNED: 'הוקצה לנהג',
  ACCEPTED: 'נהג קיבל',
  ON_THE_WAY: 'בדרך',
  COMPLETED: 'הושלם',
  CANCELLED: 'בוטל',
  DECLINED_BY_DRIVER: 'נהג דחה',
}

export const RIDE_STATUS_COLORS: Record<RideStatus, string> = {
  PENDING: '#f59e0b',
  ASSIGNED: '#3b82f6',
  ACCEPTED: '#10b981',
  ON_THE_WAY: '#8b5cf6',
  COMPLETED: '#059669',
  CANCELLED: '#ef4444',
  DECLINED_BY_DRIVER: '#dc2626',
}

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  SUPER_ADMIN: 'מנהל על',
  SUB_ADMIN: 'סגן מנהל',
  ADMIN: 'מנהל',
  DRIVER: 'נהג',
  INSTITUTIONAL_CLIENT: 'לקוח מוסדי',
}

export const USER_ROLE_COLORS: Record<UserRole, string> = {
  SUPER_ADMIN: '#dc2626',
  SUB_ADMIN: '#ea580c',
  ADMIN: '#2563eb',
  DRIVER: '#16a34a',
  INSTITUTIONAL_CLIENT: '#9333ea',
}
