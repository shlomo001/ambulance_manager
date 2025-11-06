import React, { useState, useEffect } from 'react'
import { Bell, X, Check, Trash2 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useAuthStore } from '../store/authStore'
import { Notification } from '../types'
import Button from './ui/Button'
import LoadingSpinner from './ui/LoadingSpinner'

interface NotificationsProps {
  isOpen: boolean
  onClose: () => void
}

const Notifications = ({ isOpen, onClose }: NotificationsProps) => {
  const { user } = useAuthStore()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (isOpen && user) {
      fetchNotifications()
    }
  }, [isOpen, user])

  const fetchNotifications = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/notifications/my', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setNotifications(data.data)
          setUnreadCount(data.data.filter((n: Notification) => !n.isRead).length)
        }
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      })
      
      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
        )
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/read-all', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      })
      
      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
        setUnreadCount(0)
        toast.success('כל ההתראות סומנו כנקראות')
      }
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  const deleteNotification = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      })
      
      if (response.ok) {
        setNotifications(prev => prev.filter(n => n.id !== notificationId))
        setUnreadCount(prev => {
          const notification = notifications.find(n => n.id === notificationId)
          return notification && !notification.isRead ? prev - 1 : prev
        })
        toast.success('התראה נמחקה')
      }
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'RIDE_ASSIGNED':
        return '🚗'
      case 'RIDE_ACCEPTED':
        return '✅'
      case 'RIDE_DECLINED':
        return '❌'
      case 'RIDE_COMPLETED':
        return '🎉'
      case 'RIDE_CANCELLED':
        return '🚫'
      case 'DRIVER_DECLINED':
        return '⚠️'
      case 'SYSTEM_ALERT':
        return '🔔'
      default:
        return '📢'
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'RIDE_ASSIGNED':
        return 'bg-blue-100 text-blue-800'
      case 'RIDE_ACCEPTED':
        return 'bg-green-100 text-green-800'
      case 'RIDE_DECLINED':
      case 'RIDE_CANCELLED':
        return 'bg-red-100 text-red-800'
      case 'RIDE_COMPLETED':
        return 'bg-emerald-100 text-emerald-800'
      case 'DRIVER_DECLINED':
        return 'bg-yellow-100 text-yellow-800'
      case 'SYSTEM_ALERT':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-25" onClick={onClose} />
      
      <div className="absolute right-0 top-0 h-full w-96 bg-white shadow-xl">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <div className="flex items-center">
              <Bell className="h-5 w-5 text-gray-500 ml-2" />
              <h2 className="text-lg font-medium text-gray-900">התראות</h2>
              {unreadCount > 0 && (
                <span className="mr-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  {unreadCount}
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Actions */}
          {notifications.length > 0 && (
            <div className="border-b border-gray-200 px-6 py-3">
              <Button
                variant="outline"
                size="sm"
                onClick={markAllAsRead}
                disabled={unreadCount === 0}
              >
                <Check className="ml-2 h-4 w-4" />
                סמן הכל כנקרא
              </Button>
            </div>
          )}

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex justify-center items-center h-32">
                <LoadingSpinner />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-gray-500">
                <Bell className="h-8 w-8 mb-2" />
                <p className="text-sm">אין התראות</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 ${
                      !notification.isRead ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center mb-2">
                          <span className="text-lg ml-2">
                            {getNotificationIcon(notification.type)}
                          </span>
                          <h3 className="text-sm font-medium text-gray-900 truncate">
                            {notification.title}
                          </h3>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getNotificationColor(notification.type)}`}>
                            {notification.type}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(notification.createdAt).toLocaleString('he-IL')}
                        </p>
                      </div>
                      
                      <div className="flex items-center space-x-2 space-x-reverse mr-4">
                        {!notification.isRead && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="text-blue-600 hover:text-blue-800"
                            title="סמן כנקרא"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notification.id)}
                          className="text-red-600 hover:text-red-800"
                          title="מחק"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Notifications
