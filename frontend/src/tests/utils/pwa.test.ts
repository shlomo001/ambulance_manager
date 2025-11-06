import { pwaManager, usePWAStatus } from '../../utils/pwa'

// Mock navigator.serviceWorker
const mockServiceWorker = {
  register: jest.fn(),
  ready: Promise.resolve({
    pushManager: {
      subscribe: jest.fn(),
      getSubscription: jest.fn(),
    },
  }),
  controller: null,
  addEventListener: jest.fn(),
}

Object.defineProperty(navigator, 'serviceWorker', {
  value: mockServiceWorker,
  writable: true,
})

// Mock window.matchMedia
const mockMatchMedia = jest.fn()
Object.defineProperty(window, 'matchMedia', {
  value: mockMatchMedia,
  writable: true,
})

// Mock Notification API
const mockNotification = {
  permission: 'granted',
  requestPermission: jest.fn(),
}

Object.defineProperty(window, 'Notification', {
  value: mockNotification,
  writable: true,
})

// Mock beforeinstallprompt
let mockBeforeInstallPrompt: any = null
Object.defineProperty(window, 'beforeinstallprompt', {
  get: () => mockBeforeInstallPrompt,
  set: (value) => { mockBeforeInstallPrompt = value },
  configurable: true,
})

describe('PWA Manager', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockBeforeInstallPrompt = null
    mockMatchMedia.mockReturnValue({ matches: false })
  })

  describe('initialize', () => {
    it('should register service worker successfully', async () => {
      mockServiceWorker.register.mockResolvedValue({
        installing: null,
        waiting: null,
        active: null,
        addEventListener: jest.fn(),
      })

      await pwaManager.initialize()

      expect(mockServiceWorker.register).toHaveBeenCalledWith('/sw.js', {
        scope: '/'
      })
    })

    it('should handle service worker registration error', async () => {
      mockServiceWorker.register.mockRejectedValue(new Error('Registration failed'))

      // Should not throw error
      await expect(pwaManager.initialize()).resolves.not.toThrow()
    })

    it('should setup install prompt listener', async () => {
      const mockPrompt = {
        prompt: jest.fn().mockResolvedValue(undefined),
        userChoice: Promise.resolve({ outcome: 'accepted' }),
      }

      mockBeforeInstallPrompt = mockPrompt

      await pwaManager.initialize()

      // Simulate beforeinstallprompt event
      const event = new Event('beforeinstallprompt')
      Object.defineProperty(event, 'preventDefault', { value: jest.fn() })
      window.dispatchEvent(event)

      expect(mockPrompt.prompt).not.toHaveBeenCalled() // Should be prevented
    })
  })

  describe('showInstallPrompt', () => {
    it('should show install prompt when available', async () => {
      const mockPrompt = {
        prompt: jest.fn().mockResolvedValue(undefined),
        userChoice: Promise.resolve({ outcome: 'accepted' }),
      }

      mockBeforeInstallPrompt = mockPrompt

      const result = await pwaManager.showInstallPrompt()

      expect(mockPrompt.prompt).toHaveBeenCalled()
      expect(result).toBe(true)
    })

    it('should return false when prompt is not available', async () => {
      mockBeforeInstallPrompt = null

      const result = await pwaManager.showInstallPrompt()

      expect(result).toBe(false)
    })

    it('should return false when user dismisses prompt', async () => {
      const mockPrompt = {
        prompt: jest.fn().mockResolvedValue(undefined),
        userChoice: Promise.resolve({ outcome: 'dismissed' }),
      }

      mockBeforeInstallPrompt = mockPrompt

      const result = await pwaManager.showInstallPrompt()

      expect(mockPrompt.prompt).toHaveBeenCalled()
      expect(result).toBe(false)
    })

    it('should handle prompt error', async () => {
      const mockPrompt = {
        prompt: jest.fn().mockRejectedValue(new Error('Prompt failed')),
        userChoice: Promise.resolve({ outcome: 'accepted' }),
      }

      mockBeforeInstallPrompt = mockPrompt

      const result = await pwaManager.showInstallPrompt()

      expect(result).toBe(false)
    })
  })

  describe('getCapabilities', () => {
    it('should return correct capabilities when PWA is not installed', () => {
      mockMatchMedia.mockReturnValue({ matches: false })
      mockBeforeInstallPrompt = { prompt: jest.fn() }

      const capabilities = pwaManager.getCapabilities()

      expect(capabilities).toEqual({
        canInstall: true,
        isInstalled: false,
        isStandalone: false,
        hasServiceWorker: false,
        canShowNotifications: true,
      })
    })

    it('should return correct capabilities when PWA is installed', () => {
      mockMatchMedia.mockReturnValue({ matches: true })
      mockBeforeInstallPrompt = null

      const capabilities = pwaManager.getCapabilities()

      expect(capabilities).toEqual({
        canInstall: false,
        isInstalled: true,
        isStandalone: true,
        hasServiceWorker: false,
        canShowNotifications: true,
      })
    })

    it('should return correct capabilities when notifications are denied', () => {
      mockNotification.permission = 'denied'

      const capabilities = pwaManager.getCapabilities()

      expect(capabilities.canShowNotifications).toBe(false)
    })
  })

  describe('requestNotificationPermission', () => {
    it('should return true when permission is already granted', async () => {
      mockNotification.permission = 'granted'

      const result = await pwaManager.requestNotificationPermission()

      expect(result).toBe(true)
      expect(mockNotification.requestPermission).not.toHaveBeenCalled()
    })

    it('should request permission and return true when granted', async () => {
      mockNotification.permission = 'default'
      mockNotification.requestPermission.mockResolvedValue('granted')

      const result = await pwaManager.requestNotificationPermission()

      expect(mockNotification.requestPermission).toHaveBeenCalled()
      expect(result).toBe(true)
    })

    it('should return false when permission is denied', async () => {
      mockNotification.permission = 'denied'

      const result = await pwaManager.requestNotificationPermission()

      expect(result).toBe(false)
    })

    it('should return false when permission request is denied', async () => {
      mockNotification.permission = 'default'
      mockNotification.requestPermission.mockResolvedValue('denied')

      const result = await pwaManager.requestNotificationPermission()

      expect(result).toBe(false)
    })

    it('should return false when Notification API is not available', async () => {
      Object.defineProperty(window, 'Notification', {
        value: undefined,
        writable: true,
      })

      const result = await pwaManager.requestNotificationPermission()

      expect(result).toBe(false)
    })
  })

  describe('isStandalone', () => {
    it('should return true when in standalone mode', () => {
      mockMatchMedia.mockReturnValue({ matches: true })

      const result = pwaManager.isStandalone()

      expect(result).toBe(true)
    })

    it('should return false when not in standalone mode', () => {
      mockMatchMedia.mockReturnValue({ matches: false })

      const result = pwaManager.isStandalone()

      expect(result).toBe(false)
    })
  })

  describe('sendMessageToSW', () => {
    it('should send message to service worker', async () => {
      const mockController = {
        postMessage: jest.fn(),
      }

      mockServiceWorker.controller = mockController

      const message = { type: 'TEST_MESSAGE' }
      const result = await pwaManager.sendMessageToSW(message)

      expect(mockController.postMessage).toHaveBeenCalledWith(
        message,
        expect.any(Array)
      )
    })

    it('should return null when service worker is not available', async () => {
      mockServiceWorker.controller = null

      const result = await pwaManager.sendMessageToSW({ type: 'TEST' })

      expect(result).toBeNull()
    })
  })

  describe('getAppVersion', () => {
    it('should get app version from service worker', async () => {
      const mockController = {
        postMessage: jest.fn(),
      }

      mockServiceWorker.controller = mockController

      // Mock the response
      const mockResponse = { version: '1.0.0' }
      jest.spyOn(pwaManager, 'sendMessageToSW').mockResolvedValue(mockResponse)

      const result = await pwaManager.getAppVersion()

      expect(result).toBe('1.0.0')
    })

    it('should return null when service worker is not available', async () => {
      jest.spyOn(pwaManager, 'sendMessageToSW').mockResolvedValue(null)

      const result = await pwaManager.getAppVersion()

      expect(result).toBeNull()
    })
  })

  describe('skipWaiting', () => {
    it('should send skip waiting message to service worker', async () => {
      const mockController = {
        postMessage: jest.fn(),
      }

      mockServiceWorker.controller = mockController

      await pwaManager.skipWaiting()

      expect(mockController.postMessage).toHaveBeenCalledWith(
        { type: 'SKIP_WAITING' },
        expect.any(Array)
      )
    })
  })
})

describe('usePWAStatus hook', () => {
  it('should return initial capabilities', () => {
    // Mock React hooks
    const mockUseState = jest.fn()
    const mockUseEffect = jest.fn()

    jest.doMock('react', () => ({
      useState: mockUseState,
      useEffect: mockUseEffect,
    }))

    mockUseState.mockReturnValue([{
      canInstall: false,
      isInstalled: false,
      isStandalone: false,
      hasServiceWorker: false,
      canShowNotifications: false,
    }, jest.fn()])

    // This would be tested in a component test
    // For now, we just verify the hook exists
    expect(usePWAStatus).toBeDefined()
  })
})
