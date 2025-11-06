import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import { UserService } from '../../services/userService'
import { testUtils, resetDatabase } from '../setup'
import { UserNotFoundError, ValidationError } from '../../utils/errors'

describe('UserService', () => {
  let userService: UserService

  beforeEach(async () => {
    userService = new UserService()
    await resetDatabase()
  })

  describe('createUser', () => {
    it('should create a new user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'יוחנן',
        lastName: 'כהן',
        role: 'DRIVER' as const,
        isActive: true,
      }

      const user = await userService.createUser(userData)

      expect(user).toBeDefined()
      expect(user.email).toBe(userData.email)
      expect(user.firstName).toBe(userData.firstName)
      expect(user.lastName).toBe(userData.lastName)
      expect(user.role).toBe(userData.role)
      expect(user.isActive).toBe(userData.isActive)
      expect(user.password).not.toBe(userData.password) // Should be hashed
    })

    it('should throw error for duplicate email', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'יוחנן',
        lastName: 'כהן',
        role: 'DRIVER' as const,
        isActive: true,
      }

      await userService.createUser(userData)

      await expect(userService.createUser(userData)).rejects.toThrow(ValidationError)
    })

    it('should throw error for invalid email', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'password123',
        firstName: 'יוחנן',
        lastName: 'כהן',
        role: 'DRIVER' as const,
        isActive: true,
      }

      await expect(userService.createUser(userData)).rejects.toThrow(ValidationError)
    })

    it('should throw error for weak password', async () => {
      const userData = {
        email: 'test@example.com',
        password: '123',
        firstName: 'יוחנן',
        lastName: 'כהן',
        role: 'DRIVER' as const,
        isActive: true,
      }

      await expect(userService.createUser(userData)).rejects.toThrow(ValidationError)
    })
  })

  describe('getUserById', () => {
    it('should return user by ID', async () => {
      const user = await testUtils.createTestUser({
        email: 'test@example.com',
        password: 'hashedpassword',
        firstName: 'יוחנן',
        lastName: 'כהן',
        role: 'DRIVER',
        isActive: true,
      })

      const foundUser = await userService.getUserById(user.id)

      expect(foundUser).toBeDefined()
      expect(foundUser?.id).toBe(user.id)
      expect(foundUser?.email).toBe(user.email)
    })

    it('should return null for non-existent user', async () => {
      const foundUser = await userService.getUserById('non-existent-id')

      expect(foundUser).toBeNull()
    })
  })

  describe('getUserByEmail', () => {
    it('should return user by email', async () => {
      const user = await testUtils.createTestUser({
        email: 'test@example.com',
        password: 'hashedpassword',
        firstName: 'יוחנן',
        lastName: 'כהן',
        role: 'DRIVER',
        isActive: true,
      })

      const foundUser = await userService.getUserByEmail(user.email)

      expect(foundUser).toBeDefined()
      expect(foundUser?.id).toBe(user.id)
      expect(foundUser?.email).toBe(user.email)
    })

    it('should return null for non-existent email', async () => {
      const foundUser = await userService.getUserByEmail('nonexistent@example.com')

      expect(foundUser).toBeNull()
    })
  })

  describe('updateUser', () => {
    it('should update user successfully', async () => {
      const user = await testUtils.createTestUser({
        email: 'test@example.com',
        password: 'hashedpassword',
        firstName: 'יוחנן',
        lastName: 'כהן',
        role: 'DRIVER',
        isActive: true,
      })

      const updateData = {
        firstName: 'משה',
        lastName: 'לוי',
        isActive: false,
      }

      const updatedUser = await userService.updateUser(user.id, updateData)

      expect(updatedUser).toBeDefined()
      expect(updatedUser.firstName).toBe(updateData.firstName)
      expect(updatedUser.lastName).toBe(updateData.lastName)
      expect(updatedUser.isActive).toBe(updateData.isActive)
      expect(updatedUser.email).toBe(user.email) // Should remain unchanged
    })

    it('should throw error for non-existent user', async () => {
      const updateData = {
        firstName: 'משה',
        lastName: 'לוי',
      }

      await expect(userService.updateUser('non-existent-id', updateData)).rejects.toThrow(UserNotFoundError)
    })
  })

  describe('deleteUser', () => {
    it('should delete user successfully', async () => {
      const user = await testUtils.createTestUser({
        email: 'test@example.com',
        password: 'hashedpassword',
        firstName: 'יוחנן',
        lastName: 'כהן',
        role: 'DRIVER',
        isActive: true,
      })

      await userService.deleteUser(user.id)

      const deletedUser = await userService.getUserById(user.id)
      expect(deletedUser).toBeNull()
    })

    it('should throw error for non-existent user', async () => {
      await expect(userService.deleteUser('non-existent-id')).rejects.toThrow(UserNotFoundError)
    })
  })

  describe('getAllUsers', () => {
    it('should return all users with pagination', async () => {
      // Create multiple users
      await testUtils.createTestUser({
        email: 'user1@example.com',
        password: 'hashedpassword',
        firstName: 'משתמש',
        lastName: 'ראשון',
        role: 'DRIVER',
        isActive: true,
      })

      await testUtils.createTestUser({
        email: 'user2@example.com',
        password: 'hashedpassword',
        firstName: 'משתמש',
        lastName: 'שני',
        role: 'ADMIN',
        isActive: true,
      })

      const result = await userService.getAllUsers({ page: 1, limit: 10 })

      expect(result.users).toHaveLength(2)
      expect(result.total).toBe(2)
      expect(result.page).toBe(1)
      expect(result.limit).toBe(10)
    })

    it('should filter users by role', async () => {
      await testUtils.createTestUser({
        email: 'driver@example.com',
        password: 'hashedpassword',
        firstName: 'נהג',
        lastName: 'מבחן',
        role: 'DRIVER',
        isActive: true,
      })

      await testUtils.createTestUser({
        email: 'admin@example.com',
        password: 'hashedpassword',
        firstName: 'מנהל',
        lastName: 'מבחן',
        role: 'ADMIN',
        isActive: true,
      })

      const result = await userService.getAllUsers({ 
        page: 1, 
        limit: 10, 
        role: 'DRIVER' 
      })

      expect(result.users).toHaveLength(1)
      expect(result.users[0].role).toBe('DRIVER')
    })

    it('should search users by name', async () => {
      await testUtils.createTestUser({
        email: 'user1@example.com',
        password: 'hashedpassword',
        firstName: 'יוחנן',
        lastName: 'כהן',
        role: 'DRIVER',
        isActive: true,
      })

      await testUtils.createTestUser({
        email: 'user2@example.com',
        password: 'hashedpassword',
        firstName: 'משה',
        lastName: 'לוי',
        role: 'ADMIN',
        isActive: true,
      })

      const result = await userService.getAllUsers({ 
        page: 1, 
        limit: 10, 
        search: 'יוחנן' 
      })

      expect(result.users).toHaveLength(1)
      expect(result.users[0].firstName).toBe('יוחנן')
    })
  })

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      const user = await testUtils.createTestUser({
        email: 'test@example.com',
        password: 'hashedpassword',
        firstName: 'יוחנן',
        lastName: 'כהן',
        role: 'DRIVER',
        isActive: true,
      })

      const newPassword = 'newpassword123'
      await userService.changePassword(user.id, newPassword)

      const updatedUser = await userService.getUserById(user.id)
      expect(updatedUser?.password).not.toBe('hashedpassword')
      expect(updatedUser?.password).not.toBe(newPassword) // Should be hashed
    })

    it('should throw error for non-existent user', async () => {
      await expect(userService.changePassword('non-existent-id', 'newpassword')).rejects.toThrow(UserNotFoundError)
    })
  })

  describe('verifyPassword', () => {
    it('should verify correct password', async () => {
      const plainPassword = 'password123'
      const user = await testUtils.createTestUser({
        email: 'test@example.com',
        password: plainPassword, // Will be hashed by the service
        firstName: 'יוחנן',
        lastName: 'כהן',
        role: 'DRIVER',
        isActive: true,
      })

      const isValid = await userService.verifyPassword(user.id, plainPassword)
      expect(isValid).toBe(true)
    })

    it('should reject incorrect password', async () => {
      const user = await testUtils.createTestUser({
        email: 'test@example.com',
        password: 'password123',
        firstName: 'יוחנן',
        lastName: 'כהן',
        role: 'DRIVER',
        isActive: true,
      })

      const isValid = await userService.verifyPassword(user.id, 'wrongpassword')
      expect(isValid).toBe(false)
    })
  })
})
