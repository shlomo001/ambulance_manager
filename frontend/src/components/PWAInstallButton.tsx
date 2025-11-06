import React, { useState, useEffect } from 'react'
import { Download, X, Smartphone, Monitor } from 'lucide-react'
import { pwaManager, usePWAStatus, PWAInstallButtonProps } from '../utils/pwa'
import Button from './ui/Button'

const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  onInstall,
  onDismiss,
  className = ''
}) => {
  const [isInstalling, setIsInstalling] = useState(false)
  const [showBanner, setShowBanner] = useState(false)
  const capabilities = usePWAStatus()

  useEffect(() => {
    // Show install banner if app can be installed and is not already installed
    if (capabilities.canInstall && !capabilities.isInstalled) {
      // Check if user has previously dismissed the banner
      const dismissed = localStorage.getItem('pwa-install-dismissed')
      if (!dismissed) {
        setShowBanner(true)
      }
    }
  }, [capabilities])

  const handleInstall = async () => {
    try {
      setIsInstalling(true)
      const success = await pwaManager.showInstallPrompt()
      
      if (success) {
        setShowBanner(false)
        onInstall?.()
      }
    } catch (error) {
      console.error('Error installing PWA:', error)
    } finally {
      setIsInstalling(false)
    }
  }

  const handleDismiss = () => {
    setShowBanner(false)
    // Remember that user dismissed the banner
    localStorage.setItem('pwa-install-dismissed', 'true')
    onDismiss?.()
  }

  // Don't show if already installed or can't install
  if (!capabilities.canInstall || capabilities.isInstalled || !showBanner) {
    return null
  }

  return (
    <div className={`fixed bottom-4 left-4 right-4 z-50 ${className}`}>
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-sm mx-auto">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              {capabilities.isStandalone ? (
                <Monitor className="h-6 w-6 text-blue-600" />
              ) : (
                <Smartphone className="h-6 w-6 text-blue-600" />
              )}
            </div>
            <div className="mr-3">
              <h3 className="text-sm font-medium text-gray-900">
                התקן אפליקציה
              </h3>
              <p className="text-xs text-gray-500">
                התקן את האפליקציה לגישה מהירה
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        
        <div className="flex space-x-2 space-x-reverse">
          <Button
            onClick={handleInstall}
            disabled={isInstalling}
            isLoading={isInstalling}
            size="sm"
            className="flex-1"
          >
            <Download className="ml-2 h-4 w-4" />
            התקן
          </Button>
          <Button
            variant="outline"
            onClick={handleDismiss}
            size="sm"
            className="flex-1"
          >
            לא עכשיו
          </Button>
        </div>
      </div>
    </div>
  )
}

// PWA Status Indicator Component
export const PWAStatusIndicator: React.FC = () => {
  const capabilities = usePWAStatus()

  if (!capabilities.hasServiceWorker) {
    return null
  }

  return (
    <div className="flex items-center space-x-2 space-x-reverse text-xs text-gray-500">
      {capabilities.isInstalled && (
        <span className="inline-flex items-center px-2 py-1 rounded-full bg-green-100 text-green-800">
          <Smartphone className="ml-1 h-3 w-3" />
          מותקן
        </span>
      )}
      {capabilities.isStandalone && (
        <span className="inline-flex items-center px-2 py-1 rounded-full bg-blue-100 text-blue-800">
          <Monitor className="ml-1 h-3 w-3" />
          עצמאי
        </span>
      )}
      {capabilities.canShowNotifications && (
        <span className="inline-flex items-center px-2 py-1 rounded-full bg-purple-100 text-purple-800">
          🔔
          התראות
        </span>
      )}
    </div>
  )
}

// PWA Update Notification Component
export const PWAUpdateNotification: React.FC = () => {
  const [showUpdate, setShowUpdate] = useState(false)

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        setShowUpdate(true)
      })
    }
  }, [])

  const handleUpdate = () => {
    window.location.reload()
  }

  if (!showUpdate) {
    return null
  }

  return (
    <div className="fixed top-4 left-4 right-4 z-50">
      <div className="bg-blue-600 text-white rounded-lg shadow-lg p-4 max-w-sm mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium">עדכון זמין</h3>
            <p className="text-xs opacity-90">עדכון חדש זמין לאפליקציה</p>
          </div>
          <button
            onClick={handleUpdate}
            className="bg-white text-blue-600 px-3 py-1 rounded text-xs font-medium hover:bg-gray-100"
          >
            עדכן
          </button>
        </div>
      </div>
    </div>
  )
}

export default PWAInstallButton
