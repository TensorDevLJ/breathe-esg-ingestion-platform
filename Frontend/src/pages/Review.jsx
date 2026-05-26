import ReviewQueue from '../components/ReviewQueue'

export default function Review() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Review & Approve</h1>
        <p className="text-gray-600 mt-2">
          Review flagged records and approve before audit submission
        </p>
      </div>

      {/* Review queue */}
      <ReviewQueue />
    </div>
  )
}
