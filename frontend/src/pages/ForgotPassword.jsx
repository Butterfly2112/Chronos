import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import api from '../services/api'
import mapServerError from '../utils/errorMapper'

const schema = yup.object({
  email: yup.string().email('Invalid email address').required('Email is required')
}).required()

export default function ForgotPassword(){
  const [serverError,setServerError] = useState(null)
  const [success,setSuccess] = useState(null)
  const [loading,setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(schema)
  })

  async function onSubmit(data){
    setServerError(null)
    setSuccess(null)
    setLoading(true)
    try{
      const res = await api.post('/auth/request-password-reset', { email: data.email })
      if(res.data?.success){
        setSuccess(res.data.message || 'Password reset email sent')
      }
    }catch(err){
      setServerError(mapServerError(err))
    }finally{
      setLoading(false)
    }
  }

  return (
    <div className="full-screen bg-auth">
      <div style={{maxWidth:480, margin:'0 auto', background:'var(--card)', padding:20}}>
        <h2>Reset password</h2>
        <p>Enter your email and we'll send a link to reset your password.</p>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div style={{marginBottom:12}}>
            <label>Email</label>
            <input {...register('email')} type="email" className="form-input" />
            {errors.email && <div className="form-error">{errors.email.message}</div>}
          </div>
          {serverError && <div role="alert" className="app-error">{serverError}</div>}
          {success && <div role="status" className="app-success">{success}</div>}
          <button type="submit" disabled={loading}>{loading ? 'Sending...' : 'Send reset email'}</button>
        </form>
      </div>
    </div>
  )
}
