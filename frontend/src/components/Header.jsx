import React, { useContext, useState } from 'react'
import { Link } from 'react-router-dom'
import { AuthContext } from '../contexts/AuthContext'

export default function Header(){
  const { user, logout } = useContext(AuthContext)

  function getInitials(value){
    if(!value) return 'C'
    const parts = value.split(/\s+|\.|@/).filter(Boolean)
    if(parts.length === 0) return 'C'
    if(parts.length === 1) return parts[0].slice(0,1).toUpperCase()
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  const [imgFailed, setImgFailed] = useState(false)

  return (
    <header style={{ padding: '12px 0', boxShadow:'0 1px 0 rgba(0,0,0,0.06)' }}>
      <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', width:'100%', padding:0}}>
        <Link to="/" className="brand" style={{marginLeft:'15px', paddingLeft:0}}>Chronos</Link>
        <nav style={{display:'flex',gap:12, alignItems:'center', marginRight:0, paddingRight:0}}>
          {/* calendar link intentionally removed while feature is disabled */}
          {!user && (
            <>
              <Link to="/login" className="nav-link">Login</Link>
              <Link to="/register" className="nav-link">Register</Link>
            </>
          )}
          {user && (
            <div className="user-chip">
              <div className="avatar" aria-hidden>
                  {!imgFailed ? (
                    <img src="/avatar.jpg" alt="avatar" className="avatar-img" onError={() => setImgFailed(true)} />
                  ) : (
                    getInitials(user.username || user.login || user.email)
                  )}
                </div>
              <span className="username">{user.username || user.login || user.email}</span>
              <button onClick={logout} className="btn btn-ghost">Logout</button>
            </div>
          )}

          {/* theme toggle removed — single theme in use */}
        </nav>
      </div>
    </header>
  )
}
