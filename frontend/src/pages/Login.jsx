import React, { useState, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { AuthContext } from '../contexts/AuthContext'

export default function Login(){
  const [email,setEmail] = useState('')
  const [password,setPassword] = useState('')
  const [error,setError] = useState(null)
  const navigate = useNavigate()
  const { setUser } = useContext(AuthContext)

  async function submit(e){
    e.preventDefault()
    setError(null)
    try{
      const res = await api.post('/auth/login', { identifier: email, password })
      if(res.data?.user){
        setUser(res.data.user)
      }
      if(res.data?.token) localStorage.setItem('chronos_token', res.data.token)
      navigate('/dashboard')
    }catch(err){
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
