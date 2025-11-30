import React, { useContext, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { AuthContext } from '../contexts/AuthContext'
import api from '../services/api'

export default function Header(){
  const { user, logout, setUser } = useContext(AuthContext)

  function getInitials(value){
    if(!value) return 'C'
    const parts = value.split(/\s+|\.|@/).filter(Boolean)
    if(parts.length === 0) return 'C'
    if(parts.length === 1) return parts[0].slice(0,1).toUpperCase()
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  const [imgFailed, setImgFailed] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState(null)
  const [avatarError, setAvatarError] = useState(null)
  const inputRef = useRef(null)
  const BACKEND_ROOT = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'

  async function handleFileChange(e){
    setAvatarError(null)
    const file = e.target.files && e.target.files[0]
    if(!file) return
    const objectUrl = URL.createObjectURL(file)
    setPreview(objectUrl)
    // upload
    const form = new FormData()
    form.append('avatar', file)
    let success = false
    try{
      setUploading(true)
      await api.post('/user/avatar', form, { headers: { 'Content-Type': 'multipart/form-data' } })
      const me = await api.get('/auth/me')
      if(me.data && me.data.user) {
        setUser(me.data.user)
        if(me.data.user.profilePicture){
          const profilePath = String(me.data.user.profilePicture).replace(/^\/+/, '')
          const serverUrl = `${BACKEND_ROOT}/${profilePath}`
          try{ URL.revokeObjectURL(objectUrl) }catch(e){}
          setPreview(serverUrl)
        }
      }
      success = true
    }catch(err){
      setAvatarError(err?.response?.data?.message || 'Upload failed')
      try{ URL.revokeObjectURL(objectUrl) }catch(e){}
      setPreview(null)
    }finally{
      setUploading(false)
    }
  }

  function triggerPick(){
    setAvatarError(null)
    if(inputRef.current) inputRef.current.click()
  }

  return (
    <header style={{ padding: '12px 0', boxShadow:'0 1px 0 rgba(0,0,0,0.06)' }}>
      <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', width:'100%', padding:0}}>
        <Link to="/" className="brand" style={{marginLeft:'15px', paddingLeft:0}}>Chronos</Link>
        <nav style={{display:'flex',gap:12, alignItems:'center', marginRight:0, paddingRight:0}}>
          {!user && (
            <>
              <Link to="/login" className="nav-link">Login</Link>
              <Link to="/register" className="nav-link">Register</Link>
            </>
          )}
          {user && (
            <div className="user-chip">
              <div className="avatar" aria-hidden onClick={triggerPick} title="Click to change avatar">
                  {preview ? (
                    <img src={preview} alt="preview" className="avatar-img" onError={() => setImgFailed(true)} />
                  ) : !imgFailed ? (
                    user.profilePicture ? (
                      <img
                        src={`${BACKEND_ROOT}/${String(user.profilePicture).replace(/^\/+/, '')}`}
                        alt="avatar"
                        className="avatar-img"
                        onError={() => setImgFailed(true)}
                      />
                    ) : (
                      <div className="avatar-initials">{getInitials(user.username || user.login || user.email)}</div>
                    )
                  ) : (
                    getInitials(user.username || user.login || user.email)
                  )}
                  {uploading && <div className="avatar-loading">...</div>}
                  <input ref={inputRef} type="file" accept="image/*" className="avatar-input" onChange={handleFileChange} />
                </div>
              <span className="username">{user.username || user.login || user.email}</span>
              {avatarError && <div className="form-error" style={{marginLeft:8}}>{avatarError}</div>}
              <button onClick={logout} className="btn btn-ghost">Logout</button>
            </div>
          )}
        </nav>
      </div>
    </header>
  )
}
