import { BarChart3, Download, TrendingUp } from 'lucide-react'
import GoogleSheetsExport from '../components/GoogleSheetsExport'

const ReportsPage = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">דוחות</h1>
          <p className="mt-1 text-sm text-gray-500">
            דוחות וסטטיסטיקות
          </p>
        </div>
        <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
          <Download className="ml-2 h-4 w-4" />
          ייצא ל-Excel
        </button>
      </div>

      {/* Google Sheets Export */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">ייצוא ל-Google Sheets</h3>
        <GoogleSheetsExport />
      </div>

      {/* Reports Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="text-center py-12">
            <BarChart3 className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">דוח נסיעות</h3>
            <p className="mt-1 text-sm text-gray-500">
              כאן יוצג דוח נסיעות מפורט
            </p>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="text-center py-12">
            <TrendingUp className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">דוח הכנסות</h3>
            <p className="mt-1 text-sm text-gray-500">
              כאן יוצג דוח הכנסות
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ReportsPage
