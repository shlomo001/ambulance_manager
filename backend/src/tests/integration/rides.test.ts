import { describe, it, expect, beforeEach } from '@jest/globals'
import request from 'supertest'
import { app } from '../../index'
import { testUtils, resetDatabase } from '../setup'
import { RideStatus } from '@prisma/client'

describe('Rides Integration Tests', () => {
  let accessToken: string
  let testUsers: any = {}
  let testRides: any = {}

  beforeEach(async () => {
    await resetDatabase()

    // Create test users
    testUsers.admin = await testUtils.createTestUser({
      email: 'admin@test.com',
      password: '$2b$10$test.hash.for.admin',
      firstName: 'מנהל',
      lastName: 'מבחן',
      role: 'ADMIN',
      isActive: true,
    })

    testUsers.driver = await testUtils.createTestUser({
      email: 'driver@test.com',
      password: '$2b$10$test.hash.for.driver',
      firstName: 'נהג',
      lastName: 'מבחן',
      role: 'DRIVER',
      isActive: true,
    })

    testUsers.client = await testUtils.createTestUser({
      email: 'client@test.com',
      password: '$2b$10$test.hash.for.client',
      firstName: 'לקוח',
      lastName: 'מבחן',
      role: 'INSTITUTIONAL_CLIENT',
      isActive: true,
    })

    // Create test rides
    testRides.pending = await testUtils.createTestRide({
      task: 'נסיעה ממתינה',
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

    testRides.completed = await testUtils.createTestRide({
      task: 'נסיעה הושלמה',
      pickupAddress: 'חיפה, רחוב הרצל 1',
      dropoffAddress: 'נהריה, רחוב הרצל 10',
      scheduledDate: new Date('2024-01-16'),
      scheduledTime: '14:00',
      clientId: testUsers.client.id,
      driverId: testUsers.driver.id,
      estimatedFare: 80,
      status: RideStatus.COMPLETED,
      createdById: testUsers.admin.id,
    })

    // Mock access token
    accessToken = 'mock-access-token'
  })

  describe('POST /api/rides', () => {
    it('should create a new ride successfully', async () => {
      const rideData = {
        task: 'נסיעה חדשה',
        pickupAddress: 'באר שבע, רחוב הרצל 1',
        dropoffAddress: 'אילת, רחוב הרצל 10',
        scheduledDate: '2024-01-17',
        scheduledTime: '16:00',
        clientId: testUsers.client.id,
        driverId: testUsers.driver.id,
        estimatedFare: 200,
        invoiceNumber: 'INV-003',
        notes: 'נסיעה דחופה',
      }

      const response = await request(app)
        .post('/api/rides')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(rideData)
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.data.task).toBe(rideData.task)
      expect(response.body.data.pickupAddress).toBe(rideData.pickupAddress)
      expect(response.body.data.dropoffAddress).toBe(rideData.dropoffAddress)
      expect(response.body.data.clientId).toBe(rideData.clientId)
      expect(response.body.data.driverId).toBe(rideData.driverId)
      expect(response.body.data.estimatedFare).toBe(rideData.estimatedFare)
      expect(response.body.data.invoiceNumber).toBe(rideData.invoiceNumber)
      expect(response.body.data.notes).toBe(rideData.notes)
      expect(response.body.data.status).toBe(RideStatus.PENDING)
    })

    it('should create ride without driver assignment', async () => {
      const rideData = {
        task: 'נסיעה ללא נהג',
        pickupAddress: 'תל אביב, רחוב הרצל 1',
        dropoffAddress: 'ירושלים, רחוב יפו 10',
        scheduledDate: '2024-01-18',
        scheduledTime: '09:00',
        clientId: testUsers.client.id,
        estimatedFare: 120,
      }

      const response = await request(app)
        .post('/api/rides')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(rideData)
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.data.driverId).toBeNull()
      expect(response.body.data.status).toBe(RideStatus.PENDING)
    })

    it('should return error for missing required fields', async () => {
      const rideData = {
        task: 'נסיעה לא שלמה',
        // Missing pickupAddress, dropoffAddress, etc.
      }

      const response = await request(app)
        .post('/api/rides')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(rideData)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('שדות חובה חסרים')
    })

    it('should return error for invalid date format', async () => {
      const rideData = {
        task: 'נסיעה עם תאריך לא תקין',
        pickupAddress: 'תל אביב, רחוב הרצל 1',
        dropoffAddress: 'ירושלים, רחוב יפו 10',
        scheduledDate: 'invalid-date',
        scheduledTime: '10:00',
        clientId: testUsers.client.id,
      }

      const response = await request(app)
        .post('/api/rides')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(rideData)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('פורמט תאריך לא תקין')
    })
  })

  describe('GET /api/rides', () => {
    it('should return all rides with pagination', async () => {
      const response = await request(app)
        .get('/api/rides')
        .set('Authorization', `Bearer ${accessToken}`)
        .query({ page: 1, limit: 10 })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.rides).toHaveLength(2)
      expect(response.body.data.total).toBe(2)
      expect(response.body.data.page).toBe(1)
      expect(response.body.data.limit).toBe(10)
    })

    it('should filter rides by status', async () => {
      const response = await request(app)
        .get('/api/rides')
        .set('Authorization', `Bearer ${accessToken}`)
        .query({ status: RideStatus.PENDING })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.rides).toHaveLength(1)
      expect(response.body.data.rides[0].status).toBe(RideStatus.PENDING)
    })

    it('should filter rides by driver', async () => {
      const response = await request(app)
        .get('/api/rides')
        .set('Authorization', `Bearer ${accessToken}`)
        .query({ driverId: testUsers.driver.id })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.rides).toHaveLength(2)
      expect(response.body.data.rides.every((ride: any) => ride.driverId === testUsers.driver.id)).toBe(true)
    })

    it('should filter rides by client', async () => {
      const response = await request(app)
        .get('/api/rides')
        .set('Authorization', `Bearer ${accessToken}`)
        .query({ clientId: testUsers.client.id })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.rides).toHaveLength(2)
      expect(response.body.data.rides.every((ride: any) => ride.clientId === testUsers.client.id)).toBe(true)
    })

    it('should filter rides by date range', async () => {
      const response = await request(app)
        .get('/api/rides')
        .set('Authorization', `Bearer ${accessToken}`)
        .query({ 
          dateFrom: '2024-01-15',
          dateTo: '2024-01-15'
        })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.rides).toHaveLength(1)
    })
  })

  describe('GET /api/rides/:id', () => {
    it('should return specific ride by ID', async () => {
      const response = await request(app)
        .get(`/api/rides/${testRides.pending.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.id).toBe(testRides.pending.id)
      expect(response.body.data.task).toBe(testRides.pending.task)
    })

    it('should return error for non-existent ride', async () => {
      const response = await request(app)
        .get('/api/rides/non-existent-id')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('נסיעה לא נמצאה')
    })
  })

  describe('PUT /api/rides/:id', () => {
    it('should update ride successfully', async () => {
      const updateData = {
        task: 'נסיעה מעודכנת',
        estimatedFare: 180,
        notes: 'הערות מעודכנות',
      }

      const response = await request(app)
        .put(`/api/rides/${testRides.pending.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.task).toBe(updateData.task)
      expect(response.body.data.estimatedFare).toBe(updateData.estimatedFare)
      expect(response.body.data.notes).toBe(updateData.notes)
    })

    it('should return error for non-existent ride', async () => {
      const updateData = {
        task: 'נסיעה מעודכנת',
      }

      const response = await request(app)
        .put('/api/rides/non-existent-id')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData)
        .expect(404)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('נסיעה לא נמצאה')
    })
  })

  describe('POST /api/rides/:id/assign-driver', () => {
    it('should assign driver to ride successfully', async () => {
      // Create ride without driver
      const rideWithoutDriver = await testUtils.createTestRide({
        task: 'נסיעה ללא נהג',
        pickupAddress: 'תל אביב, רחוב הרצל 1',
        dropoffAddress: 'ירושלים, רחוב יפו 10',
        scheduledDate: new Date('2024-01-19'),
        scheduledTime: '11:00',
        clientId: testUsers.client.id,
        status: RideStatus.PENDING,
        createdById: testUsers.admin.id,
      })

      const response = await request(app)
        .post(`/api/rides/${rideWithoutDriver.id}/assign-driver`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ driverId: testUsers.driver.id })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.driverId).toBe(testUsers.driver.id)
      expect(response.body.data.status).toBe(RideStatus.ASSIGNED)
    })

    it('should return error for non-existent ride', async () => {
      const response = await request(app)
        .post('/api/rides/non-existent-id/assign-driver')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ driverId: testUsers.driver.id })
        .expect(404)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('נסיעה לא נמצאה')
    })

    it('should return error for non-existent driver', async () => {
      const response = await request(app)
        .post(`/api/rides/${testRides.pending.id}/assign-driver`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ driverId: 'non-existent-driver-id' })
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('נהג לא נמצא')
    })
  })

  describe('PUT /api/rides/:id/status', () => {
    it('should update ride status successfully', async () => {
      const response = await request(app)
        .put(`/api/rides/${testRides.pending.id}/status`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ status: RideStatus.ACCEPTED_BY_DRIVER })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.status).toBe(RideStatus.ACCEPTED_BY_DRIVER)
    })

    it('should return error for invalid status transition', async () => {
      const response = await request(app)
        .put(`/api/rides/${testRides.pending.id}/status`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ status: RideStatus.ON_THE_WAY })
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('מעבר סטטוס לא תקין')
    })

    it('should return error for non-existent ride', async () => {
      const response = await request(app)
        .put('/api/rides/non-existent-id/status')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ status: RideStatus.ACCEPTED_BY_DRIVER })
        .expect(404)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('נסיעה לא נמצאה')
    })
  })

  describe('DELETE /api/rides/:id', () => {
    it('should delete ride successfully', async () => {
      const response = await request(app)
        .delete(`/api/rides/${testRides.pending.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toContain('נסיעה נמחקה בהצלחה')
    })

    it('should return error for non-existent ride', async () => {
      const response = await request(app)
        .delete('/api/rides/non-existent-id')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('נסיעה לא נמצאה')
    })
  })

  describe('GET /api/rides/my', () => {
    it('should return rides for current user (driver)', async () => {
      const response = await request(app)
        .get('/api/rides/my')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toBeDefined()
    })
  })
})
