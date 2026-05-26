import { useState, useEffect } from 'react'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { records } from '../api/endpoints'

export default function Charts() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStatistics()
  }, [])

  const fetchStatistics = async () => {
    try {
      const response = await records.statistics()
      setStats(response.data)
    } catch (error) {
      console.error('Failed to fetch statistics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading statistics...</div>
  }

  if (!stats) {
    return <div className="text-center py-8">Unable to load statistics</div>
  }

  // Transform data for charts
  const sourceData = Object.entries(stats.by_source || {}).map(([source, count]) => ({
    name: source,
    value: count,
  }))

  const scopeData = Object.entries(stats.by_scope || {}).map(([scope, count]) => ({
    name: `Scope ${scope}`,
    value: count,
  }))

  const statusData = Object.entries(stats.by_status || {}).map(([status, count]) => ({
    name: status,
    value: count,
  }))

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm font-medium">Total Records</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {stats.total_records?.toLocaleString() || 0}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm font-medium">Flagged</p>
          <p className="text-3xl font-bold text-yellow-600 mt-2">
            {stats.flagged_count?.toLocaleString() || 0}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm font-medium">Approved</p>
          <p className="text-3xl font-bold text-green-600 mt-2">
            {stats.approved_count?.toLocaleString() || 0}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm font-medium">Pending Review</p>
          <p className="text-3xl font-bold text-blue-600 mt-2">
            {stats.pending_count?.toLocaleString() || 0}
          </p>
        </div>
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-2 gap-6">
        {/* Records by source */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold mb-4">Records by Source</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={sourceData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {sourceData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Records by scope */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold mb-4">Records by Scope</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={scopeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Records by status */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold mb-4">Records by Status</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={statusData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Summary stats table */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold mb-4">Summary Statistics</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Total Records</span>
              <span className="font-medium">{stats.total_records?.toLocaleString() || 0}</span>
            </div>
            <div className="flex justify-between text-sm border-t pt-3">
              <span className="text-gray-600">Flagged Records</span>
              <span className="font-medium text-yellow-600">
                {stats.flagged_count?.toLocaleString() || 0}
              </span>
            </div>
            <div className="flex justify-between text-sm border-t pt-3">
              <span className="text-gray-600">Approval Rate</span>
              <span className="font-medium">
                {stats.total_records > 0
                  ? ((stats.approved_count / stats.total_records) * 100).toFixed(1)
                  : 0}
                %
              </span>
            </div>
            <div className="flex justify-between text-sm border-t pt-3">
              <span className="text-gray-600">Pending Review</span>
              <span className="font-medium text-blue-600">
                {stats.pending_count?.toLocaleString() || 0}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
