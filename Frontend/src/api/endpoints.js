import apiClient from './client'


// ================= AUTH =================

export const auth = {

  login: (email,password)=>
    apiClient.post(
      '/auth/login/',
      {email,password}
    ),

  logout:()=>
    apiClient.post(
      '/auth/logout/'
    ),

  me:()=>
    apiClient.get(
      '/auth/me/'
    )

}



// ================= UPLOAD =================

export const uploads={

  uploadSAP:(file)=>{

    const formData=new FormData()

    formData.append(
      'file',
      file
    )

    return apiClient.post(
      '/upload/',
      formData,
      {
        headers:{
          'Content-Type':
          'multipart/form-data'
        }
      }
    )
  },



  uploadElectricity:(file)=>{

    const formData=new FormData()

    formData.append(
      'file',
      file
    )

    return apiClient.post(
      '/upload/',
      formData,
      {
        headers:{
          'Content-Type':
          'multipart/form-data'
        }
      }
    )
  },



  uploadTravel:(file)=>{

    const formData=new FormData()

    formData.append(
      'file',
      file
    )

    return apiClient.post(
      '/upload/',
      formData,
      {
        headers:{
          'Content-Type':
          'multipart/form-data'
        }
      }
    )
  }

}



// ================= RECORDS =================

export const records={

  list:()=>
    apiClient.get(
      '/records/'
    ),

  statistics:()=>
    apiClient.get(
      '/dashboard/'
    )

}



// ================= REVIEW =================

export const review={

  list:()=>
    apiClient.get(
      '/review-queue/'
    ),

  approve:(id,notes)=>
    apiClient.post(
      `/review-queue/${id}/approve/`,
      {
        notes
      }
    ),

  reject:(id,reason)=>
    apiClient.post(
      `/review-queue/${id}/reject/`,
      {
        reason
      }
    )

}



// ================= AUDIT =================

export const audit={

  list:()=>
    apiClient.get(
      '/audit-log/'
    ),

  export:()=>
    apiClient.get(
      '/audit-log/export/'
    )

}