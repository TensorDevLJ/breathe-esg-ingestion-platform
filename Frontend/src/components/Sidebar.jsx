import { Link, useLocation } from 'react-router-dom'

import {
  BarChart3,
  Upload,
  CheckCircle,
  History,
  BookOpen
} from 'lucide-react'

export default function Sidebar() {

  const location = useLocation()

  const menuItems = [

    {
      path: '/',
      icon: <BarChart3 size={20} />,
      label: 'Dashboard',
      description: 'Overview & statistics',
    },

    {
      path: '/upload',
      icon: <Upload size={20} />,
      label: 'Upload Data',
      description: 'Import CSV files',
    },

    {
      path: '/review',
      icon: <CheckCircle size={20} />,
      label: 'Review & Approve',
      description: 'Flagged records',
    },

    {
      path: '/audit',
      icon: <History size={20} />,
      label: 'Audit Trail',
      description: 'Change history',
    },

    {
      path: '/guide',
      icon: <BookOpen size={20} />,
      label: 'How It Works',
      description: 'Platform guide',
    },

  ]

  return (

    <aside className="w-64 min-h-screen bg-white border-r border-gray-200 flex flex-col shadow-md">

      {/* Branding */}

      <div className="p-6 border-b">

        <h1 className="text-2xl font-bold text-blue-600">

          Breathe ESG

        </h1>

        <p className="text-xs text-gray-500 mt-1">

          Data Ingestion Platform

        </p>

      </div>


      {/* Navigation */}

      <nav className="p-4 flex-1 space-y-2">

        {menuItems.map((item) => {

          const active = location.pathname === item.path

          return (

            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200

              ${
                active
                ? 'bg-blue-100 border-l-4 border-blue-600 shadow-sm'
                : 'hover:bg-gray-100'
              }
              `}
            >

              <div
                className={
                  active
                  ? 'text-blue-600'
                  : 'text-gray-500'
                }
              >

                {item.icon}

              </div>


              <div>

                <div className="font-medium text-gray-900">

                  {item.label}

                </div>

                <div className="text-xs text-gray-500">

                  {item.description}

                </div>

              </div>

            </Link>

          )

        })}

      </nav>


      {/* Footer */}

      <div className="border-t p-4 bg-gray-50">

        <p className="text-xs text-gray-500 text-center">

          Built by Likhitha J

        </p>

        <p className="text-xs text-gray-400 text-center mt-1">

          Breathe ESG Prototype

        </p>

      </div>

    </aside>

  )

}