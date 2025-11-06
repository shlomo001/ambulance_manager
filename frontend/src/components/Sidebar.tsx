import { NavLink } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Users, 
  Car, 
  Calendar, 
  BarChart3, 
  Settings, 
  User,
  LogOut
} from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { cn } from '../utils/cn'

const Sidebar = () => {
  const { user, logout } = useAuthStore()

  const navigation = [
    {
      name: 'דשבורד',
      href: '/dashboard',
      icon: LayoutDashboard,
      roles: ['SUPER_ADMIN', 'SUB_ADMIN', 'ADMIN', 'DRIVER', 'INSTITUTIONAL_CLIENT']
    },
    {
      name: 'משתמשים',
      href: '/users',
      icon: Users,
      roles: ['SUPER_ADMIN', 'SUB_ADMIN', 'ADMIN']
    },
    {
      name: 'נסיעות',
      href: '/rides',
      icon: Car,
      roles: ['SUPER_ADMIN', 'SUB_ADMIN', 'ADMIN', 'DRIVER', 'INSTITUTIONAL_CLIENT']
    },
    {
      name: 'לוח שנה',
      href: '/calendar',
      icon: Calendar,
      roles: ['SUPER_ADMIN', 'SUB_ADMIN', 'ADMIN']
    },
    {
      name: 'דוחות',
      href: '/reports',
      icon: BarChart3,
      roles: ['SUPER_ADMIN', 'SUB_ADMIN', 'ADMIN']
    },
    {
      name: 'הגדרות',
      href: '/settings',
      icon: Settings,
      roles: ['SUPER_ADMIN', 'SUB_ADMIN']
    },
  ]

  const filteredNavigation = navigation.filter(item => 
    user?.role && item.roles.includes(user.role)
  )

  const handleLogout = () => {
    logout()
  }

  return (
    <div className="hidden lg:flex w-64 bg-white shadow-lg flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-900 text-center">
          מערכת ניהול אמבולנסים
        </h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {filteredNavigation.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  'flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors',
                  isActive
                    ? 'bg-blue-100 text-blue-700 border-r-4 border-blue-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                )
              }
            >
              <Icon className="ml-3 h-5 w-5" />
              {item.name}
            </NavLink>
          )
        })}
      </nav>

      {/* User Info & Logout */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center mb-4">
          <div className="flex-shrink-0">
            <div className="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-white" />
            </div>
          </div>
          <div className="mr-3 flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {user?.role === 'SUPER_ADMIN' && 'מנהל על'}
              {user?.role === 'SUB_ADMIN' && 'סגן מנהל'}
              {user?.role === 'ADMIN' && 'מנהל'}
              {user?.role === 'DRIVER' && 'נהג'}
              {user?.role === 'INSTITUTIONAL_CLIENT' && 'לקוח מוסדי'}
            </p>
          </div>
        </div>
        
        <button
          onClick={handleLogout}
          className="w-full flex items-center px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 rounded-lg transition-colors"
        >
          <LogOut className="ml-3 h-4 w-4" />
          התנתקות
        </button>
      </div>
    </div>
  )
}

export default Sidebar
