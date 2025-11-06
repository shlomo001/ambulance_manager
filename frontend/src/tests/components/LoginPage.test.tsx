import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from 'react-query'
import LoginPage from '../../pages/LoginPage'
import { useAuthStore } from '../../store/authStore'

// Mock the auth store
jest.mock('../../store/authStore')
const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
})

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = createTestQueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </QueryClientProvider>
  )
}

describe('LoginPage', () => {
  const mockLogin = jest.fn()
  const mockIsLoading = false

  beforeEach(() => {
    mockUseAuthStore.mockReturnValue({
      login: mockLogin,
      isLoading: mockIsLoading,
      isAuthenticated: false,
      user: null,
      logout: jest.fn(),
      checkAuth: jest.fn(),
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should render login form', () => {
    renderWithProviders(<LoginPage />)
    
    expect(screen.getByText('התחברות למערכת')).toBeInTheDocument()
    expect(screen.getByLabelText('אימייל')).toBeInTheDocument()
    expect(screen.getByLabelText('סיסמה')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'התחבר' })).toBeInTheDocument()
  })

  it('should show loading state when logging in', () => {
    mockUseAuthStore.mockReturnValue({
      login: mockLogin,
      isLoading: true,
      isAuthenticated: false,
      user: null,
      logout: jest.fn(),
      checkAuth: jest.fn(),
    })

    renderWithProviders(<LoginPage />)
    
    expect(screen.getByText('מתחבר...')).toBeInTheDocument()
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('should handle form submission with valid data', async () => {
    renderWithProviders(<LoginPage />)
    
    const emailInput = screen.getByLabelText('אימייל')
    const passwordInput = screen.getByLabelText('סיסמה')
    const submitButton = screen.getByRole('button', { name: 'התחבר' })

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123')
    })
  })

  it('should show validation errors for empty fields', async () => {
    renderWithProviders(<LoginPage />)
    
    const submitButton = screen.getByRole('button', { name: 'התחבר' })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('אימייל הוא שדה חובה')).toBeInTheDocument()
      expect(screen.getByText('סיסמה היא שדה חובה')).toBeInTheDocument()
    })

    expect(mockLogin).not.toHaveBeenCalled()
  })

  it('should show validation error for invalid email format', async () => {
    renderWithProviders(<LoginPage />)
    
    const emailInput = screen.getByLabelText('אימייל')
    const passwordInput = screen.getByLabelText('סיסמה')
    const submitButton = screen.getByRole('button', { name: 'התחבר' })

    fireEvent.change(emailInput, { target: { value: 'invalid-email' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('פורמט אימייל לא תקין')).toBeInTheDocument()
    })

    expect(mockLogin).not.toHaveBeenCalled()
  })

  it('should show validation error for short password', async () => {
    renderWithProviders(<LoginPage />)
    
    const emailInput = screen.getByLabelText('אימייל')
    const passwordInput = screen.getByLabelText('סיסמה')
    const submitButton = screen.getByRole('button', { name: 'התחבר' })

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: '123' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('סיסמה חייבת להכיל לפחות 6 תווים')).toBeInTheDocument()
    })

    expect(mockLogin).not.toHaveBeenCalled()
  })

  it('should handle login error', async () => {
    const mockLoginWithError = jest.fn().mockRejectedValue(new Error('Login failed'))
    
    mockUseAuthStore.mockReturnValue({
      login: mockLoginWithError,
      isLoading: false,
      isAuthenticated: false,
      user: null,
      logout: jest.fn(),
      checkAuth: jest.fn(),
    })

    renderWithProviders(<LoginPage />)
    
    const emailInput = screen.getByLabelText('אימייל')
    const passwordInput = screen.getByLabelText('סיסמה')
    const submitButton = screen.getByRole('button', { name: 'התחבר' })

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockLoginWithError).toHaveBeenCalledWith('test@example.com', 'password123')
    })
  })

  it('should toggle password visibility', () => {
    renderWithProviders(<LoginPage />)
    
    const passwordInput = screen.getByLabelText('סיסמה')
    const toggleButton = screen.getByRole('button', { name: /הצג סיסמה|הסתר סיסמה/ })

    // Initially password should be hidden
    expect(passwordInput).toHaveAttribute('type', 'password')

    // Click to show password
    fireEvent.click(toggleButton)
    expect(passwordInput).toHaveAttribute('type', 'text')

    // Click to hide password again
    fireEvent.click(toggleButton)
    expect(passwordInput).toHaveAttribute('type', 'password')
  })

  it('should have proper RTL direction', () => {
    renderWithProviders(<LoginPage />)
    
    const form = screen.getByRole('form')
    expect(form).toHaveAttribute('dir', 'rtl')
  })

  it('should have proper Hebrew text content', () => {
    renderWithProviders(<LoginPage />)
    
    expect(screen.getByText('מערכת ניהול אמבולנסים')).toBeInTheDocument()
    expect(screen.getByText('התחברות למערכת')).toBeInTheDocument()
    expect(screen.getByText('אימייל')).toBeInTheDocument()
    expect(screen.getByText('סיסמה')).toBeInTheDocument()
    expect(screen.getByText('התחבר')).toBeInTheDocument()
  })
})
