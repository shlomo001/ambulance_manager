import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { ApiResponse } from '../types'

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response
  },
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = localStorage.getItem('refreshToken')
        if (refreshToken) {
          const response = await axios.post(
            `${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/auth/refresh`,
            { refreshToken }
          )

          const { accessToken, user } = response.data.data
          localStorage.setItem('accessToken', accessToken)
          localStorage.setItem('user', JSON.stringify(user))

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${accessToken}`
          return api(originalRequest)
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('user')
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

// Generic API functions
export const apiClient = {
  get: async <T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
    const response = await api.get(url, config)
    return response.data
  },

  post: async <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
    const response = await api.post(url, data, config)
    return response.data
  },

  put: async <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
    const response = await api.put(url, data, config)
    return response.data
  },

  delete: async <T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
    const response = await api.delete(url, config)
    return response.data
  },

  patch: async <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
    const response = await api.patch(url, data, config)
    return response.data
  },
}

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    apiClient.post('/auth/login', { email, password }),

  logout: (refreshToken: string) =>
    apiClient.post('/auth/logout', { refreshToken }),

  logoutAll: () =>
    apiClient.post('/auth/logout-all'),

  refreshToken: (refreshToken: string) =>
    apiClient.post('/auth/refresh', { refreshToken }),

  getProfile: () =>
    apiClient.get('/auth/profile'),

  changePassword: (currentPassword: string, newPassword: string) =>
    apiClient.post('/auth/change-password', { currentPassword, newPassword }),

  resetPassword: (email: string) =>
    apiClient.post('/auth/reset-password', { email }),

  checkAuth: () =>
    apiClient.get('/auth/check'),
}

// Users API
export const usersApi = {
  getUsers: (filters?: any) =>
    apiClient.get('/users', { params: filters }),

  getUserById: (id: string) =>
    apiClient.get(`/users/${id}`),

  createUser: (userData: any) =>
    apiClient.post('/users', userData),

  updateUser: (id: string, userData: any) =>
    apiClient.put(`/users/${id}`, userData),

  deleteUser: (id: string) =>
    apiClient.delete(`/users/${id}`),

  activateUser: (id: string) =>
    apiClient.post(`/users/${id}/activate`),

  changePassword: (id: string, currentPassword: string, newPassword: string) =>
    apiClient.post(`/users/${id}/change-password`, { currentPassword, newPassword }),

  resetPassword: (id: string, newPassword: string) =>
    apiClient.post(`/users/${id}/reset-password`, { newPassword }),

  getUserPermissions: (id: string) =>
    apiClient.get(`/users/${id}/permissions`),

  updateUserPermissions: (id: string, permissions: any) =>
    apiClient.put(`/users/${id}/permissions`, { permissions }),

  getActiveDrivers: () =>
    apiClient.get('/users/drivers'),

  getActiveClients: () =>
    apiClient.get('/users/clients'),

  getUserStats: () =>
    apiClient.get('/users/stats'),

  getCurrentUser: () =>
    apiClient.get('/users/me'),

  updateCurrentUser: (userData: any) =>
    apiClient.put('/users/me', userData),

  getAllPermissions: () =>
    apiClient.get('/users/permissions'),

  getPermissionsByResource: (resource: string) =>
    apiClient.get(`/users/permissions/${resource}`),
}

// Rides API
export const ridesApi = {
  getRides: (filters?: any) =>
    apiClient.get('/rides', { params: filters }),

  getRideById: (id: string) =>
    apiClient.get(`/rides/${id}`),

  createRide: (rideData: any) =>
    apiClient.post('/rides', rideData),

  updateRide: (id: string, rideData: any) =>
    apiClient.put(`/rides/${id}`, rideData),

  updateRideStatus: (id: string, status: string, notes?: string) =>
    apiClient.put(`/rides/${id}/status`, { status, notes }),

  assignRide: (id: string, driverId: string) =>
    apiClient.post(`/rides/${id}/assign`, { driverId }),

  cancelRide: (id: string, reason: string) =>
    apiClient.post(`/rides/${id}/cancel`, { reason }),

  declineRide: (id: string, reason: string) =>
    apiClient.post(`/rides/${id}/decline`, { reason }),

  getRidesByDriver: (driverId: string, filters?: any) =>
    apiClient.get(`/rides/driver/${driverId}`, { params: filters }),

  getRidesByClient: (clientId: string, filters?: any) =>
    apiClient.get(`/rides/client/${clientId}`, { params: filters }),

  getRidesByStatus: (status: string, filters?: any) =>
    apiClient.get(`/rides/status/${status}`, { params: filters }),

  getMyRides: (filters?: any) =>
    apiClient.get('/rides/my', { params: filters }),

  getRideStats: (filters?: any) =>
    apiClient.get('/rides/stats', { params: filters }),

  getPendingRides: (filters?: any) =>
    apiClient.get('/rides/pending', { params: filters }),

  getAssignedRides: (filters?: any) =>
    apiClient.get('/rides/assigned', { params: filters }),

  getCompletedRides: (filters?: any) =>
    apiClient.get('/rides/completed', { params: filters }),
}

// Google Sheets API
export const sheetsApi = {
  exportRides: (exportData: any) =>
    apiClient.post('/sheets/export', exportData),

  getExportHistory: () =>
    apiClient.get('/sheets/history'),

  updateSettings: (settings: any) =>
    apiClient.put('/sheets/settings', settings),

  getSettings: () =>
    apiClient.get('/sheets/settings'),
}

export default api
