import '@testing-library/jest-dom'
import { configure } from '@testing-library/react'
import { TextEncoder, TextDecoder } from 'util'

// Configure testing library
configure({ testIdAttribute: 'data-testid' })

// Mock environment variables
process.env.REACT_APP_API_URL = 'http://localhost:3001'

// Mock Web APIs
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder as any

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
}

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
}

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
global.localStorage = localStorageMock as any

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
global.sessionStorage = sessionStorageMock as any

// Mock fetch
global.fetch = jest.fn()

// Mock navigator
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true,
})

// Mock service worker
Object.defineProperty(navigator, 'serviceWorker', {
  writable: true,
  value: {
    register: jest.fn().mockResolvedValue({
      installing: null,
      waiting: null,
      active: null,
      addEventListener: jest.fn(),
    }),
    ready: Promise.resolve({
      pushManager: {
        subscribe: jest.fn(),
        getSubscription: jest.fn(),
      },
    }),
    controller: null,
    addEventListener: jest.fn(),
  },
})

// Mock Notification API
Object.defineProperty(window, 'Notification', {
  writable: true,
  value: {
    permission: 'granted',
    requestPermission: jest.fn().mockResolvedValue('granted'),
  },
})

// Mock PWA install prompt
Object.defineProperty(window, 'beforeinstallprompt', {
  writable: true,
  value: {
    prompt: jest.fn().mockResolvedValue({ outcome: 'accepted' }),
    userChoice: Promise.resolve({ outcome: 'accepted' }),
  },
})

// Mock crypto for JWT
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: jest.fn(() => 'mock-uuid'),
    getRandomValues: jest.fn((arr) => arr.map(() => Math.floor(Math.random() * 256))),
  },
})

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks()
  localStorageMock.clear()
  sessionStorageMock.clear()
})
