import { User, Mail, Phone, Calendar, Shield } from 'lucide-react'
import { useAuthStore } from '../store/authStore'

const ProfilePage = () => {
  const { user } = useAuthStore()

  const getRoleLabel = (role: string) => {
    const labels = {
      SUPER_ADMIN: 'מנהל על',
      SUB_ADMIN: 'סגן מנהל',
      ADMIN: 'מנהל',
      DRIVER: 'נהג',
      INSTITUTIONAL_CLIENT: 'לקוח מוסדי'
    }
    return labels[role as keyof typeof labels] || role
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">פרופיל</h1>
        <p className="mt-1 text-sm text-gray-500">
          פרטי המשתמש שלך
        </p>
      </div>

      {/* Profile Card */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">פרטי משתמש</h3>
        </div>
        
        <div className="px-6 py-6">
          <div className="flex items-center space-x-6 space-x-reverse">
            <div className="flex-shrink-0">
              <div className="h-20 w-20 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-white">
                  {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                </span>
              </div>
            </div>
            
            <div className="flex-1">
              <h4 className="text-xl font-semibold text-gray-900">
                {user?.firstName} {user?.lastName}
              </h4>
              <div className="mt-2 space-y-2">
                <div className="flex items-center text-sm text-gray-500">
                  <Mail className="h-4 w-4 ml-2" />
                  {user?.email}
                </div>
                {user?.phone && (
                  <div className="flex items-center text-sm text-gray-500">
                    <Phone className="h-4 w-4 ml-2" />
                    {user.phone}
                  </div>
                )}
                <div className="flex items-center text-sm text-gray-500">
                  <Shield className="h-4 w-4 ml-2" />
                  {getRoleLabel(user?.role || '')}
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <Calendar className="h-4 w-4 ml-2" />
                  הצטרף ב-{new Date(user?.createdAt || '').toLocaleDateString('he-IL')}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">פעולות</h3>
        <div className="space-y-3">
          <button className="w-full text-right px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500">
            שנה סיסמה
          </button>
          <button className="w-full text-right px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500">
            עדכן פרטים
          </button>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage
