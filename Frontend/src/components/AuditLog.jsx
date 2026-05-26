import { useState, useEffect } from 'react'
import { audit } from '../api/endpoints'

import {
  History,
  Download,
  FileSearch
} from 'lucide-react'

import { formatDistanceToNow } from 'date-fns'

export default function AuditLog() {

const [logs,setLogs]=useState([])

const [loading,setLoading]=useState(true)

const [filters,setFilters]=useState({

action:'',
startDate:'',
endDate:''

})



useEffect(()=>{

fetchLogs()

},[filters])



const fetchLogs=async()=>{

setLoading(true)

try{

const params={

...(filters.action && {

action:filters.action

}),


...(filters.startDate && {

start_date:filters.startDate

}),


...(filters.endDate && {

end_date:filters.endDate

})

}


const response=
await audit.list(params)

setLogs(
response.data.results || []
)

}

catch(error){

console.log(error)

}

finally{

setLoading(false)

}

}



const handleExport=()=>{

alert(
"Audit export initiated"
)

}



const actionIcons={

CREATED:"✨",

APPROVED:"✅",

REJECTED:"❌",

EDITED:"✏️",

LOCKED:"🔒"

}



const actionColors={

CREATED:
"border-blue-500 bg-blue-50",

APPROVED:
"border-green-500 bg-green-50",

REJECTED:
"border-red-500 bg-red-50",

EDITED:
"border-yellow-500 bg-yellow-50",

LOCKED:
"border-purple-500 bg-purple-50"

}



return(

<div className="space-y-6">


{/* header */}


<div className="bg-white rounded-xl shadow p-6">

<div className="flex justify-between items-center mb-6">

<h2 className="text-2xl font-bold flex gap-2 items-center">

<History size={25}/>

Audit Trail

</h2>


<button

onClick={handleExport}

className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex gap-2"

>

<Download size={18}/>

Export

</button>

</div>




<div className="grid md:grid-cols-3 gap-4">


<select

value={filters.action}

onChange={(e)=>

setFilters({

...filters,

action:e.target.value

})

}

className="border rounded-lg p-3"

>

<option value="">

All Actions

</option>

<option value="CREATED">

Created

</option>

<option value="APPROVED">

Approved

</option>

<option value="REJECTED">

Rejected

</option>

<option value="EDITED">

Edited

</option>

<option value="LOCKED">

Locked

</option>

</select>



<input

type="date"

value={filters.startDate}

onChange={(e)=>

setFilters({

...filters,

startDate:e.target.value

})

}

className="border rounded-lg p-3"

/>



<input

type="date"

value={filters.endDate}

onChange={(e)=>

setFilters({

...filters,

endDate:e.target.value

})

}

className="border rounded-lg p-3"

/>

</div>

</div>





{

loading ?

(

<div className="bg-white rounded-xl p-10 text-center shadow">

Loading audit history...

</div>

)

:

logs.length===0 ?

(

<div className="bg-white rounded-xl p-10 text-center shadow">

<FileSearch
size={55}
className="mx-auto text-gray-300"
/>

<h2 className="text-xl font-bold mt-4">

No Audit History Found

</h2>

<p className="text-gray-500 mt-2">

Actions such as uploads, approvals
and edits will appear here

</p>

</div>

)

:

(

logs.map((log)=>(

<div

key={log.id}

className={`border-l-4 rounded-xl shadow p-6

${actionColors[log.action]}

`}

>


<div className="flex justify-between mb-3">

<div className="flex gap-3">

<div className="text-3xl">

{

actionIcons[log.action]

}

</div>


<div>

<h3 className="font-bold">

{

log.action

}

</h3>


<p className="text-sm text-gray-600">

by

{" "}

{

log.actor?.email ||

"System"

}

{" • "}

{

log.created_at ?

formatDistanceToNow(

new Date(

log.created_at

),

{

addSuffix:true

}

)

:

"-"

}

</p>

</div>

</div>

</div>





{

log.changes &&

Object.keys(log.changes).length>0 && (

<div className="bg-white p-4 rounded-lg mt-4">

<h4 className="font-bold mb-2">

Changes

</h4>


{

Object.entries(

log.changes

).map(

([field,change])=>(

<div
key={field}
className="text-sm mb-2"
>

<b>

{field}

</b>

:

<span className="text-red-600 line-through ml-2">

{change.old}

</span>

{" → "}

<span className="text-green-600">

{change.new}

</span>

</div>

)

)

}

</div>

)

}



<p className="text-xs text-gray-500 mt-4">

Record ID:

{" "}

{

log.record?.id ||

"-"

}

</p>

</div>

))

)

}

</div>

)

}