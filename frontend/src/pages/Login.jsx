import React, { useState, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { AuthContext } from '../contexts/AuthContext'
import usePlaywriteFont from '../hooks/usePlaywriteFont'

export default function Login(){
  const [email,setEmail] = useState('')
  const [password,setPassword] = useState('')
  const [error,setError] = useState(null)
  const [loading,setLoading] = useState(false)
  const navigate = useNavigate()
  const { setUser } = useContext(AuthContext)
  usePlaywriteFont()

  async function submit(e){
    e.preventDefault()
    setError(null)
    setLoading(true)
    try{
      const res = await api.post('/auth/login', { identifier: email, password })
      if(res.data?.user){
        setUser(res.data.user)
      }
      if(res.data?.token) localStorage.setItem('chronos_token', res.data.token)
      navigate('/dashboard')
    }catch(err){
      // Покращене повідомлення про помилку: беремо message з відповіді бекенду або приводимо error до рядка
      const apiData = err?.response?.data
      let msg = apiData?.message || apiData?.error || err?.message || 'Login failed'
      if (msg && typeof msg === 'object') {
        try{
          msg = msg.message || JSON.stringify(msg)
        }catch(e){
          msg = 'Login failed'
        }
      }
      setError(msg)
    }
    finally{
      setLoading(false)
    }
  }

  return (
    <div className="full-screen bg-auth playwrite">
      <div style={{maxWidth:420, margin:'0 auto', background:'var(--card)', padding:20}}>
        <h2>Login</h2>
        <form onSubmit={submit}>
          <div style={{marginBottom:12}}>
            <label>Login or email</label>
            <input value={email} onChange={e=>setEmail(e.target.value)} required style={{width:'100%'}} />
          </div>
          <div style={{marginBottom:12}}>
            <label>Password</label>
            <input value={password} onChange={e=>setPassword(e.target.value)} type="password" required style={{width:'100%'}} />
          </div>
          {error && <div role="alert" style={{color:'white', background:'rgba(239, 68, 68, 0.62)', padding:8, borderRadius:4, marginBottom:8, fontFamily:'initial'}}>{error}</div>}
          <button type="submit" disabled={loading}>{loading ? 'Signing in...' : 'Sign in'}</button>
        </form>
      </div>
    </div>
  )
}
