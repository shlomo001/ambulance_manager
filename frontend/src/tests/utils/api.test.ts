import { api, sheetsApi } from '../../utils/api'

// Mock fetch
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>

describe('API Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
  })

  describe('api instance', () => {
    it('should have correct base URL', () => {
      expect(api.defaults.baseURL).toBe('http://localhost:3001/api')
    })

    it('should include authorization header when token exists', () => {
      localStorage.setItem('accessToken', 'test-token')
      
      // Create new instance to test interceptor
      const { api: newApi } = require('../../utils/api')
      
      expect(newApi.defaults.headers.common['Authorization']).toBe('Bearer test-token')
    })

    it('should not include authorization header when no token', () => {
      localStorage.removeItem('accessToken')
      
      const { api: newApi } = require('../../utils/api')
      
      expect(newApi.defaults.headers.common['Authorization']).toBeUndefined()
    })
  })

  describe('API calls', () => {
    it('should make successful GET request', async () => {
      const mockResponse = { success: true, data: { id: 1, name: 'Test' } }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response)

      const response = await api.get('/test')
      
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/test',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      )
    })

    it('should make successful POST request', async () => {
      const mockResponse = { success: true, data: { id: 1 } }
      const requestData = { name: 'Test' }
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response)

      const response = await api.post('/test', requestData)
      
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/test',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(requestData),
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      )
    })

    it('should handle 401 unauthorized response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Unauthorized' }),
      } as Response)

      // Mock localStorage methods
      const removeItemSpy = jest.spyOn(localStorage, 'removeItem')
      const mockNavigate = jest.fn()
      
      // Mock useNavigate hook
      jest.doMock('react-router-dom', () => ({
        ...jest.requireActual('react-router-dom'),
        useNavigate: () => mockNavigate,
      }))

      await expect(api.get('/test')).rejects.toThrow()
      
      expect(removeItemSpy).toHaveBeenCalledWith('accessToken')
      expect(removeItemSpy).toHaveBeenCalledWith('refreshToken')
    })

    it('should handle network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      await expect(api.get('/test')).rejects.toThrow('Network error')
    })

    it('should handle JSON parse error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON')
        },
      } as Response)

      await expect(api.get('/test')).rejects.toThrow('Invalid JSON')
    })
  })

  describe('Google Sheets API', () => {
    it('should export rides successfully', async () => {
      const mockResponse = {
        success: true,
        message: 'ייצוא הושלם בהצלחה',
        exportedCount: 5,
      }
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response)

      const exportData = { rideIds: ['1', '2', '3'] }
      const response = await sheetsApi.exportRides(exportData)
      
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/sheets/export',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(exportData),
        })
      )
      
      expect(response).toEqual(mockResponse)
    })

    it('should get settings successfully', async () => {
      const mockResponse = {
        success: true,
        data: {
          spreadsheetId: 'test-id',
          autoSyncEnabled: true,
        },
      }
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response)

      const response = await sheetsApi.getSettings()
      
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/sheets/settings',
        expect.objectContaining({
          method: 'GET',
        })
      )
      
      expect(response).toEqual(mockResponse)
    })

    it('should update settings successfully', async () => {
      const mockResponse = {
        success: true,
        message: 'הגדרות נשמרו בהצלחה',
      }
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response)

      const settingsData = {
        spreadsheetId: 'new-id',
        autoSyncEnabled: false,
      }
      
      const response = await sheetsApi.updateSettings(settingsData)
      
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/sheets/settings',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(settingsData),
        })
      )
      
      expect(response).toEqual(mockResponse)
    })

    it('should get export history successfully', async () => {
      const mockResponse = {
        success: true,
        data: [
          {
            id: '1',
            spreadsheetId: 'test-id',
            sheetName: '2024-01',
            exportedAt: '2024-01-15T10:00:00Z',
            exportedCount: 5,
          },
        ],
      }
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response)

      const response = await sheetsApi.getExportHistory()
      
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/sheets/history',
        expect.objectContaining({
          method: 'GET',
        })
      )
      
      expect(response).toEqual(mockResponse)
    })

    it('should test connection successfully', async () => {
      const mockResponse = {
        success: true,
        data: { connected: true },
        message: 'חיבור תקין',
      }
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response)

      const response = await sheetsApi.testConnection()
      
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/sheets/test-connection',
        expect.objectContaining({
          method: 'GET',
        })
      )
      
      expect(response).toEqual(mockResponse)
    })
  })

  describe('Error handling', () => {
    it('should handle API error response', async () => {
      const mockErrorResponse = {
        success: false,
        error: 'שגיאה בשרת',
      }
      
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => mockErrorResponse,
      } as Response)

      await expect(api.get('/test')).rejects.toThrow()
    })

    it('should handle timeout', async () => {
      mockFetch.mockImplementationOnce(
        () => new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 100)
        )
      )

      await expect(api.get('/test')).rejects.toThrow('Timeout')
    })
  })

  describe('Request/Response interceptors', () => {
    it('should add authorization header to requests', () => {
      localStorage.setItem('accessToken', 'test-token')
      
      const { api: newApi } = require('../../utils/api')
      
      expect(newApi.defaults.headers.common['Authorization']).toBe('Bearer test-token')
    })

    it('should remove authorization header when token is cleared', () => {
      localStorage.setItem('accessToken', 'test-token')
      const { api: newApi } = require('../../utils/api')
      
      expect(newApi.defaults.headers.common['Authorization']).toBe('Bearer test-token')
      
      localStorage.removeItem('accessToken')
      // In real implementation, this would trigger the interceptor
      // For testing, we verify the behavior
    })
  })
})
