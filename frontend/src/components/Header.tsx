import { Bell, Search } from 'lucide-react'
import { useState } from 'react'
import { useAuthStore } from '../store/authStore'
import Notifications from './Notifications'

const Header = () => {
  const { user } = useAuthStore()
  const [showNotifications, setShowNotifications] = useState(false)

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Search */}
          <div className="flex-1 max-w-lg">
            <div className="relative">
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="חיפוש..."
                className="block w-full pr-10 pl-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-4 space-x-reverse">
            {/* Notifications */}
            <button 
              onClick={() => setShowNotifications(true)}
              className="relative p-2 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg"
            >
              <Bell className="h-6 w-6" />
              <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400 ring-2 ring-white"></span>
            </button>

            {/* User info */}
            <div className="flex items-center">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  שלום, {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-500">
                  {user?.role === 'SUPER_ADMIN' && 'מנהל על'}
                  {user?.role === 'SUB_ADMIN' && 'סגן מנהל'}
                  {user?.role === 'ADMIN' && 'מנהל'}
                  {user?.role === 'DRIVER' && 'נהג'}
                  {user?.role === 'INSTITUTIONAL_CLIENT' && 'לקוח מוסדי'}
                </p>
              </div>
              <div className="mr-3 h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-white">
                  {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Notifications Panel */}
      <Notifications 
        isOpen={showNotifications} 
        onClose={() => setShowNotifications(false)} 
      />
    </header>
  )
}

export default Header
