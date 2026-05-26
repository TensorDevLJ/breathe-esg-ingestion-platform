import { useState } from 'react'
import { Upload, FileUp, AlertCircle } from 'lucide-react'
import { uploads } from '../api/endpoints'

export default function UploadForm() {

  const [sourceType, setSourceType] = useState('TRAVEL')
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)

  const handleFileChange = (e) => {

    const selectedFile = e.target.files[0]

    if (!selectedFile) return

    if (!selectedFile.name.endsWith('.csv')) {

      setMessage({
        type:'error',
        text:'Please upload CSV only'
      })

      return
    }

    setFile(selectedFile)
    setMessage(null)
  }

  const handleSubmit = async(e)=>{

    e.preventDefault()

    if(!file){

      setMessage({
        type:'error',
        text:'Please select a file'
      })

      return
    }

    setLoading(true)

    try{

      let response

      if(sourceType==="SAP"){

        response=await uploads.uploadSAP(file)

      }else if(sourceType==="ELECTRICITY"){

        response=await uploads.uploadElectricity(file)

      }else{

        response=await uploads.uploadTravel(file)
      }

      setMessage({

        type:'success',

        text:
        `Imported: ${response.data.records_imported}
        
Suspicious: ${response.data.suspicious_records}`

      })

      setFile(null)

    }catch(error){

      setMessage({

        type:'error',

        text:
        error.response?.data?.error ||
        "Upload failed"

      })

    }finally{

      setLoading(false)
    }

  }

  return (

<div className="bg-white rounded-lg shadow p-6">

<h2 className="text-xl font-bold mb-6 flex items-center gap-2">

<Upload size={20}/>
Upload CSV

</h2>

<form onSubmit={handleSubmit}>

<div className="mb-4">

<label className="font-medium">

Source Type

</label>

<select
value={sourceType}
onChange={(e)=>setSourceType(e.target.value)}
className="w-full border p-2 rounded mt-2"
>

<option value="SAP">SAP</option>

<option value="ELECTRICITY">

Electricity

</option>

<option value="TRAVEL">

Travel

</option>

</select>

</div>

<div className="mb-4">

<input
type="file"
accept=".csv"
onChange={handleFileChange}
/>

{file && (

<p className="text-sm text-gray-600 mt-2">

Selected: {file.name}

</p>

)}

</div>

{message &&(

<div className={`p-3 rounded mb-4 ${
message.type==="error"
?'bg-red-100 text-red-700'
:'bg-green-100 text-green-700'
}`}>

<AlertCircle
size={18}
className="inline mr-2"
/>

{message.text}

</div>

)}

<button

type="submit"

disabled={loading}

className="w-full bg-blue-600 text-white p-2 rounded"

>

{loading
? "Uploading..."
: "Upload File"}

</button>

</form>

</div>

)

}