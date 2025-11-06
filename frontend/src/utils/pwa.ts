// PWA utilities for service worker registration and management
import React from 'react'

export interface PWAInstallPrompt {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export interface PWACapabilities {
  canInstall: boolean
  isInstalled: boolean
  isStandalone: boolean
  hasServiceWorker: boolean
  canShowNotifications: boolean
}

class PWAManager {
  private deferredPrompt: PWAInstallPrompt | null = null
  private isServiceWorkerRegistered = false

  /**
   * Initialize PWA functionality
   */
  async initialize(): Promise<void> {
    await this.registerServiceWorker()
    this.setupInstallPrompt()
    this.setupUpdateNotification()
  }

  /**
   * Register service worker
   */
  private async registerServiceWorker(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/'
        })

        this.isServiceWorkerRegistered = true
        console.log('Service Worker registered successfully:', registration)

        // Handle service worker updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                this.showUpdateNotification()
              }
            })
          }
        })

      } catch (error) {
        console.error('Service Worker registration failed:', error)
      }
    }
  }

  /**
   * Setup install prompt handling
   */
  private setupInstallPrompt(): void {
    window.addEventListener('beforeinstallprompt', (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault()
      // Stash the event so it can be triggered later
      this.deferredPrompt = e as PWAInstallPrompt
      console.log('PWA install prompt available')
    })

    // Track if app was installed
    window.addEventListener('appinstalled', () => {
      console.log('PWA was installed')
      this.deferredPrompt = null
    })
  }

  /**
   * Setup update notification
   */
  private setupUpdateNotification(): void {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        // Service worker updated, reload the page
        window.location.reload()
      })
    }
  }

  /**
   * Show PWA install prompt
   */
  async showInstallPrompt(): Promise<boolean> {
    if (!this.deferredPrompt) {
      return false
    }

    try {
      await this.deferredPrompt.prompt()
      const choiceResult = await this.deferredPrompt.userChoice
      
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt')
        return true
      } else {
        console.log('User dismissed the install prompt')
        return false
      }
    } catch (error) {
      console.error('Error showing install prompt:', error)
      return false
    }
  }

  /**
   * Check PWA capabilities
   */
  getCapabilities(): PWACapabilities {
    return {
      canInstall: !!this.deferredPrompt,
      isInstalled: window.matchMedia('(display-mode: standalone)').matches || 
                   (window.navigator as any).standalone === true,
      isStandalone: window.matchMedia('(display-mode: standalone)').matches,
      hasServiceWorker: this.isServiceWorkerRegistered,
      canShowNotifications: 'Notification' in window && 
                           Notification.permission === 'granted'
    }
  }

  /**
   * Request notification permission
   */
  async requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      return false
    }

    if (Notification.permission === 'granted') {
      return true
    }

    if (Notification.permission === 'denied') {
      return false
    }

    const permission = await Notification.requestPermission()
    return permission === 'granted'
  }

  /**
   * Show update notification
   */
  private showUpdateNotification(): void {
    // You can implement a custom update notification here
    if (confirm('עדכון חדש זמין! האם תרצה לרענן את הדף?')) {
      window.location.reload()
    }
  }

  /**
   * Send message to service worker
   */
  async sendMessageToSW(message: any): Promise<any> {
    if (!('serviceWorker' in navigator) || !navigator.serviceWorker.controller) {
      return null
    }

    return new Promise((resolve) => {
      const messageChannel = new MessageChannel()
      messageChannel.port1.onmessage = (event) => {
        resolve(event.data)
      }
      navigator.serviceWorker.controller.postMessage(message, [messageChannel.port2])
    })
  }

  /**
   * Check if app is running in standalone mode
   */
  isStandalone(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as any).standalone === true
  }

  /**
   * Get app version from service worker
   */
  async getAppVersion(): Promise<string | null> {
    try {
      const response = await this.sendMessageToSW({ type: 'GET_VERSION' })
      return response?.version || null
    } catch (error) {
      console.error('Error getting app version:', error)
      return null
    }
  }

  /**
   * Skip waiting for service worker update
   */
  async skipWaiting(): Promise<void> {
    if ('serviceWorker' in navigator) {
      await this.sendMessageToSW({ type: 'SKIP_WAITING' })
    }
  }
}

// Create singleton instance
export const pwaManager = new PWAManager()

// Export types and utilities
export { PWAManager }

// PWA installation component props
export interface PWAInstallButtonProps {
  onInstall?: () => void
  onDismiss?: () => void
  className?: string
}

// PWA status hook
export const usePWAStatus = () => {
  const [capabilities, setCapabilities] = React.useState<PWACapabilities>({
    canInstall: false,
    isInstalled: false,
    isStandalone: false,
    hasServiceWorker: false,
    canShowNotifications: false
  })

  React.useEffect(() => {
    const updateCapabilities = () => {
      setCapabilities(pwaManager.getCapabilities())
    }

    updateCapabilities()
    
    // Update capabilities when install prompt changes
    const handleBeforeInstallPrompt = () => {
      updateCapabilities()
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', updateCapabilities)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', updateCapabilities)
    }
  }, [])

  return capabilities
}
