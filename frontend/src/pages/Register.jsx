import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import usePlaywriteFont from '../hooks/usePlaywriteFont'

export default function Register(){
  const [login, setLogin] = useState('')
  const [username,setUsername] = useState('')
  const [email,setEmail] = useState('')
  const [password,setPassword] = useState('')
  const [confirmPassword,setConfirmPassword] = useState('')
  const [error,setError] = useState(null)
  const [loading,setLoading] = useState(false)
  const navigate = useNavigate()
  usePlaywriteFont()

  async function submit(e){
    e.preventDefault()
    setError(null)
    if(password !== confirmPassword){
      setError('Паролі не співпадають')
      return
    }

    setLoading(true)
    try{
      const payload = {
        login,
        username,
        email,
        password,
        confirm_password: confirmPassword,
      }

      const res = await api.post('/auth/register', payload)

      // Якщо бекенд повертає токен — зберігаємо і переходимо на дашборд
      if(res.data?.token){
        localStorage.setItem('chronos_token', res.data.token)
        navigate('/dashboard')
        return
      }

      // Якщо токен не повернуто — пробуємо авторизуватися відразу
      try{
        const loginRes = await api.post('/auth/login', { email, password })
        if(loginRes.data?.token){
          localStorage.setItem('chronos_token', loginRes.data.token)
        }
        navigate('/dashboard')
      }catch(loginErr){
        // Якщо авто-логін не вдався — переводимо на сторінку входу
        navigate('/login')
      }
    }catch(err){
      // Показуємо повідомлення про помилку з відповіді бекенду або загальну помилку
      setError(err.response?.data?.message || err.response?.data?.error || err.message)
    }finally{
      setLoading(false)
    }
  }

  return (
    <div className="full-screen bg-auth playwrite">
      <div style={{maxWidth:520, margin:'0 auto', background:'var(--card)', padding:20}}>
        <h2>Create account</h2>
        <form onSubmit={submit}>
          <div style={{marginBottom:12}}>
            <label>Login</label>
            <input value={login} onChange={e=>setLogin(e.target.value)} required style={{width:'100%'}} />
          </div>
          <div style={{marginBottom:12}}>
            <label>Display name</label>
            <input value={username} onChange={e=>setUsername(e.target.value)} required style={{width:'100%'}} />
          </div>
          <div style={{marginBottom:12}}>
            <label>Email</label>
            <input value={email} onChange={e=>setEmail(e.target.value)} required style={{width:'100%'}} />
          </div>
          <div style={{display:'flex', gap:12, marginBottom:12}}>
            <div style={{flex:1}}>
              <label>Password</label>
              <input value={password} onChange={e=>setPassword(e.target.value)} type="password" required style={{width:'100%'}} />
            </div>
            <div style={{flex:1}}>
              <label>Confirm password</label>
              <input value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} type="password" required style={{width:'100%'}} />
            </div>
          </div>
          {error && <div style={{color:'rgba(239, 68, 68, 0.62)',marginBottom:8, fontFamily:'initial'}}>{error}</div>}
          <button type="submit" disabled={loading}>{loading ? 'Creating...' : 'Create account'}</button>
        </form>
      </div>
    </div>
  )
}
