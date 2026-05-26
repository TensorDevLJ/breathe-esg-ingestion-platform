import { useState } from 'react'
import {
  Upload,
  FileUp,
  AlertCircle,
  CheckCircle
} from 'lucide-react'

import { uploads } from '../api/endpoints'

export default function UploadForm() {

  const [sourceType, setSourceType] = useState('TRAVEL')
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)

  const handleFileChange = (e) => {

    const selectedFile = e.target.files?.[0]

    if (!selectedFile) return

    if (!selectedFile.name.endsWith('.csv')) {

      setMessage({
        type: 'error',
        text: 'Only CSV files are supported'
      })

      return
    }

    setFile(selectedFile)
    setMessage(null)
  }


  const handleSubmit = async (e) => {

    e.preventDefault()

    if (!file) {

      setMessage({
        type: 'error',
        text: 'Please select a file'
      })

      return
    }

    setLoading(true)

    try {

      let response

      if (sourceType === "SAP") {

        response =
          await uploads.uploadSAP(file)

      }

      else if (sourceType === "ELECTRICITY") {

        response =
          await uploads.uploadElectricity(file)

      }

      else {

        response =
          await uploads.uploadTravel(file)

      }


      setMessage({

        type: 'success',

        text: `✓ Upload Successful

Records Imported: ${response.data.records_imported}

Suspicious Records: ${response.data.suspicious_records}

Review Queue Updated`

      })

      setFile(null)

    }

    catch (error) {

      setMessage({

        type: 'error',

        text:
          error.response?.data?.error ||
          'Upload failed'

      })

    }

    finally {

      setLoading(false)

    }

  }


  return (

    <div className="bg-white rounded-2xl shadow border p-8">

      {/* Header */}

      <div className="flex items-center gap-3 mb-6">

        <div className="bg-blue-100 p-3 rounded-xl">

          <Upload
            className="text-blue-600"
            size={25}
          />

        </div>

        <div>

          <h2 className="text-2xl font-bold">

            Upload ESG Data

          </h2>

          <p className="text-sm text-gray-500">

            Import enterprise datasets

          </p>

        </div>

      </div>



      <form onSubmit={handleSubmit}>


        {/* Source */}

        <div className="mb-6">

          <label className="font-medium">

            Data Source

          </label>

          <select

            value={sourceType}

            onChange={(e)=>
              setSourceType(e.target.value)
            }

            className="w-full mt-2 border rounded-xl p-3"

          >

            <option value="SAP">

              SAP Procurement

            </option>

            <option value="ELECTRICITY">

              Utility Electricity

            </option>

            <option value="TRAVEL">

              Corporate Travel

            </option>

          </select>

        </div>



        {/* Upload area */}

        <div className="mb-6">

          <label className="font-medium">

            Upload CSV

          </label>

          <div className="mt-3 border-2 border-dashed rounded-xl p-8 text-center hover:border-blue-500 transition">

            <input

              type="file"

              accept=".csv"

              onChange={handleFileChange}

              className="hidden"

              id="upload"

            />

            <label
              htmlFor="upload"
              className="cursor-pointer"
            >

              <FileUp
                size={40}
                className="mx-auto text-gray-400"
              />

              <p className="mt-3 text-gray-600">

                {
                  file
                    ? file.name
                    : "Click here to upload CSV"
                }

              </p>

            </label>

          </div>

        </div>



        {/* Help */}

        <div className="bg-gray-50 rounded-xl p-4 mb-6">

          <p className="font-medium mb-2">

            Supported formats:

          </p>

          <ul className="text-sm text-gray-600 space-y-1">

            <li>• SAP exports</li>

            <li>• Utility portal CSV</li>

            <li>• Corporate travel datasets</li>

          </ul>

        </div>



        {/* Message */}

        {message && (

          <div

            className={`rounded-xl p-4 mb-6 flex gap-3

            ${
              message.type === "error"
              ? "bg-red-100 text-red-700"
              : "bg-green-100 text-green-700"
            }`}

          >

            {

              message.type === "error"

              ?

              <AlertCircle />

              :

              <CheckCircle />

            }

            <div className="whitespace-pre-line">

              {message.text}

            </div>

          </div>

        )}



        {/* Button */}

        <button

          type="submit"

          disabled={loading}

          className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl p-3 font-medium"

        >

          {

            loading

            ?

            "Uploading..."

            :

            "Upload File"

          }

        </button>

      </form>

    </div>

  )

}