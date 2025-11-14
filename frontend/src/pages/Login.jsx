import React, { useContext, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { AuthContext } from '../contexts/AuthContext'
import usePlaywriteFont from '../hooks/usePlaywriteFont'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import mapServerError from '../utils/errorMapper'

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const usernameRegex = /^[a-zA-Z0-9._-]{3,}$/

const schema = yup.object({
  identifier: yup.string().required('Email or username is required')
    .test('email-or-username', 'Enter a valid email or username', value => {
      if (!value) return false
      return emailRegex.test(value) || usernameRegex.test(value)
    }),
  password: yup.string().required('Password is required')
}).required()

export default function Login(){
  const { setUser } = useContext(AuthContext)
  const [serverError,setServerError] = useState(null)
  const [loading,setLoading] = useState(false)
  const navigate = useNavigate()
  usePlaywriteFont()

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(schema)
  })

  async function onSubmit(data){
    setServerError(null)
    setLoading(true)
    try{
      const res = await api.post('/auth/login', { identifier: data.identifier, password: data.password })
      if(res.data?.user){
        setUser(res.data.user)
      }
      if(res.data?.token) localStorage.setItem('chronos_token', res.data.token)
      navigate('/dashboard')
    }catch(err){
      setServerError(mapServerError(err))
    }finally{
      setLoading(false)
    }
  }

  return (
    <div className="full-screen bg-auth playwrite">
      <div style={{maxWidth:420, margin:'0 auto', background:'var(--card)', padding:20}}>
        <h2>Login</h2>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div style={{marginBottom:12}}>
            <label>Email or username</label>
            <input {...register('identifier')} type="text" className="form-input" />
            {errors.identifier && <div className="form-error">{errors.identifier.message}</div>}
          </div>
          <div style={{marginBottom:12}}>
            <label>Password</label>
            <input {...register('password')} type="password" className="form-input" />
            {errors.password && <div className="form-error">{errors.password.message}</div>}
          </div>
          {serverError && <div role="alert" className="app-error">{serverError}</div>}
          <button type="submit" disabled={loading}>{loading ? 'Signing in...' : 'Sign in'}</button>
        </form>
      </div>
    </div>
  )
}
