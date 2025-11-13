import React, { useContext } from 'react'
import { Link } from 'react-router-dom'
import { AuthContext } from '../contexts/AuthContext'

export default function Header(){
  const { user, logout } = useContext(AuthContext)

  return (
    <header style={{ background:'#fff', padding:12, boxShadow:'0 1px 0 rgba(0,0,0,0.06)' }}>
      <div className="container" style={{display:'flex', alignItems:'center', gap:16}}>
        <h1 style={{margin:0,fontSize:20}}>Chronos</h1>
        <nav style={{marginLeft:'auto',display:'flex',gap:12, alignItems:'center'}}>
          <Link to="/dashboard">Calendar</Link>
          {!user && (
            <>
              <Link to="/login">Login</Link>
              <Link to="/register">Register</Link>
            </>
          )}
          {user && (
            <>
              <span style={{marginLeft:8}}>{user.username || user.login || user.email}</span>
              <button onClick={logout} style={{marginLeft:8}}>Logout</button>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
