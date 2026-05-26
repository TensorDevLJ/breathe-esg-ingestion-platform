import UploadForm from '../components/UploadForm'
import RecordTable from '../components/RecordTable'

export default function Upload() {

  return (

    <div className="space-y-8">

      {/* Header */}

      <div>

        <h1 className="text-4xl font-bold text-gray-900">

          Upload ESG Data

        </h1>

        <p className="text-gray-600 mt-3 text-lg">

          Import enterprise datasets from SAP exports,
          electricity utility records and travel platforms.

        </p>

      </div>


      {/* Info cards */}

      <div className="grid md:grid-cols-3 gap-6">

        <div className="bg-white rounded-xl p-5 shadow-sm border">

          <h3 className="font-bold text-blue-600">

            SAP Export

          </h3>

          <p className="text-sm text-gray-600 mt-2">

            Upload procurement or fuel datasets exported
            from ERP systems.

          </p>

        </div>


        <div className="bg-white rounded-xl p-5 shadow-sm border">

          <h3 className="font-bold text-green-600">

            Utility Records

          </h3>

          <p className="text-sm text-gray-600 mt-2">

            Import electricity usage CSV exports
            from utility portals.

          </p>

        </div>


        <div className="bg-white rounded-xl p-5 shadow-sm border">

          <h3 className="font-bold text-purple-600">

            Corporate Travel

          </h3>

          <p className="text-sm text-gray-600 mt-2">

            Upload travel activity datasets from
            platforms such as Concur or Navan.

          </p>

        </div>

      </div>


      {/* Upload form */}

      <UploadForm />


      {/* Records table */}

      <RecordTable />

    </div>

  )

}