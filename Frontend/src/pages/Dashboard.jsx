import Charts from '../components/Charts'

export default function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Overview of your ESG data ingestion</p>
      </div>

      {/* Charts and statistics */}
      <Charts />
    </div>
  )
}
