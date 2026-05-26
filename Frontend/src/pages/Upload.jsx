import UploadForm from '../components/UploadForm'
import RecordTable from '../components/RecordTable'

export default function Upload() {

  return (

    <div className="space-y-6">

      <div>

        <h1 className="text-3xl font-bold text-gray-900">
          Upload Data
        </h1>

        <p className="text-gray-600 mt-2">
          Import ESG data from your systems
        </p>

      </div>


      <UploadForm />


      <RecordTable />

    </div>

  )

}