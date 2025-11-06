import { Settings, Database, Bell, Shield } from 'lucide-react'

const SettingsPage = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">הגדרות</h1>
        <p className="mt-1 text-sm text-gray-500">
          הגדרות מערכת
        </p>
      </div>

      {/* Settings Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center mb-4">
            <Database className="h-6 w-6 text-blue-500 ml-3" />
            <h3 className="text-lg font-medium text-gray-900">הגדרות Google Sheets</h3>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            הגדרת חיבור ל-Google Sheets לייצוא נתונים
          </p>
          <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700">
            הגדר חיבור
          </button>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center mb-4">
            <Bell className="h-6 w-6 text-green-500 ml-3" />
            <h3 className="text-lg font-medium text-gray-900">הגדרות התראות</h3>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            הגדרת התראות וטיפים
          </p>
          <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700">
            הגדר התראות
          </button>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center mb-4">
            <Shield className="h-6 w-6 text-red-500 ml-3" />
            <h3 className="text-lg font-medium text-gray-900">הגדרות אבטחה</h3>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            הגדרות אבטחה ומשתמשים
          </p>
          <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-red-600 hover:bg-red-700">
            הגדר אבטחה
          </button>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center mb-4">
            <Settings className="h-6 w-6 text-gray-500 ml-3" />
            <h3 className="text-lg font-medium text-gray-900">הגדרות כלליות</h3>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            הגדרות כלליות של המערכת
          </p>
          <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-gray-600 hover:bg-gray-700">
            הגדר כללי
          </button>
        </div>
      </div>
    </div>
  )
}

export default SettingsPage
