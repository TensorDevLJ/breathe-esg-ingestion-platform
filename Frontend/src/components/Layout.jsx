import { useAuthStore } from '../store/authStore'
import Navigation from './Navigation'
import Sidebar from './Sidebar'

export default function Layout({ children }) {

  const { user, logout } = useAuthStore()

  return (

    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100">

      {/* Sidebar */}

      <Sidebar />

      {/* Main section */}

      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Top Navbar */}

        <Navigation
          user={user}
          onLogout={logout}
        />

        {/* Content */}

        <main className="flex-1 overflow-y-auto">

          <div className="max-w-7xl mx-auto px-8 py-8">

            {children}

          </div>

        </main>


        {/* Footer */}

        <footer className="bg-white border-t px-6 py-4">

          <div className="flex justify-between items-center text-sm text-gray-500">

            <p>

              Built by Likhitha J

            </p>

            <p>

              Breathe ESG Internship Prototype

            </p>

          </div>

        </footer>

      </div>

    </div>

  )

}