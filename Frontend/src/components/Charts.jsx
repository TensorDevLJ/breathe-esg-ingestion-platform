import { useState,useEffect } from 'react'

import {

BarChart,
Bar,
PieChart,
Pie,
Cell,
XAxis,
YAxis,
CartesianGrid,
Tooltip,
ResponsiveContainer

} from 'recharts'

import {

Database,
AlertTriangle,
CheckCircle,
Clock

} from 'lucide-react'

import { records } from '../api/endpoints'

export default function Charts(){

const [stats,setStats]=useState(null)

const [loading,setLoading]=useState(true)



useEffect(()=>{

fetchStatistics()

},[])



const fetchStatistics=async()=>{

try{

const response=
await records.statistics()

setStats(response.data)

}

catch(error){

console.log(error)

}

finally{

setLoading(false)

}

}



if(loading){

return(

<div className="bg-white rounded-xl shadow p-10 text-center">

Loading dashboard analytics...

</div>

)

}



if(!stats){

return(

<div className="bg-white rounded-xl shadow p-10 text-center">

Unable to load analytics

</div>

)

}



const sourceData=

Object.entries(
stats.by_source||{}
)

.map(([source,count])=>({

name:source,

value:count

}))



const scopeData=

Object.entries(
stats.by_scope||{}
)

.map(([scope,count])=>({

name:`Scope ${scope}`,

value:count

}))



const statusData=

Object.entries(
stats.by_status||{}
)

.map(([status,count])=>({

name:status,

value:count

}))



const COLORS=[

'#2563eb',
'#10b981',
'#f59e0b',
'#ef4444',
'#8b5cf6'

]



return(

<div className="space-y-8">


{/* stat cards */}


<div className="grid md:grid-cols-4 gap-6">


<div className="bg-white rounded-xl shadow p-6">

<div className="flex justify-between">

<div>

<p className="text-sm text-gray-500">

Total Records

</p>

<h2 className="text-3xl font-bold mt-2">

{stats.total_records || 0}

</h2>

</div>

<Database
className="text-blue-600"
size={35}
/>

</div>

</div>




<div className="bg-white rounded-xl shadow p-6">

<div className="flex justify-between">

<div>

<p className="text-sm text-gray-500">

Flagged

</p>

<h2 className="text-3xl font-bold mt-2 text-yellow-600">

{stats.flagged_count || 0}

</h2>

</div>

<AlertTriangle
className="text-yellow-600"
size={35}
/>

</div>

</div>





<div className="bg-white rounded-xl shadow p-6">

<div className="flex justify-between">

<div>

<p className="text-sm text-gray-500">

Approved

</p>

<h2 className="text-3xl font-bold mt-2 text-green-600">

{stats.approved_count || 0}

</h2>

</div>

<CheckCircle
className="text-green-600"
size={35}
/>

</div>

</div>





<div className="bg-white rounded-xl shadow p-6">

<div className="flex justify-between">

<div>

<p className="text-sm text-gray-500">

Pending

</p>

<h2 className="text-3xl font-bold mt-2 text-blue-600">

{stats.pending_count || 0}

</h2>

</div>

<Clock
className="text-blue-600"
size={35}
/>

</div>

</div>

</div>




<div className="grid md:grid-cols-2 gap-6">




<div className="bg-white rounded-xl shadow p-6">

<h2 className="font-bold text-xl mb-4">

Records By Source

</h2>

<ResponsiveContainer
width="100%"
height={300}
>

<PieChart>

<Pie

data={sourceData}

dataKey="value"

outerRadius={100}

label

>

{

sourceData.map((entry,index)=>(

<Cell

key={index}

fill={
COLORS[index%COLORS.length]
}

/>

))

}

</Pie>

<Tooltip/>

</PieChart>

</ResponsiveContainer>

</div>





<div className="bg-white rounded-xl shadow p-6">

<h2 className="font-bold text-xl mb-4">

Records By Scope

</h2>

<ResponsiveContainer
width="100%"
height={300}
>

<BarChart data={scopeData}>

<CartesianGrid strokeDasharray="3 3"/>

<XAxis dataKey="name"/>

<YAxis/>

<Tooltip/>

<Bar
dataKey="value"
fill="#2563eb"
/>

</BarChart>

</ResponsiveContainer>

</div>





<div className="bg-white rounded-xl shadow p-6">

<h2 className="font-bold text-xl mb-4">

Status Distribution

</h2>

<ResponsiveContainer
width="100%"
height={300}
>

<BarChart data={statusData}>

<CartesianGrid strokeDasharray="3 3"/>

<XAxis dataKey="name"/>

<YAxis/>

<Tooltip/>

<Bar
dataKey="value"
fill="#10b981"
/>

</BarChart>

</ResponsiveContainer>

</div>





<div className="bg-white rounded-xl shadow p-6">

<h2 className="font-bold text-xl mb-5">

Summary

</h2>

<div className="space-y-4">

<div className="flex justify-between">

<span>

Approval Rate

</span>

<b>

{

stats.total_records>0

?

((stats.approved_count/
stats.total_records)*100)

.toFixed(1)

:

0

}%

</b>

</div>


<div className="flex justify-between">

<span>

Pending Reviews

</span>

<b>

{stats.pending_count}

</b>

</div>


<div className="flex justify-between">

<span>

Flagged Records

</span>

<b>

{stats.flagged_count}

</b>

</div>

</div>

</div>

</div>

</div>

)

}