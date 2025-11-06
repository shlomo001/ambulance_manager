import React, { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { 
  Home, 
  Users, 
  Car, 
  Calendar, 
  BarChart3, 
  Settings, 
  User,
  Menu,
  X
} from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { PWAStatusIndicator } from './PWAInstallButton'

const MobileNavigation = () => {
  const [isOpen, setIsOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const navigationItems = [
    { path: '/dashboard', icon: Home, label: 'דשבורד', roles: ['SUPER_ADMIN', 'SUB_ADMIN', 'ADMIN', 'DRIVER', 'CLIENT'] },
    { path: '/rides', icon: Car, label: 'נסיעות', roles: ['SUPER_ADMIN', 'SUB_ADMIN', 'ADMIN', 'DRIVER', 'CLIENT'] },
    { path: '/calendar', icon: Calendar, label: 'לוח שנה', roles: ['SUPER_ADMIN', 'SUB_ADMIN', 'ADMIN'] },
    { path: '/users', icon: Users, label: 'משתמשים', roles: ['SUPER_ADMIN', 'SUB_ADMIN', 'ADMIN'] },
    { path: '/reports', icon: BarChart3, label: 'דוחות', roles: ['SUPER_ADMIN', 'SUB_ADMIN', 'ADMIN'] },
    { path: '/settings', icon: Settings, label: 'הגדרות', roles: ['SUPER_ADMIN', 'SUB_ADMIN'] },
    { path: '/profile', icon: User, label: 'פרופיל', roles: ['SUPER_ADMIN', 'SUB_ADMIN', 'ADMIN', 'DRIVER', 'CLIENT'] },
  ]

  const filteredItems = navigationItems.filter(item => 
    user?.role && item.roles.includes(user.role)
  )

  const handleNavigation = (path: string) => {
    navigate(path)
    setIsOpen(false)
  }

  const isActive = (path: string) => {
    return location.pathname === path
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="lg:hidden fixed bottom-4 right-4 z-40 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
        aria-label="פתח תפריט"
      >
        <Menu className="h-6 w-6" />
      </button>

      {/* Mobile Navigation Overlay */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Navigation Panel */}
          <div className="absolute right-0 top-0 h-full w-80 bg-white shadow-xl">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium">
                    {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                  </div>
                  <div className="mr-3">
                    <p className="text-sm font-medium text-gray-900">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-xs text-gray-500">{user?.role}</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Navigation Items */}
              <nav className="flex-1 overflow-y-auto py-4">
                <div className="space-y-1 px-4">
                  {filteredItems.map((item) => {
                    const Icon = item.icon
                    return (
                      <button
                        key={item.path}
                        onClick={() => handleNavigation(item.path)}
                        className={`w-full flex items-center px-3 py-3 text-right text-sm font-medium rounded-lg transition-colors ${
                          isActive(item.path)
                            ? 'bg-blue-50 text-blue-700 border-r-4 border-blue-700'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <Icon className="ml-3 h-5 w-5" />
                        {item.label}
                      </button>
                    )
                  })}
                </div>
              </nav>

              {/* Footer */}
              <div className="border-t border-gray-200 p-4">
                <PWAStatusIndicator />
                <div className="mt-2 text-xs text-gray-500 text-center">
                  מערכת ניהול אמבולנסים
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// Bottom Navigation for Mobile
export const BottomNavigation = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const bottomItems = [
    { path: '/dashboard', icon: Home, label: 'דשבורד' },
    { path: '/rides', icon: Car, label: 'נסיעות' },
    { path: '/calendar', icon: Calendar, label: 'לוח שנה' },
    { path: '/profile', icon: User, label: 'פרופיל' },
  ]

  const isActive = (path: string) => {
    return location.pathname === path
  }

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30">
      <div className="flex">
        {bottomItems.map((item) => {
          const Icon = item.icon
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex-1 flex flex-col items-center py-2 text-xs ${
                isActive(item.path)
                  ? 'text-blue-600'
                  : 'text-gray-500'
              }`}
            >
              <Icon className="h-5 w-5 mb-1" />
              {item.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default MobileNavigation
