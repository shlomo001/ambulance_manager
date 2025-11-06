import { describe, it, expect, beforeEach } from '@jest/globals'
import { RideService } from '../../services/rideService'
import { testUtils, resetDatabase } from '../setup'
import { RideStatus } from '@prisma/client'

describe('RideService', () => {
  let rideService: RideService
  let testUsers: any = {}

  beforeEach(async () => {
    rideService = new RideService()
    await resetDatabase()

    // Create test users
    testUsers.admin = await testUtils.createTestUser({
      email: 'admin@test.com',
      password: 'hashedpassword',
      firstName: 'מנהל',
      lastName: 'מבחן',
      role: 'ADMIN',
      isActive: true,
    })

    testUsers.driver = await testUtils.createTestUser({
      email: 'driver@test.com',
      password: 'hashedpassword',
      firstName: 'נהג',
      lastName: 'מבחן',
      role: 'DRIVER',
      isActive: true,
    })

    testUsers.client = await testUtils.createTestUser({
      email: 'client@test.com',
      password: 'hashedpassword',
      firstName: 'לקוח',
      lastName: 'מבחן',
      role: 'INSTITUTIONAL_CLIENT',
      isActive: true,
    })
  })

  describe('createRide', () => {
    it('should create a new ride successfully', async () => {
      const rideData = {
        task: 'נסיעה מבחן',
        pickupAddress: 'תל אביב, רחוב הרצל 1',
        dropoffAddress: 'ירושלים, רחוב יפו 10',
        scheduledDate: new Date('2024-01-15'),
        scheduledTime: '10:00',
        clientId: testUsers.client.id,
        driverId: testUsers.driver.id,
        estimatedFare: 150,
        invoiceNumber: 'INV-001',
        notes: 'נסיעה רגילה',
        createdById: testUsers.admin.id,
      }

      const ride = await rideService.createRide(rideData)

      expect(ride).toBeDefined()
      expect(ride.task).toBe(rideData.task)
      expect(ride.pickupAddress).toBe(rideData.pickupAddress)
      expect(ride.dropoffAddress).toBe(rideData.dropoffAddress)
      expect(ride.scheduledDate).toEqual(rideData.scheduledDate)
      expect(ride.scheduledTime).toBe(rideData.scheduledTime)
      expect(ride.clientId).toBe(rideData.clientId)
      expect(ride.driverId).toBe(rideData.driverId)
      expect(ride.estimatedFare).toBe(rideData.estimatedFare)
      expect(ride.invoiceNumber).toBe(rideData.invoiceNumber)
      expect(ride.notes).toBe(rideData.notes)
      expect(ride.status).toBe(RideStatus.PENDING)
    })

    it('should create ride without driver assignment', async () => {
      const rideData = {
        task: 'נסיעה ללא נהג',
        pickupAddress: 'תל אביב, רחוב הרצל 1',
        dropoffAddress: 'ירושלים, רחוב יפו 10',
        scheduledDate: new Date('2024-01-15'),
        scheduledTime: '10:00',
        clientId: testUsers.client.id,
        estimatedFare: 150,
        createdById: testUsers.admin.id,
      }

      const ride = await rideService.createRide(rideData)

      expect(ride).toBeDefined()
      expect(ride.driverId).toBeNull()
      expect(ride.status).toBe(RideStatus.PENDING)
    })

    it('should throw error for invalid client', async () => {
      const rideData = {
        task: 'נסיעה עם לקוח לא קיים',
        pickupAddress: 'תל אביב, רחוב הרצל 1',
        dropoffAddress: 'ירושלים, רחוב יפו 10',
        scheduledDate: new Date('2024-01-15'),
        scheduledTime: '10:00',
        clientId: 'non-existent-client-id',
        createdById: testUsers.admin.id,
      }

      await expect(rideService.createRide(rideData)).rejects.toThrow()
    })
  })

  describe('getRideById', () => {
    it('should return ride by ID', async () => {
      const ride = await testUtils.createTestRide({
        task: 'נסיעה מבחן',
        pickupAddress: 'תל אביב, רחוב הרצל 1',
        dropoffAddress: 'ירושלים, רחוב יפו 10',
        scheduledDate: new Date('2024-01-15'),
        scheduledTime: '10:00',
        clientId: testUsers.client.id,
        driverId: testUsers.driver.id,
        estimatedFare: 150,
        status: RideStatus.PENDING,
        createdById: testUsers.admin.id,
      })

      const foundRide = await rideService.getRideById(ride.id)

      expect(foundRide).toBeDefined()
      expect(foundRide?.id).toBe(ride.id)
      expect(foundRide?.task).toBe(ride.task)
    })

    it('should return null for non-existent ride', async () => {
      const foundRide = await rideService.getRideById('non-existent-id')

      expect(foundRide).toBeNull()
    })
  })

  describe('updateRide', () => {
    it('should update ride successfully', async () => {
      const ride = await testUtils.createTestRide({
        task: 'נסיעה מבחן',
        pickupAddress: 'תל אביב, רחוב הרצל 1',
        dropoffAddress: 'ירושלים, רחוב יפו 10',
        scheduledDate: new Date('2024-01-15'),
        scheduledTime: '10:00',
        clientId: testUsers.client.id,
        driverId: testUsers.driver.id,
        estimatedFare: 150,
        status: RideStatus.PENDING,
        createdById: testUsers.admin.id,
      })

      const updateData = {
        task: 'נסיעה מעודכנת',
        estimatedFare: 200,
        notes: 'הערות מעודכנות',
      }

      const updatedRide = await rideService.updateRide(ride.id, updateData)

      expect(updatedRide).toBeDefined()
      expect(updatedRide.task).toBe(updateData.task)
      expect(updatedRide.estimatedFare).toBe(updateData.estimatedFare)
      expect(updatedRide.notes).toBe(updateData.notes)
    })

    it('should throw error for non-existent ride', async () => {
      const updateData = {
        task: 'נסיעה מעודכנת',
      }

      await expect(rideService.updateRide('non-existent-id', updateData)).rejects.toThrow()
    })
  })

  describe('assignDriver', () => {
    it('should assign driver to ride successfully', async () => {
      const ride = await testUtils.createTestRide({
        task: 'נסיעה ללא נהג',
        pickupAddress: 'תל אביב, רחוב הרצל 1',
        dropoffAddress: 'ירושלים, רחוב יפו 10',
        scheduledDate: new Date('2024-01-15'),
        scheduledTime: '10:00',
        clientId: testUsers.client.id,
        status: RideStatus.PENDING,
        createdById: testUsers.admin.id,
      })

      const updatedRide = await rideService.assignDriver(ride.id, testUsers.driver.id)

      expect(updatedRide).toBeDefined()
      expect(updatedRide.driverId).toBe(testUsers.driver.id)
      expect(updatedRide.status).toBe(RideStatus.ASSIGNED)
    })

    it('should throw error for non-existent ride', async () => {
      await expect(rideService.assignDriver('non-existent-id', testUsers.driver.id)).rejects.toThrow()
    })

    it('should throw error for non-existent driver', async () => {
      const ride = await testUtils.createTestRide({
        task: 'נסיעה ללא נהג',
        pickupAddress: 'תל אביב, רחוב הרצל 1',
        dropoffAddress: 'ירושלים, רחוב יפו 10',
        scheduledDate: new Date('2024-01-15'),
        scheduledTime: '10:00',
        clientId: testUsers.client.id,
        status: RideStatus.PENDING,
        createdById: testUsers.admin.id,
      })

      await expect(rideService.assignDriver(ride.id, 'non-existent-driver-id')).rejects.toThrow()
    })
  })

  describe('updateRideStatus', () => {
    it('should update ride status successfully', async () => {
      const ride = await testUtils.createTestRide({
        task: 'נסיעה מבחן',
        pickupAddress: 'תל אביב, רחוב הרצל 1',
        dropoffAddress: 'ירושלים, רחוב יפו 10',
        scheduledDate: new Date('2024-01-15'),
        scheduledTime: '10:00',
        clientId: testUsers.client.id,
        driverId: testUsers.driver.id,
        status: RideStatus.ASSIGNED,
        createdById: testUsers.admin.id,
      })

      const updatedRide = await rideService.updateRideStatus(ride.id, RideStatus.ACCEPTED_BY_DRIVER)

      expect(updatedRide).toBeDefined()
      expect(updatedRide.status).toBe(RideStatus.ACCEPTED_BY_DRIVER)
    })

    it('should throw error for invalid status transition', async () => {
      const ride = await testUtils.createTestRide({
        task: 'נסיעה מבחן',
        pickupAddress: 'תל אביב, רחוב הרצל 1',
        dropoffAddress: 'ירושלים, רחוב יפו 10',
        scheduledDate: new Date('2024-01-15'),
        scheduledTime: '10:00',
        clientId: testUsers.client.id,
        driverId: testUsers.driver.id,
        status: RideStatus.PENDING,
        createdById: testUsers.admin.id,
      })

      // Cannot go directly from PENDING to ON_THE_WAY
      await expect(rideService.updateRideStatus(ride.id, RideStatus.ON_THE_WAY)).rejects.toThrow()
    })
  })

  describe('getRidesByDriver', () => {
    it('should return rides for specific driver', async () => {
      // Create rides for different drivers
      await testUtils.createTestRide({
        task: 'נסיעה נהג 1',
        pickupAddress: 'תל אביב, רחוב הרצל 1',
        dropoffAddress: 'ירושלים, רחוב יפו 10',
        scheduledDate: new Date('2024-01-15'),
        scheduledTime: '10:00',
        clientId: testUsers.client.id,
        driverId: testUsers.driver.id,
        status: RideStatus.PENDING,
        createdById: testUsers.admin.id,
      })

      const otherDriver = await testUtils.createTestUser({
        email: 'otherdriver@test.com',
        password: 'hashedpassword',
        firstName: 'נהג',
        lastName: 'אחר',
        role: 'DRIVER',
        isActive: true,
      })

      await testUtils.createTestRide({
        task: 'נסיעה נהג 2',
        pickupAddress: 'חיפה, רחוב הרצל 1',
        dropoffAddress: 'נהריה, רחוב הרצל 10',
        scheduledDate: new Date('2024-01-16'),
        scheduledTime: '14:00',
        clientId: testUsers.client.id,
        driverId: otherDriver.id,
        status: RideStatus.PENDING,
        createdById: testUsers.admin.id,
      })

      const rides = await rideService.getRidesByDriver(testUsers.driver.id)

      expect(rides).toHaveLength(1)
      expect(rides[0].driverId).toBe(testUsers.driver.id)
    })
  })

  describe('getRidesByClient', () => {
    it('should return rides for specific client', async () => {
      // Create rides for different clients
      await testUtils.createTestRide({
        task: 'נסיעה לקוח 1',
        pickupAddress: 'תל אביב, רחוב הרצל 1',
        dropoffAddress: 'ירושלים, רחוב יפו 10',
        scheduledDate: new Date('2024-01-15'),
        scheduledTime: '10:00',
        clientId: testUsers.client.id,
        driverId: testUsers.driver.id,
        status: RideStatus.PENDING,
        createdById: testUsers.admin.id,
      })

      const otherClient = await testUtils.createTestUser({
        email: 'otherclient@test.com',
        password: 'hashedpassword',
        firstName: 'לקוח',
        lastName: 'אחר',
        role: 'INSTITUTIONAL_CLIENT',
        isActive: true,
      })

      await testUtils.createTestRide({
        task: 'נסיעה לקוח 2',
        pickupAddress: 'חיפה, רחוב הרצל 1',
        dropoffAddress: 'נהריה, רחוב הרצל 10',
        scheduledDate: new Date('2024-01-16'),
        scheduledTime: '14:00',
        clientId: otherClient.id,
        driverId: testUsers.driver.id,
        status: RideStatus.PENDING,
        createdById: testUsers.admin.id,
      })

      const rides = await rideService.getRidesByClient(testUsers.client.id)

      expect(rides).toHaveLength(1)
      expect(rides[0].clientId).toBe(testUsers.client.id)
    })
  })

  describe('getAllRides', () => {
    it('should return all rides with pagination', async () => {
      // Create multiple rides
      await testUtils.createTestRide({
        task: 'נסיעה 1',
        pickupAddress: 'תל אביב, רחוב הרצל 1',
        dropoffAddress: 'ירושלים, רחוב יפו 10',
        scheduledDate: new Date('2024-01-15'),
        scheduledTime: '10:00',
        clientId: testUsers.client.id,
        driverId: testUsers.driver.id,
        status: RideStatus.PENDING,
        createdById: testUsers.admin.id,
      })

      await testUtils.createTestRide({
        task: 'נסיעה 2',
        pickupAddress: 'חיפה, רחוב הרצל 1',
        dropoffAddress: 'נהריה, רחוב הרצל 10',
        scheduledDate: new Date('2024-01-16'),
        scheduledTime: '14:00',
        clientId: testUsers.client.id,
        driverId: testUsers.driver.id,
        status: RideStatus.COMPLETED,
        createdById: testUsers.admin.id,
      })

      const result = await rideService.getAllRides({ page: 1, limit: 10 })

      expect(result.rides).toHaveLength(2)
      expect(result.total).toBe(2)
      expect(result.page).toBe(1)
      expect(result.limit).toBe(10)
    })

    it('should filter rides by status', async () => {
      await testUtils.createTestRide({
        task: 'נסיעה ממתינה',
        pickupAddress: 'תל אביב, רחוב הרצל 1',
        dropoffAddress: 'ירושלים, רחוב יפו 10',
        scheduledDate: new Date('2024-01-15'),
        scheduledTime: '10:00',
        clientId: testUsers.client.id,
        driverId: testUsers.driver.id,
        status: RideStatus.PENDING,
        createdById: testUsers.admin.id,
      })

      await testUtils.createTestRide({
        task: 'נסיעה הושלמה',
        pickupAddress: 'חיפה, רחוב הרצל 1',
        dropoffAddress: 'נהריה, רחוב הרצל 10',
        scheduledDate: new Date('2024-01-16'),
        scheduledTime: '14:00',
        clientId: testUsers.client.id,
        driverId: testUsers.driver.id,
        status: RideStatus.COMPLETED,
        createdById: testUsers.admin.id,
      })

      const result = await rideService.getAllRides({ 
        page: 1, 
        limit: 10, 
        status: RideStatus.PENDING 
      })

      expect(result.rides).toHaveLength(1)
      expect(result.rides[0].status).toBe(RideStatus.PENDING)
    })
  })
})
