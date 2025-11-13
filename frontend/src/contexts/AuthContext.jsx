import React, { createContext, useState, useEffect } from 'react'
import api from '../services/api'

export const AuthContext = createContext({ user: null })

export function AuthProvider({ children }){
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(()=>{
    // при монтуванні намагаємось отримати поточного користувача з сесії
    let mounted = true
    async function fetchMe(){
      try{
        const res = await api.get('/auth/me')
        if(mounted && res.data && res.data.user){
          setUser(res.data.user)
        }
      }catch(err){
        // якщо неавторизований або сталася помилка — залишаємо user = null
        setUser(null)
      }finally{
        if(mounted) setLoading(false)
      }
    }
    fetchMe()
    return ()=> { mounted = false }
  },[])

  async function logout(){
    try{
      await api.post('/auth/logout')
    }catch(err){
      // помилку при logout ігноруємо — просто очищуємо локальний стан
    }
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, setUser, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthProvider
