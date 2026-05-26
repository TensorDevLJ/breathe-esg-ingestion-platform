import { useState, useEffect } from 'react'
import { review } from '../api/endpoints'
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react'

export default function ReviewQueue() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    status: 'PENDING',
    severity: '',
  })
  const [reviewingId, setReviewingId] = useState(null)
  const [reviewNotes, setReviewNotes] = useState('')

  useEffect(() => {
    fetchItems()
  }, [filters])

  const fetchItems = async () => {
    setLoading(true)
    try {
      const response = await review.list({
        status: filters.status,
        ...(filters.severity && { severity: filters.severity }),
      })
      setItems(response.data.results || [])
    } catch (error) {
      console.error('Failed to fetch review items:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (id) => {
    try {
      await review.approve(id, reviewNotes)
      setReviewingId(null)
      setReviewNotes('')
      fetchItems()
    } catch (error) {
      console.error('Failed to approve:', error)
    }
  }

  const handleReject = async (id) => {
    try {
      await review.reject(id, 'Data quality issue', reviewNotes)
      setReviewingId(null)
      setReviewNotes('')
      fetchItems()
    } catch (error) {
      console.error('Failed to reject:', error)
    }
  }

  const severityColor = {
    LOW: 'bg-blue-100 text-blue-800',
    MEDIUM: 'bg-yellow-100 text-yellow-800',
    HIGH: 'bg-red-100 text-red-800',
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 flex gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Severity
          </label>
          <select
            value={filters.severity}
            onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="">All Levels</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </select>
        </div>
      </div>

      {/* Review items */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
            Loading...
          </div>
        ) : items.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
            No items to review
          </div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-medium text-gray-900">
                      Record ID: {item.normalized_record.id.slice(0, 8)}...
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${severityColor[item.severity]}`}>
                      {item.severity}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm">{item.reason_flagged}</p>
                </div>
              </div>

              {/* Record details */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Facility:</span>
                    <p className="font-medium">{item.normalized_record.facility_name}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Source:</span>
                    <p className="font-medium">{item.normalized_record.source_type}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Quantity:</span>
                    <p className="font-medium">
                      {item.normalized_record.quantity} {item.normalized_record.unit}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Date:</span>
                    <p className="font-medium">
                      {new Date(item.normalized_record.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Review form */}
              {reviewingId === item.id ? (
                <div className="space-y-4 mb-4">
                  <textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="Add your review notes..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    rows="3"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(item.id)}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2"
                    >
                      <CheckCircle size={18} />
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(item.id)}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2"
                    >
                      <XCircle size={18} />
                      Reject
                    </button>
                    <button
                      onClick={() => {
                        setReviewingId(null)
                        setReviewNotes('')
                      }}
                      className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-900 font-medium py-2 px-4 rounded-lg"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => setReviewingId(item.id)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2"
                  >
                    <AlertCircle size={18} />
                    Review
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
