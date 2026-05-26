
import { create } from 'zustand'

export const useAuthStore = create((set) => ({

  user: JSON.parse(localStorage.getItem('user')) || null,

  login: async (email,password) => {

    if(
      email==="admin@breathe.local" &&
      password==="demo123"
    ){

      const user={
        email,
        role:"Analyst"
      }

      localStorage.setItem(
        "user",
        JSON.stringify(user)
      )

      set({user})

      return {
        success:true
      }
    }

    return{
      success:false,
      error:"Invalid credentials"
    }
  },

  logout:()=>{

    localStorage.removeItem("user")

    set({
      user:null
    })

  }

}))


// import { create } from 'zustand'

// export const useAuthStore = create((set) => ({
//   user: null,
//   token: localStorage.getItem('token') || null,
//   company: null,

//   login: async (email, password) => {
//     try {
//       const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/login/`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ email, password }),
//       })
//       const data = await response.json()
      
//       if (data.access) {
//         localStorage.setItem('token', data.access)
//         set({ 
//           token: data.access, 
//           user: data.user,
//           company: data.company 
//         })
//         return { success: true }
//       }
//       return { success: false, error: 'Invalid credentials' }
//     } catch (error) {
//       return { success: false, error: error.message }
//     }
//   },

//   logout: () => {
//     localStorage.removeItem('token')
//     set({ user: null, token: null, company: null })
//   },

//   setUser: (user) => set({ user }),
//   setCompany: (company) => set({ company }),
// }))
