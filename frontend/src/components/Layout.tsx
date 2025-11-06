import { ReactNode } from 'react'
import Sidebar from './Sidebar'
import Header from './Header'
import MobileNavigation, { BottomNavigation } from './MobileNavigation'

interface LayoutProps {
  children: ReactNode
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <main className="flex-1 p-6 pb-16 lg:pb-6">
            {children}
          </main>
        </div>
      </div>
      
      {/* Mobile Navigation */}
      <MobileNavigation />
      <BottomNavigation />
    </div>
  )
}

export default Layout
