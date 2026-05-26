import { useState, useEffect } from 'react'
import { review } from '../api/endpoints'

import {
  CheckCircle,
  XCircle,
  AlertCircle,
  ClipboardCheck
} from 'lucide-react'

export default function ReviewQueue() {

  const [items,setItems]=useState([])

  const [loading,setLoading]=useState(true)

  const [filters,setFilters]=useState({

    status:'PENDING',
    severity:''

  })

  const [reviewingId,setReviewingId]=
  useState(null)

  const [reviewNotes,setReviewNotes]=
  useState('')



  useEffect(()=>{

    fetchItems()

  },[filters])



  const fetchItems=async()=>{

    setLoading(true)

    try{

      const response=
      await review.list({

      status:filters.status,

      ...(filters.severity && {

      severity:filters.severity

      })

      })

      setItems(
      response.data.results || []
      )

    }

    catch(error){

      console.error(
      "Failed loading review queue",
      error
      )

    }

    finally{

      setLoading(false)

    }

  }



  const handleApprove=async(id)=>{

    try{

      await review.approve(
      id,
      reviewNotes
      )

      setReviewingId(null)

      setReviewNotes('')

      fetchItems()

    }

    catch(error){

      console.log(error)

    }

  }



  const handleReject=async(id)=>{

    try{

      await review.reject(

      id,

      "Data quality issue",

      reviewNotes

      )

      setReviewingId(null)

      setReviewNotes('')

      fetchItems()

    }

    catch(error){

      console.log(error)

    }

  }



  const severityColor={

    LOW:
    "bg-blue-100 text-blue-700",

    MEDIUM:
    "bg-yellow-100 text-yellow-700",

    HIGH:
    "bg-red-100 text-red-700"

  }



return(

<div className="space-y-6">




{/* filters */}


<div className="bg-white rounded-xl shadow p-6 flex gap-5">

<div>

<label className="block text-sm font-medium mb-1">

Status

</label>

<select

value={filters.status}

onChange={(e)=>

setFilters({

...filters,

status:e.target.value

})

}

className="border px-3 py-2 rounded-lg"

>

<option value="PENDING">

Pending

</option>

<option value="APPROVED">

Approved

</option>

<option value="REJECTED">

Rejected

</option>

</select>

</div>



<div>

<label className="block text-sm font-medium mb-1">

Severity

</label>

<select

value={filters.severity}

onChange={(e)=>

setFilters({

...filters,

severity:e.target.value

})

}

className="border px-3 py-2 rounded-lg"

>

<option value="">

All Levels

</option>

<option value="LOW">

Low

</option>

<option value="MEDIUM">

Medium

</option>

<option value="HIGH">

High

</option>

</select>

</div>

</div>




{/* Empty state */}



{

!loading &&

items.length===0 ?

(

<div className="bg-white rounded-xl shadow p-10 text-center">

<ClipboardCheck
size={55}
className="mx-auto text-gray-300"
/>

<h2 className="text-xl font-bold mt-4">

No Records To Review

</h2>

<p className="text-gray-500 mt-2">

Suspicious records will appear here automatically

</p>

</div>

)

:

loading ?

(

<div className="bg-white rounded-xl shadow p-8 text-center">

Loading review queue...

</div>

)

:

(

items.map((item)=>(

<div
key={item.id}
className="bg-white rounded-xl shadow p-6"
>

<div className="flex justify-between mb-5">

<div>

<h2 className="font-bold text-lg">

Review Record

</h2>

<p className="text-gray-500 text-sm">

{item.reason_flagged}

</p>

</div>


<span
className={`px-3 py-1 rounded-full text-sm font-medium

${severityColor[item.severity]}

`}
>

{item.severity}

</span>

</div>




<div className="bg-gray-50 rounded-xl p-4 mb-5">

<div className="grid md:grid-cols-2 gap-4">


<div>

<p className="text-sm text-gray-500">

Facility

</p>

<p className="font-medium">

{

item.normalized_record
?.facility_name

||

"Unknown"

}

</p>

</div>


<div>

<p className="text-sm text-gray-500">

Source

</p>

<p className="font-medium">

{

item.normalized_record
?.source_type

||

"-"

}

</p>

</div>



<div>

<p className="text-sm text-gray-500">

Quantity

</p>

<p className="font-medium">

{

item.normalized_record
?.quantity

}

{" "}

{

item.normalized_record
?.unit

}

</p>

</div>


<div>

<p className="text-sm text-gray-500">

Status

</p>

<p className="font-medium">

Pending Review

</p>

</div>

</div>

</div>





{

reviewingId===item.id ?

(

<div className="space-y-4">

<textarea

rows="3"

value={reviewNotes}

onChange={(e)=>

setReviewNotes(
e.target.value
)

}

placeholder="Add analyst notes..."

className="w-full border rounded-lg p-3"

></textarea>


<div className="flex gap-3">

<button

onClick={()=>

handleApprove(item.id)

}

className="flex-1 bg-green-600 text-white rounded-lg py-2 flex justify-center items-center gap-2"

>

<CheckCircle size={18}/>

Approve

</button>


<button

onClick={()=>

handleReject(item.id)

}

className="flex-1 bg-red-600 text-white rounded-lg py-2 flex justify-center items-center gap-2"

>

<XCircle size={18}/>

Reject

</button>

</div>

</div>

)

:

(

<button

onClick={()=>

setReviewingId(item.id)

}

className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2 flex items-center justify-center gap-2"

>

<AlertCircle size={18}/>

Review Record

</button>

)

}

</div>

))

)

}

</div>

)

}