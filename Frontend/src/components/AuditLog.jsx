import { useState, useEffect } from 'react'
import { audit } from '../api/endpoints'
import { History, Download } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

export default function AuditLog() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    action: '',
    startDate: '',
    endDate: '',
  })

  useEffect(() => {
    fetchLogs()
  }, [filters])

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const params = {
        ...(filters.action && { action: filters.action }),
        ...(filters.startDate && { start_date: filters.startDate }),
        ...(filters.endDate && { end_date: filters.endDate }),
      }
      const response = await audit.list(params)
      setLogs(response.data.results || [])
    } catch (error) {
      console.error('Failed to fetch audit logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    try {
      const response = await audit.export({
        ...(filters.action && { action: filters.action }),
        ...(filters.startDate && { start_date: filters.startDate }),
        ...(filters.endDate && { end_date: filters.endDate }),
      })
      // Trigger download
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'audit-log.csv')
      document.body.appendChild(link)
      link.click()
    } catch (error) {
      console.error('Failed to export audit log:', error)
    }
  }

  const actionIcons = {
    CREATED: '✨',
    APPROVED: '✅',
    REJECTED: '❌',
    EDITED: '✏️',
    LOCKED: '🔒',
  }

  const actionColors = {
    CREATED: 'bg-blue-50 border-l-4 border-blue-500',
    APPROVED: 'bg-green-50 border-l-4 border-green-500',
    REJECTED: 'bg-red-50 border-l-4 border-red-500',
    EDITED: 'bg-yellow-50 border-l-4 border-yellow-500',
    LOCKED: 'bg-purple-50 border-l-4 border-purple-500',
  }

  return (
    <div className="space-y-6">
      {/* Filters and Export */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-end justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <History size={24} />
            Audit Trail
          </h2>
          <button
            onClick={handleExport}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg flex items-center gap-2"
          >
            <Download size={18} />
            Export as CSV
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Action Type
            </label>
            <select
              value={filters.action}
              onChange={(e) => setFilters({ ...filters, action: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">All Actions</option>
              <option value="CREATED">Created</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="EDITED">Edited</option>
              <option value="LOCKED">Locked</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
            Loading...
          </div>
        ) : logs.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
            No audit logs found
          </div>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              className={`rounded-lg shadow p-6 ${actionColors[log.action]}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{actionIcons[log.action]}</span>
                  <div>
                    <h3 className="font-bold text-gray-900">
                      {log.action.replace('_', ' ')}
                    </h3>
                    <p className="text-sm text-gray-600">
                      by {log.actor?.email || 'System'} •{' '}
                      {formatDistanceToNow(new Date(log.created_at), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                </div>
                {log.ip_address && (
                  <p className="text-xs text-gray-500">{log.ip_address}</p>
                )}
              </div>

              {/* Changes */}
              {log.changes && Object.keys(log.changes).length > 0 && (
                <div className="bg-white bg-opacity-50 rounded p-3 text-sm">
                  <p className="font-medium text-gray-900 mb-2">Changes:</p>
                  <div className="space-y-1">
                    {Object.entries(log.changes).map(([field, change]) => (
                      <p key={field} className="text-gray-700">
                        <span className="font-medium">{field}:</span>{' '}
                        <span className="line-through text-red-600">
                          {change.old}
                        </span>{' '}
                        →{' '}
                        <span className="text-green-600 font-medium">
                          {change.new}
                        </span>
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* Record reference */}
              <p className="text-xs text-gray-500 mt-3">
                Record: {log.record.id.slice(0, 8)}...
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
