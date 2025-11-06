import { useEffect } from 'react'
import { useAuthStore } from '../store/authStore'
import { useRideStore } from '../store/rideStore'
import { 
  Car, 
  Users, 
  Calendar, 
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { RIDE_STATUS_LABELS, USER_ROLE_LABELS } from '../types'
import LoadingSpinner from '../components/ui/LoadingSpinner'

const DashboardPage = () => {
  const { user } = useAuthStore()
  const { stats, isLoading, fetchRideStats, fetchRides } = useRideStore()

  useEffect(() => {
    fetchRideStats()
    fetchRides({ limit: 5 })
  }, [fetchRideStats, fetchRides])

  const getRoleLabel = (role: string) => {
    return USER_ROLE_LABELS[role as keyof typeof USER_ROLE_LABELS] || role
  }

  const getDashboardContent = () => {
    if (!user) return null

    switch (user.role) {
      case 'SUPER_ADMIN':
      case 'SUB_ADMIN':
      case 'ADMIN':
        return <AdminDashboard stats={stats} isLoading={isLoading} />
      case 'DRIVER':
        return <DriverDashboard />
      case 'INSTITUTIONAL_CLIENT':
        return <ClientDashboard />
      default:
        return <div>תפקיד לא מוכר</div>
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          דשבורד
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          שלום {user?.firstName} {user?.lastName}, ברוך הבא למערכת ניהול האמבולנסים
        </p>
        <p className="text-xs text-gray-400">
          תפקיד: {getRoleLabel(user?.role || '')}
        </p>
      </div>

      {/* Dashboard Content */}
      {getDashboardContent()}
    </div>
  )
}

// Admin Dashboard Component
const AdminDashboard = ({ stats, isLoading }: { stats: any, isLoading: boolean }) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const statCards = [
    {
      title: 'סה"כ נסיעות',
      value: stats?.totalRides || 0,
      icon: Car,
      color: 'bg-blue-500',
      change: '+12%',
      changeType: 'positive'
    },
    {
      title: 'נסיעות ממתינות',
      value: stats?.pendingRides || 0,
      icon: Clock,
      color: 'bg-yellow-500',
      change: '+5%',
      changeType: 'positive'
    },
    {
      title: 'נסיעות שהושלמו',
      value: stats?.completedRides || 0,
      icon: CheckCircle,
      color: 'bg-green-500',
      change: '+8%',
      changeType: 'positive'
    },
    {
      title: 'הכנסות',
      value: `₪${(stats?.totalRevenue || 0).toLocaleString()}`,
      icon: TrendingUp,
      color: 'bg-purple-500',
      change: '+15%',
      changeType: 'positive'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div key={index} className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className={`p-3 rounded-md ${stat.color}`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="mr-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {stat.title}
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stat.value}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <div className="text-sm">
                  <span className={`font-medium ${
                    stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stat.change}
                  </span>
                  <span className="text-gray-500"> מהחודש הקודם</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Recent Rides */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            נסיעות אחרונות
          </h3>
          <RecentRidesList />
        </div>
      </div>
    </div>
  )
}

// Driver Dashboard Component
const DriverDashboard = () => {
  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          הנסיעות שלי
        </h3>
        <p className="text-gray-500">
          כאן תוכל לראות את הנסיעות שהוקצו לך
        </p>
      </div>
    </div>
  )
}

// Client Dashboard Component
const ClientDashboard = () => {
  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          הבקשות שלי
        </h3>
        <p className="text-gray-500">
          כאן תוכל לראות את הבקשות לנסיעות ששלחת
        </p>
      </div>
    </div>
  )
}

// Recent Rides List Component
const RecentRidesList = () => {
  const { rides, isLoading } = useRideStore()

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (!rides || rides.length === 0) {
    return (
      <div className="text-center py-6">
        <Car className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">אין נסיעות</h3>
        <p className="mt-1 text-sm text-gray-500">עדיין לא נוצרו נסיעות במערכת</p>
      </div>
    )
  }

  return (
    <div className="flow-root">
      <ul className="-my-5 divide-y divide-gray-200">
        {rides.map((ride) => (
          <li key={ride.id} className="py-4">
            <div className="flex items-center space-x-4 space-x-reverse">
              <div className="flex-shrink-0">
                <div className={`h-2 w-2 rounded-full ${
                  ride.status === 'COMPLETED' ? 'bg-green-400' :
                  ride.status === 'PENDING' ? 'bg-yellow-400' :
                  ride.status === 'CANCELLED' ? 'bg-red-400' :
                  'bg-blue-400'
                }`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {ride.task}
                </p>
                <p className="text-sm text-gray-500 truncate">
                  {ride.pickupAddress} → {ride.dropoffAddress}
                </p>
              </div>
              <div className="flex-shrink-0 text-right">
                <p className="text-sm text-gray-900">
                  {RIDE_STATUS_LABELS[ride.status]}
                </p>
                <p className="text-sm text-gray-500">
                  {new Date(ride.scheduledDate).toLocaleDateString('he-IL')}
                </p>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default DashboardPage
