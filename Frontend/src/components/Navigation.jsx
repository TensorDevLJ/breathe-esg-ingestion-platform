import { LogOut, Bell } from 'lucide-react'
import { useAuthStore } from '../store/authStore'

export default function Navigation() {

  const { user, logout } = useAuthStore()

  return (

    <nav className="bg-white shadow-sm border-b border-gray-200">

      <div className="px-6 py-4 flex items-center justify-between">

        {/* Left Logo */}

        <div className="flex items-center">

          <div className="text-2xl font-bold text-blue-600">
            Breathe ESG
          </div>

          <span className="ml-2 text-sm text-gray-500">
            Data Ingestion Platform
          </span>

        </div>



        {/* Right Side */}

        <div className="flex items-center gap-4">

          {/* Notification */}

          <button className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition">

            <Bell size={20}/>

            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>

          </button>



          {/* User Section */}

          <div className="flex items-center gap-3 pl-4 border-l border-gray-200">

            <div className="text-right">

              <div className="text-sm font-medium text-gray-900">

                {user?.email || "admin@breathe.local"}

              </div>

              <div className="text-xs text-gray-500">

                {user?.role || "Analyst"}

              </div>

            </div>


            {/* Logout */}

            <button

              onClick={logout}

              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition"

              title="Logout"

            >

              <LogOut size={18}/>

              <span className="text-sm font-medium">

                Logout

              </span>

            </button>

          </div>

        </div>

      </div>

    </nav>

  )

}