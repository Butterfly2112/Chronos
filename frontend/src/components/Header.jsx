import React from 'react'
import { Link } from 'react-router-dom'

export default function Header(){
  return (
    <header style={{ background:'#fff', padding:12, boxShadow:'0 1px 0 rgba(0,0,0,0.06)' }}>
      <div className="container" style={{display:'flex', alignItems:'center', gap:16}}>
        <h1 style={{margin:0,fontSize:20}}>Chronos</h1>
        <nav style={{marginLeft:'auto',display:'flex',gap:12}}>
          {/* Посилання для навігації */}
          <Link to="/">Home</Link>
          <Link to="/dashboard">Calendar</Link>
          <Link to="/login">Login</Link>
          <Link to="/register">Register</Link>
        </nav>
      </div>
    </header>
  )
}
