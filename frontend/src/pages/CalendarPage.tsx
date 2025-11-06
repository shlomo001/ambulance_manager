import { Calendar, Clock, MapPin } from 'lucide-react'

const CalendarPage = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">לוח שנה</h1>
        <p className="mt-1 text-sm text-gray-500">
          תצוגת נסיעות בלוח שנה
        </p>
      </div>

      {/* Calendar Placeholder */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="text-center py-12">
          <Calendar className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">לוח שנה</h3>
          <p className="mt-1 text-sm text-gray-500">
            כאן יוצג לוח שנה עם הנסיעות
          </p>
        </div>
      </div>
    </div>
  )
}

export default CalendarPage
