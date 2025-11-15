import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import usePlaywriteFont from '../hooks/usePlaywriteFont'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import mapServerError from '../utils/errorMapper'

const schema = yup.object({
  login: yup.string().required('Login is required'),
  username: yup.string().required('Display name is required'),
  email: yup.string().email('Invalid email address').required('Email is required'),
  password: yup.string()
    .required('Password is required')
    .test('password-strength', 'Password must be at least 8 characters and include letters and numbers', value => {
      if (!value) return false
      return value.length >= 8 && /(?=.*[0-9])(?=.*[A-Za-z])/.test(value)
    }),
  confirm_password: yup.string()
    .oneOf([yup.ref('password')], 'Passwords must match')
    .required('Please confirm your password')
}).required()

export default function Register(){
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
      const payload = {
        login: data.login,
        username: data.username,
        email: data.email,
        password: data.password,
        confirm_password: data.confirm_password
      }

      const res = await api.post('/auth/register', payload)

      if(res.data?.token){
        localStorage.setItem('chronos_token', res.data.token)
        navigate('/dashboard')
        return
      }

      // try auto-login if token not returned
      try{
        const loginRes = await api.post('/auth/login', { email: data.email, password: data.password })
        if(loginRes.data?.token){
          localStorage.setItem('chronos_token', loginRes.data.token)
        }
        navigate('/dashboard')
      }catch(loginErr){
        navigate('/login')
      }
    }catch(err){
      setServerError(mapServerError(err))
    }finally{
      setLoading(false)
    }
  }

  return (
    <div className="full-screen bg-auth playwrite">
      <div style={{maxWidth:520, margin:'0 auto', background:'var(--card)', padding:20}}>
        <h2>Create account</h2>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div style={{marginBottom:12}}>
            <label>Login</label>
            <input {...register('login')} className="form-input" />
            {errors.login && <div className="form-error">{errors.login.message}</div>}
          </div>
          <div style={{marginBottom:12}}>
            <label>Display name</label>
            <input {...register('username')} className="form-input" />
            {errors.username && <div className="form-error">{errors.username.message}</div>}
          </div>
          <div style={{marginBottom:12}}>
            <label>Email</label>
            <input {...register('email')} type="email" className="form-input" />
            {errors.email && <div className="form-error">{errors.email.message}</div>}
          </div>
          <div style={{display:'flex', gap:12, marginBottom:12}}>
            <div style={{flex:1}}>
              <label>Password</label>
              <input {...register('password')} type="password" className="form-input" />
              {errors.password && <div className="form-error">{errors.password.message}</div>}
            </div>
            <div style={{flex:1}}>
              <label>Confirm password</label>
              <input {...register('confirm_password')} type="password" className="form-input" />
              {errors.confirm_password && <div className="form-error">{errors.confirm_password.message}</div>}
            </div>
          </div>
          {serverError && <div role="alert" className="app-error">{serverError}</div>}
          <button type="submit" disabled={loading}>{loading ? 'Creating...' : 'Create account'}</button>
        </form>
      </div>
    </div>
  )
}
