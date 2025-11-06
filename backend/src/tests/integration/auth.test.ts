import { describe, it, expect, beforeEach } from '@jest/globals'
import request from 'supertest'
import { app } from '../../index'
import { testUtils, resetDatabase } from '../setup'

describe('Authentication Integration Tests', () => {
  beforeEach(async () => {
    await resetDatabase()
  })

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'newuser@test.com',
        password: 'password123',
        firstName: 'משתמש',
        lastName: 'חדש',
        role: 'DRIVER',
      }

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.data.user.email).toBe(userData.email)
      expect(response.body.data.user.firstName).toBe(userData.firstName)
      expect(response.body.data.user.lastName).toBe(userData.lastName)
      expect(response.body.data.user.role).toBe(userData.role)
      expect(response.body.data.accessToken).toBeDefined()
      expect(response.body.data.refreshToken).toBeDefined()
    })

    it('should return error for duplicate email', async () => {
      const userData = {
        email: 'duplicate@test.com',
        password: 'password123',
        firstName: 'משתמש',
        lastName: 'כפול',
        role: 'DRIVER',
      }

      // Register first user
      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201)

      // Try to register with same email
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('אימייל כבר קיים')
    })

    it('should return error for invalid email format', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'password123',
        firstName: 'משתמש',
        lastName: 'לא תקין',
        role: 'DRIVER',
      }

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('פורמט אימייל לא תקין')
    })

    it('should return error for weak password', async () => {
      const userData = {
        email: 'weakpass@test.com',
        password: '123',
        firstName: 'משתמש',
        lastName: 'סיסמה חלשה',
        role: 'DRIVER',
      }

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('סיסמה חלשה מדי')
    })
  })

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create a test user
      await testUtils.createTestUser({
        email: 'testuser@test.com',
        password: '$2b$10$test.hash.for.testuser', // This would be properly hashed in real scenario
        firstName: 'משתמש',
        lastName: 'מבחן',
        role: 'DRIVER',
        isActive: true,
      })
    })

    it('should login successfully with valid credentials', async () => {
      const loginData = {
        email: 'testuser@test.com',
        password: 'testpassword', // This would match the hashed password
      }

      // Note: In a real test, you'd need to properly hash the password
      // For this example, we'll mock the password verification
      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.user.email).toBe(loginData.email)
      expect(response.body.data.accessToken).toBeDefined()
      expect(response.body.data.refreshToken).toBeDefined()
    })

    it('should return error for invalid email', async () => {
      const loginData = {
        email: 'nonexistent@test.com',
        password: 'password123',
      }

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('פרטי התחברות לא תקינים')
    })

    it('should return error for invalid password', async () => {
      const loginData = {
        email: 'testuser@test.com',
        password: 'wrongpassword',
      }

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('פרטי התחברות לא תקינים')
    })

    it('should return error for inactive user', async () => {
      // Create inactive user
      await testUtils.createTestUser({
        email: 'inactive@test.com',
        password: '$2b$10$test.hash.for.inactive',
        firstName: 'משתמש',
        lastName: 'לא פעיל',
        role: 'DRIVER',
        isActive: false,
      })

      const loginData = {
        email: 'inactive@test.com',
        password: 'testpassword',
      }

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('חשבון לא פעיל')
    })
  })

  describe('POST /api/auth/refresh', () => {
    it('should refresh token successfully', async () => {
      // Create user and get refresh token
      const user = await testUtils.createTestUser({
        email: 'refreshtest@test.com',
        password: '$2b$10$test.hash.for.refresh',
        firstName: 'משתמש',
        lastName: 'רענון',
        role: 'DRIVER',
        isActive: true,
      })

      // Create refresh token
      const { prisma } = await import('../setup')
      const refreshToken = await prisma.refreshToken.create({
        data: {
          token: 'test-refresh-token',
          userId: user.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        }
      })

      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: refreshToken.token })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.accessToken).toBeDefined()
      expect(response.body.data.refreshToken).toBeDefined()
    })

    it('should return error for invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('Refresh token לא תקין')
    })

    it('should return error for expired refresh token', async () => {
      // Create user and expired refresh token
      const user = await testUtils.createTestUser({
        email: 'expiredtest@test.com',
        password: '$2b$10$test.hash.for.expired',
        firstName: 'משתמש',
        lastName: 'פג תוקף',
        role: 'DRIVER',
        isActive: true,
      })

      const { prisma } = await import('../setup')
      const refreshToken = await prisma.refreshToken.create({
        data: {
          token: 'expired-refresh-token',
          userId: user.id,
          expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        }
      })

      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: refreshToken.token })
        .expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('Refresh token פג תוקף')
    })
  })

  describe('POST /api/auth/logout', () => {
    it('should logout successfully', async () => {
      // Create user and refresh token
      const user = await testUtils.createTestUser({
        email: 'logouttest@test.com',
        password: '$2b$10$test.hash.for.logout',
        firstName: 'משתמש',
        lastName: 'התנתקות',
        role: 'DRIVER',
        isActive: true,
      })

      const { prisma } = await import('../setup')
      const refreshToken = await prisma.refreshToken.create({
        data: {
          token: 'logout-refresh-token',
          userId: user.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        }
      })

      const response = await request(app)
        .post('/api/auth/logout')
        .send({ refreshToken: refreshToken.token })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toContain('התנתקות הושלמה')

      // Verify refresh token was deleted
      const deletedToken = await prisma.refreshToken.findUnique({
        where: { token: refreshToken.token }
      })
      expect(deletedToken).toBeNull()
    })
  })

  describe('Protected Routes', () => {
    let accessToken: string
    let user: any

    beforeEach(async () => {
      // Create user and get access token
      user = await testUtils.createTestUser({
        email: 'protected@test.com',
        password: '$2b$10$test.hash.for.protected',
        firstName: 'משתמש',
        lastName: 'מוגן',
        role: 'ADMIN',
        isActive: true,
      })

      // In a real test, you'd generate a proper JWT token
      // For this example, we'll use a mock token
      accessToken = 'mock-access-token'
    })

    it('should access protected route with valid token', async () => {
      const response = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.email).toBe(user.email)
    })

    it('should return error for missing token', async () => {
      const response = await request(app)
        .get('/api/users/me')
        .expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('אין אסימון אימות')
    })

    it('should return error for invalid token', async () => {
      const response = await request(app)
        .get('/api/users/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('אסימון לא תקין')
    })
  })
})
