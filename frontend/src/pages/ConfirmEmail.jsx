import React, { useEffect, useState, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import api from '../services/api'

export default function ConfirmEmail(){
  const [status, setStatus] = useState({ loading: true, success: false, message: '' })
  const navigate = useNavigate()
  const { search } = useLocation()
  const calledRef = useRef(false)

  useEffect(()=>{
    if (calledRef.current) return
    const params = new URLSearchParams(search)
    const statusParam = params.get('status')
    const messageParam = params.get('message')
    const token = params.get('token')

    if(statusParam){
      const success = statusParam === 'success'
      let message = messageParam || (success ? 'Thank you — your account is now active.' : 'Failed to confirm your account.')
      if(message && /already confirmed|already verified/i.test(message)){
        message = 'This email is already verified.'
        setStatus({ loading:false, success:true, message })
        return
      }
      setStatus({ loading:false, success, message })
      return
    }

    if(!token){
      setStatus({ loading:false, success:false, message: 'Confirmation token not found in the link.' })
      return
    }

    async function confirm(){
      try{
        calledRef.current = true
        const res = await api.get('/auth/confirm-email', { params: { token } })
        setStatus({ loading:false, success:true, message: res.data?.message || 'Email confirmed successfully.' })
      }catch(err){
        let msg = err?.response?.data?.message || err?.response?.data?.error || err?.message || 'Failed to confirm email.'
        // if backend indicates email already confirmed, show friendly success state
        if(/already confirmed|already verified/i.test(msg)){
          msg = 'This email is already verified.'
          setStatus({ loading:false, success:true, message: msg })
          return
        }
        setStatus({ loading:false, success:false, message: msg })
      }
    }

    confirm()
  }, [search])

  return (
    <div className="full-screen bg-auth" style={{display:'flex', alignItems:'center', justifyContent:'center'}}>
      <div style={{maxWidth:520, width:'100%', margin:'0 16px', background:'var(--card)', padding:28, borderRadius:10, textAlign:'center', boxShadow:'0 6px 18px rgba(0,0,0,0.08)'}}>
        {status.loading ? (
          <div>
            <h2>Confirming email…</h2>
            <p style={{marginTop:8}}>Please wait while we confirm your email.</p>
          </div>
        ) : (
          <div>
            {status.success ? (
              <div>
                <div style={{fontSize:56, color:'#16a34a', lineHeight:1}}>✔︎</div>
                <h2 style={{color:'#16a34a', marginTop:8}}>Your account has been confirmed</h2>
                <p style={{marginTop:8, fontFamily:'initial'}}>{status.message || 'Thank you — your account is now active.'}</p>
                <div style={{display:'flex', gap:12, justifyContent:'center', marginTop:18}}>
                  <button onClick={()=>navigate('/login')} style={{padding:'10px 14px', background:'#d2965c', color:'#fff', border:'none', borderRadius:6}}>Go to Login</button>
                  <button onClick={()=>navigate('/')} style={{padding:'10px 14px', background:'transparent', color:'#fff', border:'1px solid #e5e7eb', borderRadius:6}}>Home</button>
                </div>
              </div>
            ) : (
              <div>
                <div style={{fontSize:56, color:'rgba(239,68,68,0.9)', lineHeight:1}}>✖︎</div>
                <h2 style={{color:'rgba(239,68,68,0.9)', marginTop:8}}>Confirmation failed</h2>
                {status.message && <div role="alert" className="app-error">{status.message}</div>}
                <div style={{display:'flex', gap:12, justifyContent:'center', marginTop:18}}>
                  <button onClick={()=>navigate('/register')} style={{padding:'10px 14px', background:'#ef4444', color:'#fff', border:'none', borderRadius:6}}>Try again</button>
                  <button onClick={()=>navigate('/')} style={{padding:'10px 14px', background:'transparent', color:'#fff', border:'1px solid #e5e7eb', borderRadius:6}}>Home</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
