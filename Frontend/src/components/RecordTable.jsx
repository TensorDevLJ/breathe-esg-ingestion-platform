import { useState, useEffect } from 'react'
import { records } from '../api/endpoints'
import { Eye, AlertTriangle } from 'lucide-react'

export default function RecordTable() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    sourceType: '',
    isFlagged: '',
    page: 1,
  })

  useEffect(() => {
    fetchRecords()
  }, [filters])

  const fetchRecords = async () => {
    setLoading(true)
    try {
      const params = {
        page: filters.page,
        ...(filters.sourceType && { source_type: filters.sourceType }),
        ...(filters.isFlagged && { is_flagged: filters.isFlagged === 'true' }),
      }
      const response = await records.list(params)
      setData(response.data)
    } catch (error) {
      console.error('Failed to fetch records:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Filters */}
      <div className="p-6 border-b border-gray-200 flex gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Source Type
          </label>
          <select
            value={filters.sourceType}
            onChange={(e) => setFilters({ ...filters, sourceType: e.target.value, page: 1 })}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="">All Sources</option>
            <option value="SAP">SAP</option>
            <option value="ELECTRICITY">Electricity</option>
            <option value="TRAVEL">Travel</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            value={filters.isFlagged}
            onChange={(e) => setFilters({ ...filters, isFlagged: e.target.value, page: 1 })}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="">All Records</option>
            <option value="false">Approved</option>
            <option value="true">Flagged</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                Facility
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                Source
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                Quantity
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : data.results?.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                  No records found
                </td>
              </tr>
            ) : (
              data.results?.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {record.facility_name || record.facility_code}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {record.source_type}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {record.quantity} {record.unit}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(record.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {record.is_flagged ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full">
                        <AlertTriangle size={14} />
                        Flagged
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                        Approved
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <button className="text-blue-600 hover:text-blue-900 flex items-center gap-1">
                      <Eye size={16} />
                      View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Page {filters.page} of {Math.ceil((data.count || 0) / 50)}
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
            disabled={filters.page === 1}
            className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50"
          >
            Previous
          </button>
          <button
            onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
            disabled={filters.page >= Math.ceil((data.count || 0) / 50)}
            className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}
