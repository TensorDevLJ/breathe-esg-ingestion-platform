import { useState, useEffect } from 'react'
import { records } from '../api/endpoints'
import {
  Eye,
  AlertTriangle,
  RefreshCw,
  X
} from 'lucide-react'


export default function RecordTable() {

  const [data, setData] = useState({
    count: 0,
    results: []
  })

  const [loading, setLoading] = useState(true)

  const [selectedRecord, setSelectedRecord] =
    useState(null)



  useEffect(() => {

    fetchRecords()

  }, [])



  const fetchRecords = async () => {

    setLoading(true)

    try {

      const response =
        await records.list()

      setData({

        count:
          response.data.results?.length || 0,

        results:
          response.data.results || []

      })

    }

    catch (error) {

      console.error(
        "Failed to fetch records:",
        error
      )

    }

    finally {

      setLoading(false)

    }

  }



  return (

    <>

      <div className="bg-white rounded-lg shadow">


        {/* header */}

        <div className="p-6 border-b flex justify-between items-center">

          <div>

            <h2 className="text-2xl font-bold">

              All Records

            </h2>

            <p className="text-sm text-gray-500">

              View uploaded ESG records

            </p>

          </div>


          <button
            onClick={fetchRecords}
            className="flex items-center gap-2 px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
          >

            <RefreshCw size={16}/>

            Refresh

          </button>

        </div>



        {/* table */}

        <div className="overflow-x-auto">

          <table className="w-full">

            <thead className="bg-gray-50 border-b">

              <tr>

                <th className="px-6 py-4 text-left">
                  Facility
                </th>

                <th className="px-6 py-4 text-left">
                  Source
                </th>

                <th className="px-6 py-4 text-left">
                  Quantity
                </th>

                <th className="px-6 py-4 text-left">
                  Date
                </th>

                <th className="px-6 py-4 text-left">
                  Status
                </th>

                <th className="px-6 py-4 text-left">
                  Actions
                </th>

              </tr>

            </thead>



            <tbody>

              {loading ? (

                <tr>

                  <td
                    colSpan="6"
                    className="text-center py-6"
                  >

                    Loading...

                  </td>

                </tr>

              )

              : data.results.length===0 ? (

                <tr>

                  <td
                    colSpan="6"
                    className="text-center py-6"
                  >

                    No Records Found

                  </td>

                </tr>

              )

              :

              (

                data.results.map((record)=>(

                  <tr
                    key={record.id}
                    className="border-b hover:bg-gray-50"
                  >

                    <td className="px-6 py-4">

                      {record.facility_name ||

                       record.facility_code ||

                       "Unknown"}

                    </td>



                    <td className="px-6 py-4">

                      {record.source_type}

                    </td>



                    <td className="px-6 py-4">

                      {record.quantity}

                      {" "}

                      {record.unit}

                    </td>



                    <td className="px-6 py-4">

                      {

                        record.date ?

                        new Date(
                          record.date
                        ).toLocaleDateString()

                        :

                        "-"

                      }

                    </td>



                    <td className="px-6 py-4">

                      {

                      record.is_flagged ?

                      (

                      <span className="px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 flex items-center gap-1 w-fit">

                      <AlertTriangle size={14}/>

                      Flagged

                      </span>

                      )

                      :

                      (

                      <span className="px-3 py-1 rounded-full bg-green-100 text-green-700">

                      Approved

                      </span>

                      )

                      }

                    </td>



                    <td className="px-6 py-4">

                      <button

                        onClick={()=>setSelectedRecord(record)}

                        className="text-blue-600 flex items-center gap-1"

                      >

                        <Eye size={16}/>

                        View

                      </button>

                    </td>

                  </tr>

                ))

              )}

            </tbody>

          </table>

        </div>



        <div className="p-4 border-t">

          Total Records:

          {" "}

          <b>

          {data.count}

          </b>

        </div>

      </div>




      {/* popup */}


      {

      selectedRecord &&

      (

      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">

      <div className="bg-white p-6 rounded-xl w-[450px]">

      <div className="flex justify-between mb-4">

      <h2 className="text-xl font-bold">

      Record Details

      </h2>

      <button
      onClick={()=>setSelectedRecord(null)}
      >

      <X/>

      </button>

      </div>


      <div className="space-y-3">

      <p>

      <b>Facility:</b>

      {" "}

      {selectedRecord.facility_name}

      </p>

      <p>

      <b>Source:</b>

      {" "}

      {selectedRecord.source_type}

      </p>

      <p>

      <b>Quantity:</b>

      {" "}

      {selectedRecord.quantity}

      {" "}

      {selectedRecord.unit}

      </p>

      <p>

      <b>Date:</b>

      {" "}

      {selectedRecord.date}

      </p>

      <p>

      <b>Status:</b>

      {" "}

      {

      selectedRecord.is_flagged ?

      "Flagged"

      :

      "Approved"

      }

      </p>

      </div>

      </div>

      </div>

      )

      }

    </>

  )

}