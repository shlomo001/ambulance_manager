import React, { useState } from 'react'
import { Download, Settings, History, TestTube } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { sheetsApi } from '../utils/api'
import Button from './ui/Button'
import LoadingSpinner from './ui/LoadingSpinner'

interface GoogleSheetsExportProps {
  onExport?: () => void
}

const GoogleSheetsExport = ({ onExport }: GoogleSheetsExportProps) => {
  const [isLoading, setIsLoading] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  const handleExport = async () => {
    try {
      setIsLoading(true)
      const response = await sheetsApi.exportRides({})
      
      if (response.success) {
        toast.success(response.message || 'ייצוא הושלם בהצלחה')
        onExport?.()
      } else {
        toast.error(response.error || 'שגיאה בייצוא')
      }
    } catch (error) {
      toast.error('שגיאה בייצוא ל-Google Sheets')
      console.error('Export error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleTestConnection = async () => {
    try {
      setIsLoading(true)
      const response = await sheetsApi.getSettings()
      
      if (response.success) {
        toast.success('חיבור תקין ל-Google Sheets')
      } else {
        toast.error('שגיאה בחיבור ל-Google Sheets')
      }
    } catch (error) {
      toast.error('שגיאה בבדיקת חיבור')
      console.error('Connection test error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Export Actions */}
      <div className="flex flex-wrap gap-3">
        <Button
          onClick={handleExport}
          disabled={isLoading}
          isLoading={isLoading}
          className="inline-flex items-center"
        >
          <Download className="ml-2 h-4 w-4" />
          ייצא נסיעות ל-Google Sheets
        </Button>

        <Button
          variant="outline"
          onClick={handleTestConnection}
          disabled={isLoading}
          className="inline-flex items-center"
        >
          <TestTube className="ml-2 h-4 w-4" />
          בדוק חיבור
        </Button>

        <Button
          variant="outline"
          onClick={() => setShowSettings(!showSettings)}
          className="inline-flex items-center"
        >
          <Settings className="ml-2 h-4 w-4" />
          הגדרות
        </Button>

        <Button
          variant="outline"
          onClick={() => setShowHistory(!showHistory)}
          className="inline-flex items-center"
        >
          <History className="ml-2 h-4 w-4" />
          היסטוריה
        </Button>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <GoogleSheetsSettings onClose={() => setShowSettings(false)} />
      )}

      {/* History Panel */}
      {showHistory && (
        <GoogleSheetsHistory onClose={() => setShowHistory(false)} />
      )}
    </div>
  )
}

// Settings Component
const GoogleSheetsSettings = ({ onClose }: { onClose: () => void }) => {
  const [settings, setSettings] = useState({
    spreadsheetId: '',
    autoSyncEnabled: false,
  })
  const [isLoading, setIsLoading] = useState(false)

  const handleSave = async () => {
    try {
      setIsLoading(true)
      const response = await sheetsApi.updateSettings(settings)
      
      if (response.success) {
        toast.success('הגדרות נשמרו בהצלחה')
        onClose()
      } else {
        toast.error('שגיאה בשמירת הגדרות')
      }
    } catch (error) {
      toast.error('שגיאה בשמירת הגדרות')
      console.error('Settings save error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow border">
      <h3 className="text-lg font-medium text-gray-900 mb-4">הגדרות Google Sheets</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            מזהה Google Sheets
          </label>
          <input
            type="text"
            value={settings.spreadsheetId}
            onChange={(e) => setSettings({ ...settings, spreadsheetId: e.target.value })}
            placeholder="הזן מזהה Google Sheets"
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="autoSync"
            checked={settings.autoSyncEnabled}
            onChange={(e) => setSettings({ ...settings, autoSyncEnabled: e.target.checked })}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="autoSync" className="mr-2 block text-sm text-gray-900">
            ייצוא אוטומטי של נסיעות שהושלמו
          </label>
        </div>
      </div>

      <div className="flex justify-end space-x-3 space-x-reverse mt-6">
        <Button variant="outline" onClick={onClose}>
          ביטול
        </Button>
        <Button onClick={handleSave} isLoading={isLoading}>
          שמור
        </Button>
      </div>
    </div>
  )
}

// History Component
const GoogleSheetsHistory = ({ onClose }: { onClose: () => void }) => {
  const [history, setHistory] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchHistory = async () => {
    try {
      const response = await sheetsApi.getExportHistory()
      if (response.success && response.data) {
        setHistory(response.data)
      }
    } catch (error) {
      console.error('Error fetching history:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch history on mount
  React.useEffect(() => {
    fetchHistory()
  }, [])

  return (
    <div className="bg-white p-6 rounded-lg shadow border">
      <h3 className="text-lg font-medium text-gray-900 mb-4">היסטוריית ייצוא</h3>
      
      {isLoading ? (
        <div className="flex justify-center py-4">
          <LoadingSpinner />
        </div>
      ) : history.length === 0 ? (
        <p className="text-gray-500 text-center py-4">אין היסטוריית ייצוא</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  תאריך ייצוא
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  גיליון
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  כמות נסיעות
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  יוצא על ידי
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  סטטוס
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {history.map((item) => (
                <tr key={item.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(item.exportedAt).toLocaleDateString('he-IL')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.sheetName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.rideIds.length}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.exportedByUser ? 
                      `${item.exportedByUser.firstName} ${item.exportedByUser.lastName}` : 
                      'מערכת'
                    }
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      item.status === 'completed' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {item.status === 'completed' ? 'הושלם' : 'נכשל'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex justify-end mt-6">
        <Button variant="outline" onClick={onClose}>
          סגור
        </Button>
      </div>
    </div>
  )
}

export default GoogleSheetsExport
