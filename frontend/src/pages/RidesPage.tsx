import { useState, useEffect } from 'react'
import { Plus, Search, Filter, Car } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { useRideStore } from '../store/rideStore'
import { Ride, RideStatus } from '../types'
import { RIDE_STATUS_LABELS, RIDE_STATUS_COLORS } from '../types'
import LoadingSpinner from '../components/ui/LoadingSpinner'

const RidesPage = () => {
  const { user } = useAuthStore()
  const { rides, isLoading, fetchRides } = useRideStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<RideStatus | ''>('')

  useEffect(() => {
    fetchRides()
  }, [fetchRides])

  const filteredRides = rides.filter(ride => {
    const matchesSearch = 
      ride.task.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ride.pickupAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ride.dropoffAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ride.invoiceNumber && ride.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesStatus = !statusFilter || ride.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: RideStatus) => {
    return RIDE_STATUS_COLORS[status]
  }

  const getStatusLabel = (status: RideStatus) => {
    return RIDE_STATUS_LABELS[status]
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">נסיעות</h1>
          <p className="mt-1 text-sm text-gray-500">
            ניהול נסיעות אמבולנס
          </p>
        </div>
        {(user?.role === 'SUPER_ADMIN' || user?.role === 'SUB_ADMIN' || user?.role === 'ADMIN' || user?.role === 'INSTITUTIONAL_CLIENT') && (
          <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            <Plus className="ml-2 h-4 w-4" />
            הוסף נסיעה
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="חיפוש נסיעות..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pr-10 pl-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div className="sm:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as RideStatus | '')}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">כל הסטטוסים</option>
              <option value="PENDING">ממתין לאישור</option>
              <option value="ASSIGNED">הוקצה לנהג</option>
              <option value="ACCEPTED">נהג קיבל</option>
              <option value="ON_THE_WAY">בדרך</option>
              <option value="COMPLETED">הושלם</option>
              <option value="CANCELLED">בוטל</option>
              <option value="DECLINED_BY_DRIVER">נהג דחה</option>
            </select>
          </div>
        </div>
      </div>

      {/* Rides List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            רשימת נסיעות
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            {filteredRides.length} נסיעות נמצאו
          </p>
        </div>
        
        {filteredRides.length === 0 ? (
          <div className="text-center py-12">
            <Car className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">אין נסיעות</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || statusFilter 
                ? 'לא נמצאו נסיעות התואמות לחיפוש' 
                : 'עדיין לא נוצרו נסיעות במערכת'
              }
            </p>
          </div>
        ) : (
          <div className="border-t border-gray-200">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      משימה
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      כתובות
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      תאריך
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      נהג
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      סטטוס
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      פעולות
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRides.map((ride) => (
                    <tr key={ride.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {ride.task}
                        </div>
                        {ride.invoiceNumber && (
                          <div className="text-sm text-gray-500">
                            חשבונית: {ride.invoiceNumber}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {ride.pickupAddress}
                        </div>
                        <div className="text-sm text-gray-500">
                          → {ride.dropoffAddress}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(ride.scheduledDate).toLocaleDateString('he-IL')}
                        <div className="text-xs">
                          {new Date(ride.scheduledDate).toLocaleTimeString('he-IL', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {ride.driver ? (
                          <div>
                            <div className="font-medium text-gray-900">
                              {ride.driver.firstName} {ride.driver.lastName}
                            </div>
                            <div className="text-xs text-gray-500">
                              {ride.driver.phone}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">לא הוקצה</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span 
                          className="inline-flex px-2 py-1 text-xs font-semibold rounded-full text-white"
                          style={{ backgroundColor: getStatusColor(ride.status) }}
                        >
                          {getStatusLabel(ride.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button className="text-blue-600 hover:text-blue-900 ml-4">
                          צפה
                        </button>
                        {(user?.role === 'SUPER_ADMIN' || user?.role === 'SUB_ADMIN' || user?.role === 'ADMIN') && (
                          <button className="text-green-600 hover:text-green-900">
                            ערוך
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default RidesPage
