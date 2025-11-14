import React, { useContext } from 'react'
import { Link } from 'react-router-dom'
import { AuthContext } from '../contexts/AuthContext'

export default function Header(){
  const { user, logout } = useContext(AuthContext)
  // single theme app — theme toggle removed

  return (
    <header style={{ padding:12, boxShadow:'0 1px 0 rgba(0,0,0,0.06)' }}>
      <div className="container" style={{display:'flex', alignItems:'center', gap:16}}>
  <Link to="/" className="brand">Chronos</Link>
  <nav style={{marginLeft:'auto',display:'flex',gap:12, alignItems:'center'}}>
          {/* calendar link intentionally removed while feature is disabled */}
          {!user && (
            <>
              <Link to="/login" className="nav-link">Login</Link>
              <Link to="/register" className="nav-link">Register</Link>
            </>
          )}
          {user && (
            <>
              <span style={{marginLeft:8}}>{user.username || user.login || user.email}</span>
              <button onClick={logout} className="nav-link" style={{marginLeft:8}}>Logout</button>
            </>
          )}

          {/* theme toggle removed — single theme in use */}
        </nav>
      </div>
    </header>
  )
}
