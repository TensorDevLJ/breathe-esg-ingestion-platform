export default function Guide() {

return (

<div className="space-y-8">

<div>
<h1 className="text-4xl font-bold text-gray-900">
How Breathe ESG Works
</h1>

<p className="text-gray-600 mt-3">
Guide for analysts and first-time users
</p>
</div>


{/* Intro */}

<div className="bg-blue-50 p-6 rounded-xl border">

<h2 className="font-bold text-2xl mb-3">
What is this platform?
</h2>

<p className="text-gray-700 leading-7">

Breathe ESG ingests emissions and activity data
from multiple enterprise systems, normalizes the
data into a standard structure, flags suspicious
records, and allows analysts to review and approve
them before final audit submission.

</p>

</div>



{/* Step 1 */}

<div className="bg-white shadow rounded-xl p-6">

<div className="flex items-center gap-4">

<div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">

1

</div>

<h2 className="font-bold text-xl">
Upload ESG Data
</h2>

</div>

<p className="mt-4 text-gray-700">

Go to Upload Data page.

Select a source:

• SAP Procurement Data

• Utility Electricity Data

• Corporate Travel Data

Upload a CSV file.

The system validates and imports records.

</p>

</div>



{/* Step 2 */}

<div className="bg-white shadow rounded-xl p-6">

<div className="flex items-center gap-4">

<div className="w-10 h-10 rounded-full bg-yellow-500 text-white flex items-center justify-center font-bold">

2

</div>

<h2 className="font-bold text-xl">
Automatic Validation
</h2>

</div>

<p className="mt-4 text-gray-700">

The platform automatically checks:

• missing fields

• inconsistent values

• suspicious quantities

• invalid formats

Suspicious rows are flagged.

</p>

</div>



{/* Step 3 */}

<div className="bg-white shadow rounded-xl p-6">

<div className="flex items-center gap-4">

<div className="w-10 h-10 rounded-full bg-green-600 text-white flex items-center justify-center font-bold">

3

</div>

<h2 className="font-bold text-xl">
Review Queue
</h2>

</div>

<p className="mt-4 text-gray-700">

Flagged records appear inside Review page.

Analysts can:

• inspect details

• add notes

• approve

• reject

</p>

</div>




{/* Step 4 */}

<div className="bg-white shadow rounded-xl p-6">

<div className="flex items-center gap-4">

<div className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold">

4

</div>

<h2 className="font-bold text-xl">
Audit Trail
</h2>

</div>

<p className="mt-4 text-gray-700">

Every important action is recorded:

• upload

• approval

• rejection

• edits

• system events

This ensures compliance and traceability.

</p>

</div>




<div className="bg-gray-50 rounded-xl p-6">

<h2 className="font-bold text-xl">
Demo Workflow
</h2>

<p className="mt-3 text-gray-700">

Upload sample CSV →

Review suspicious rows →

Approve →

Open Audit Trail →

Export logs

</p>

</div>

</div>

)

}