import { Link } from 'react-router-dom'
import { BarChart3, Upload, CheckCircle, History } from 'lucide-react'

export default function Sidebar() {
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
  ]

  return (
    <aside className="w-64 bg-white shadow-lg border-r border-gray-200">
      {/* Branding */}
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-900">Breathe ESG</h1>
        <p className="text-xs text-gray-500 mt-1">v1.0.0</p>
      </div>

      {/* Navigation menu */}
      <nav className="p-4 space-y-2">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-blue-50 group transition-colors"
          >
            <div className="text-gray-600 group-hover:text-blue-600">{item.icon}</div>
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-900">{item.label}</div>
              <div className="text-xs text-gray-500">{item.description}</div>
            </div>
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-gray-50 mx-0 w-64">
        <p className="text-xs text-gray-500 text-center">
          &copy; 2026 Breathe ESG
        </p>
      </div>
    </aside>
  )
}
