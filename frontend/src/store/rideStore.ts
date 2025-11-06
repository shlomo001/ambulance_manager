import { create } from 'zustand'
import { Ride, RideFilters, RideStats } from '../types'
import { ridesApi } from '../utils/api'

interface RideStore {
  // State
  rides: Ride[]
  currentRide: Ride | null
  stats: RideStats | null
  filters: RideFilters
  isLoading: boolean
  error: string | null

  // Actions
  setRides: (rides: Ride[]) => void
  setCurrentRide: (ride: Ride | null) => void
  setStats: (stats: RideStats) => void
  setFilters: (filters: RideFilters) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void

  // API Actions
  fetchRides: (filters?: RideFilters) => Promise<void>
  fetchRideById: (id: string) => Promise<void>
  createRide: (rideData: any) => Promise<void>
  updateRide: (id: string, rideData: any) => Promise<void>
  updateRideStatus: (id: string, status: string, notes?: string) => Promise<void>
  assignRide: (id: string, driverId: string) => Promise<void>
  cancelRide: (id: string, reason: string) => Promise<void>
  declineRide: (id: string, reason: string) => Promise<void>
  fetchRideStats: (filters?: any) => Promise<void>
  fetchMyRides: (filters?: RideFilters) => Promise<void>
  fetchPendingRides: (filters?: RideFilters) => Promise<void>
  fetchAssignedRides: (filters?: RideFilters) => Promise<void>
  fetchCompletedRides: (filters?: RideFilters) => Promise<void>

  // Utility Actions
  addRide: (ride: Ride) => void
  updateRideInList: (id: string, updates: Partial<Ride>) => void
  removeRide: (id: string) => void
  clearRides: () => void
}

export const useRideStore = create<RideStore>((set, get) => ({
  // Initial state
  rides: [],
  currentRide: null,
  stats: null,
  filters: {},
  isLoading: false,
  error: null,

  // Actions
  setRides: (rides) => set({ rides }),
  setCurrentRide: (ride) => set({ currentRide: ride }),
  setStats: (stats) => set({ stats }),
  setFilters: (filters) => set({ filters }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),

  // API Actions
  fetchRides: async (filters = {}) => {
    set({ isLoading: true, error: null })
    try {
      const response = await ridesApi.getRides(filters)
      if (response.success && response.data) {
        set({ rides: response.data, isLoading: false })
      } else {
        throw new Error(response.error || 'שגיאה בטעינת נסיעות')
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'שגיאה לא ידועה', isLoading: false })
    }
  },

  fetchRideById: async (id: string) => {
    set({ isLoading: true, error: null })
    try {
      const response = await ridesApi.getRideById(id)
      if (response.success && response.data) {
        set({ currentRide: response.data, isLoading: false })
      } else {
        throw new Error(response.error || 'שגיאה בטעינת נסיעה')
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'שגיאה לא ידועה', isLoading: false })
    }
  },

  createRide: async (rideData) => {
    set({ isLoading: true, error: null })
    try {
      const response = await ridesApi.createRide(rideData)
      if (response.success && response.data) {
        const { rides } = get()
        set({ rides: [response.data, ...rides], isLoading: false })
      } else {
        throw new Error(response.error || 'שגיאה ביצירת נסיעה')
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'שגיאה לא ידועה', isLoading: false })
      throw error
    }
  },

  updateRide: async (id: string, rideData) => {
    set({ isLoading: true, error: null })
    try {
      const response = await ridesApi.updateRide(id, rideData)
      if (response.success && response.data) {
        const { rides, currentRide } = get()
        const updatedRides = rides.map(ride => 
          ride.id === id ? response.data : ride
        )
        set({ 
          rides: updatedRides, 
          currentRide: currentRide?.id === id ? response.data : currentRide,
          isLoading: false 
        })
      } else {
        throw new Error(response.error || 'שגיאה בעדכון נסיעה')
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'שגיאה לא ידועה', isLoading: false })
      throw error
    }
  },

  updateRideStatus: async (id: string, status: string, notes?: string) => {
    set({ isLoading: true, error: null })
    try {
      const response = await ridesApi.updateRideStatus(id, status, notes)
      if (response.success && response.data) {
        const { rides, currentRide } = get()
        const updatedRides = rides.map(ride => 
          ride.id === id ? response.data : ride
        )
        set({ 
          rides: updatedRides, 
          currentRide: currentRide?.id === id ? response.data : currentRide,
          isLoading: false 
        })
      } else {
        throw new Error(response.error || 'שגיאה בעדכון סטטוס נסיעה')
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'שגיאה לא ידועה', isLoading: false })
      throw error
    }
  },

  assignRide: async (id: string, driverId: string) => {
    set({ isLoading: true, error: null })
    try {
      const response = await ridesApi.assignRide(id, driverId)
      if (response.success && response.data) {
        const { rides, currentRide } = get()
        const updatedRides = rides.map(ride => 
          ride.id === id ? response.data : ride
        )
        set({ 
          rides: updatedRides, 
          currentRide: currentRide?.id === id ? response.data : currentRide,
          isLoading: false 
        })
      } else {
        throw new Error(response.error || 'שגיאה בהקצאת נסיעה')
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'שגיאה לא ידועה', isLoading: false })
      throw error
    }
  },

  cancelRide: async (id: string, reason: string) => {
    set({ isLoading: true, error: null })
    try {
      const response = await ridesApi.cancelRide(id, reason)
      if (response.success && response.data) {
        const { rides, currentRide } = get()
        const updatedRides = rides.map(ride => 
          ride.id === id ? response.data : ride
        )
        set({ 
          rides: updatedRides, 
          currentRide: currentRide?.id === id ? response.data : currentRide,
          isLoading: false 
        })
      } else {
        throw new Error(response.error || 'שגיאה בביטול נסיעה')
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'שגיאה לא ידועה', isLoading: false })
      throw error
    }
  },

  declineRide: async (id: string, reason: string) => {
    set({ isLoading: true, error: null })
    try {
      const response = await ridesApi.declineRide(id, reason)
      if (response.success && response.data) {
        const { rides, currentRide } = get()
        const updatedRides = rides.map(ride => 
          ride.id === id ? response.data : ride
        )
        set({ 
          rides: updatedRides, 
          currentRide: currentRide?.id === id ? response.data : currentRide,
          isLoading: false 
        })
      } else {
        throw new Error(response.error || 'שגיאה בדחיית נסיעה')
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'שגיאה לא ידועה', isLoading: false })
      throw error
    }
  },

  fetchRideStats: async (filters = {}) => {
    set({ isLoading: true, error: null })
    try {
      const response = await ridesApi.getRideStats(filters)
      if (response.success && response.data) {
        set({ stats: response.data, isLoading: false })
      } else {
        throw new Error(response.error || 'שגיאה בטעינת סטטיסטיקות')
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'שגיאה לא ידועה', isLoading: false })
    }
  },

  fetchMyRides: async (filters = {}) => {
    set({ isLoading: true, error: null })
    try {
      const response = await ridesApi.getMyRides(filters)
      if (response.success && response.data) {
        set({ rides: response.data, isLoading: false })
      } else {
        throw new Error(response.error || 'שגיאה בטעינת נסיעות')
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'שגיאה לא ידועה', isLoading: false })
    }
  },

  fetchPendingRides: async (filters = {}) => {
    set({ isLoading: true, error: null })
    try {
      const response = await ridesApi.getPendingRides(filters)
      if (response.success && response.data) {
        set({ rides: response.data, isLoading: false })
      } else {
        throw new Error(response.error || 'שגיאה בטעינת נסיעות ממתינות')
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'שגיאה לא ידועה', isLoading: false })
    }
  },

  fetchAssignedRides: async (filters = {}) => {
    set({ isLoading: true, error: null })
    try {
      const response = await ridesApi.getAssignedRides(filters)
      if (response.success && response.data) {
        set({ rides: response.data, isLoading: false })
      } else {
        throw new Error(response.error || 'שגיאה בטעינת נסיעות שהוקצו')
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'שגיאה לא ידועה', isLoading: false })
    }
  },

  fetchCompletedRides: async (filters = {}) => {
    set({ isLoading: true, error: null })
    try {
      const response = await ridesApi.getCompletedRides(filters)
      if (response.success && response.data) {
        set({ rides: response.data, isLoading: false })
      } else {
        throw new Error(response.error || 'שגיאה בטעינת נסיעות שהושלמו')
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'שגיאה לא ידועה', isLoading: false })
    }
  },

  // Utility Actions
  addRide: (ride) => {
    const { rides } = get()
    set({ rides: [ride, ...rides] })
  },

  updateRideInList: (id, updates) => {
    const { rides } = get()
    const updatedRides = rides.map(ride => 
      ride.id === id ? { ...ride, ...updates } : ride
    )
    set({ rides: updatedRides })
  },

  removeRide: (id) => {
    const { rides } = get()
    const filteredRides = rides.filter(ride => ride.id !== id)
    set({ rides: filteredRides })
  },

  clearRides: () => {
    set({ rides: [], currentRide: null })
  },
}))
