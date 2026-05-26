import { useState, useEffect } from 'react'
import { records } from '../api/endpoints'

import {
  Eye,
  AlertTriangle,
  RefreshCw,
  X,
  FileText
} from 'lucide-react'

export default function RecordTable() {

  const [data,setData]=useState({
    count:0,
    results:[]
  })

  const [loading,setLoading]=useState(true)

  const [selectedRecord,setSelectedRecord]=
    useState(null)


  useEffect(()=>{

    fetchRecords()

  },[])



  const fetchRecords=async()=>{

    setLoading(true)

    try{

      const response=
        await records.list()

      setData({

        count:
        response.data.results?.length || 0,

        results:
        response.data.results || []

      })

    }

    catch(error){

      console.error(
        "Failed fetching records",
        error
      )

    }

    finally{

      setLoading(false)

    }

  }



  return(

    <>

    <div className="bg-white rounded-2xl shadow border">

      {/* Header */}

      <div className="p-6 border-b flex justify-between items-center">

        <div>

          <h2 className="text-2xl font-bold">

            All Records

          </h2>

          <p className="text-sm text-gray-500 mt-1">

            Uploaded ESG datasets

          </p>

        </div>


        <button

        onClick={fetchRecords}

        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"

        >

        <RefreshCw size={16}/>

        Refresh

        </button>

      </div>



      {/* Empty state */}

      {

      !loading &&

      data.results.length===0 ?

      (

      <div className="p-12 text-center">

      <FileText
      size={55}
      className="mx-auto text-gray-300"
      />

      <h3 className="mt-4 text-xl font-semibold">

      No Records Found

      </h3>

      <p className="text-gray-500 mt-2">

      Upload CSV files to begin ESG ingestion

      </p>

      </div>

      )

      :

      (


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

      {

      loading ?

      (

      <tr>

      <td
      colSpan="6"
      className="text-center py-10"
      >

      Loading records...

      </td>

      </tr>

      )

      :

      (

      data.results.map((record)=>(

      <tr
      key={record.id}
      className="border-b hover:bg-blue-50 transition"
      >

      <td className="px-6 py-4 font-medium">

      {

      record.facility_name ||

      record.facility_code ||

      "Unknown"

      }

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

      <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full flex items-center gap-1 w-fit">

      <AlertTriangle size={14}/>

      Flagged

      </span>

      )

      :

      (

      <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full">

      Approved

      </span>

      )

      }

      </td>



      <td className="px-6 py-4">

      <button

      onClick={()=>
      setSelectedRecord(record)
      }

      className="flex items-center gap-1 text-blue-600 hover:text-blue-800"

      >

      <Eye size={16}/>

      View

      </button>

      </td>

      </tr>

      ))

      )

      }

      </tbody>

      </table>

      </div>

      )

      }



      <div className="p-5 border-t bg-gray-50">

      Total Records:

      {" "}

      <b>

      {data.count}

      </b>

      </div>

    </div>




    {/* Modal */}


    {

    selectedRecord &&

    (

    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">

    <div className="bg-white rounded-2xl p-7 w-[500px] shadow-xl">

    <div className="flex justify-between mb-6">

    <h2 className="text-2xl font-bold">

    Record Details

    </h2>

    <button

    onClick={()=>

    setSelectedRecord(null)

    }

    >

    <X/>

    </button>

    </div>


    <div className="space-y-4">

    <div>

    <b>Facility:</b>

    {" "}

    {selectedRecord.facility_name}

    </div>


    <div>

    <b>Source:</b>

    {" "}

    {selectedRecord.source_type}

    </div>


    <div>

    <b>Quantity:</b>

    {" "}

    {selectedRecord.quantity}

    {" "}

    {selectedRecord.unit}

    </div>


    <div>

    <b>Date:</b>

    {" "}

    {selectedRecord.date}

    </div>


    <div>

    <b>Status:</b>

    {" "}

    {

    selectedRecord.is_flagged ?

    "Flagged"

    :

    "Approved"

    }

    </div>

    </div>

    </div>

    </div>

    )

    }

    </>

  )

}