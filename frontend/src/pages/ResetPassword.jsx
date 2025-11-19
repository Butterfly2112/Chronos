import React, { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import api from '../services/api'
import mapServerError from '../utils/errorMapper'

const passwordTest = yup.string().required('Password is required')
  .test('pwd-rule', 'Password must be at least 8 characters and include letters and numbers', val => {
    if(!val) return false
    const v = String(val).trim()
    try {
      const hasLetter = /\p{L}/u.test(v)
      const hasNumber = /\p{N}/u.test(v)
      return hasLetter && hasNumber && v.length >= 8
    } catch (e) {
      return /[A-Za-z]/.test(v) && /[0-9]/.test(v) && v.length >= 8
    }
  })

const schema = yup.object({
  password: passwordTest,
  confirm: yup.string().oneOf([yup.ref('password')], 'Passwords must match').required('Please confirm your password')
}).required()

export default function ResetPassword(){
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const navigate = useNavigate()
  const [serverError,setServerError] = useState(null)
  const [success,setSuccess] = useState(null)
  const [loading,setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: yupResolver(schema) })

  useEffect(() => {
    if(!token){
      setServerError('Reset token not provided')
    }
  }, [token])

  async function onSubmit(data){
    setServerError(null)
    setSuccess(null)
    setLoading(true)
    try{
      const res = await api.post(`/auth/reset-password`, { token, password: data.password, confirm_password: data.confirm })
      if(res.data?.success){
        setSuccess('Password updated successfully. Redirecting to login...')
        setTimeout(() => navigate('/login'), 2000)
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
        <h2>Set a new password</h2>
        {!token && <div className="form-error">No token provided. Use the link from your email.</div>}
        {token && (
          <form onSubmit={handleSubmit(onSubmit)}>
            <div style={{marginBottom:12}}>
              <label>New password</label>
              <input {...register('password')} type="password" className="form-input" />
              {errors.password && <div className="form-error">{errors.password.message}</div>}
            </div>
            <div style={{marginBottom:12}}>
              <label>Confirm password</label>
              <input {...register('confirm')} type="password" className="form-input" />
              {errors.confirm && <div className="form-error">{errors.confirm.message}</div>}
            </div>
            {serverError && <div role="alert" className="app-error">{serverError}</div>}
            {success && <div role="status" className="app-success">{success}</div>}
            <button type="submit" disabled={loading}>{loading ? 'Updating...' : 'Set new password'}</button>
          </form>
        )}
      </div>
    </div>
  )
}
