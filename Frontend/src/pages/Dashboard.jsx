import Charts from '../components/Charts'
import {
  Database,
  Upload,
  ShieldCheck,
  FileCheck,
  AlertTriangle
} from 'lucide-react'

export default function Dashboard() {

  return (

    <div className="space-y-8">

      {/* Hero Section */}

      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 text-white shadow-lg">

        <h1 className="text-4xl font-bold mb-3">
          Breathe ESG Dashboard
        </h1>

        <p className="text-blue-100 text-lg max-w-3xl">

          A prototype ESG Data Ingestion Platform designed to ingest
          SAP exports, electricity records, and corporate travel data,
          normalize emissions data, detect suspicious entries,
          enable analyst review workflows, and maintain audit history.

        </p>

      </div>


      {/* Quick Workflow */}

      <div>

        <h2 className="text-2xl font-bold text-gray-800 mb-4">

          How the system works

        </h2>

        <div className="grid md:grid-cols-4 gap-5">

          <div className="bg-white rounded-xl p-6 shadow">

            <Upload
              className="text-blue-600 mb-4"
              size={32}
            />

            <h3 className="font-semibold text-lg">
              Upload Data
            </h3>

            <p className="text-sm text-gray-600 mt-2">

              Import SAP, Utility and Travel CSV datasets.

            </p>

          </div>


          <div className="bg-white rounded-xl p-6 shadow">

            <Database
              className="text-green-600 mb-4"
              size={32}
            />

            <h3 className="font-semibold text-lg">
              Normalize
            </h3>

            <p className="text-sm text-gray-600 mt-2">

              Convert different source formats into a common structure.

            </p>

          </div>


          <div className="bg-white rounded-xl p-6 shadow">

            <AlertTriangle
              className="text-yellow-600 mb-4"
              size={32}
            />

            <h3 className="font-semibold text-lg">
              Detect Issues
            </h3>

            <p className="text-sm text-gray-600 mt-2">

              High values or suspicious data are automatically flagged.

            </p>

          </div>


          <div className="bg-white rounded-xl p-6 shadow">

            <ShieldCheck
              className="text-purple-600 mb-4"
              size={32}
            />

            <h3 className="font-semibold text-lg">
              Audit & Review
            </h3>

            <p className="text-sm text-gray-600 mt-2">

              Analysts approve records before audit submission.

            </p>

          </div>

        </div>

      </div>


      {/* Assignment Goal */}

      <div className="bg-white rounded-xl p-6 shadow">

        <div className="flex items-center gap-3 mb-3">

          <FileCheck
            className="text-blue-600"
            size={28}
          />

          <h2 className="text-2xl font-bold">

            Prototype Goal

          </h2>

        </div>

        <p className="text-gray-600 leading-7">

          This prototype demonstrates an end-to-end ESG ingestion
          workflow inspired by real enterprise onboarding scenarios.
          Data from multiple systems enters the platform, gets
          normalized, suspicious records are identified, analysts
          review and approve them, and an immutable audit trail
          captures important actions.

        </p>

      </div>


      {/* Existing charts */}

      <Charts />

    </div>

  )

}