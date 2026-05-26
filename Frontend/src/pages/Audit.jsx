import AuditLog from '../components/AuditLog'

export default function Audit() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Audit Trail</h1>
        <p className="text-gray-600 mt-2">
          View complete change history for compliance and non-repudiation
        </p>
      </div>

      {/* Audit log */}
      <AuditLog />
    </div>
  )
}
