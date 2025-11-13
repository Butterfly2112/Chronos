import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

export default function Login(){
  const [email,setEmail] = useState('')
  const [password,setPassword] = useState('')
  const [error,setError] = useState(null)
  const navigate = useNavigate()

  async function submit(e){
    e.preventDefault()
    setError(null)
    try{
      // backend expects { identifier, password } where identifier can be login or email
      const res = await api.post('/auth/login', { identifier: email, password })
      // backend currently uses server session and may not return a token here
      if(res.data?.token) localStorage.setItem('chronos_token', res.data.token)
      // Перехід на головний екран після успішного входу
      navigate('/dashboard')
    }catch(err){
      // backend middleware returns { error: '...' } for validation errors
      setError(err.response?.data?.error || err.response?.data?.message || err.message)
    }
  }

  return (
    <div style={{maxWidth:420, margin:'40px auto', background:'#fff', padding:20}}>
      <h2>Login</h2>
      <form onSubmit={submit}>
        <div style={{marginBottom:12}}>
          <label>Email</label>
          <input value={email} onChange={e=>setEmail(e.target.value)} required style={{width:'100%'}} />
        </div>
        <div style={{marginBottom:12}}>
          <label>Password</label>
          <input value={password} onChange={e=>setPassword(e.target.value)} type="password" required style={{width:'100%'}} />
        </div>
        {error && <div style={{color:'red',marginBottom:8}}>{error}</div>}
        <button type="submit">Sign in</button>
      </form>
    </div>
  )
}
