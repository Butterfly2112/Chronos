import React, { useContext } from 'react'
import { Link } from 'react-router-dom'
import { AuthContext } from '../contexts/AuthContext'
import CalendarView from '../components/CalendarView'

export default function Dashboard(){
  const { user } = useContext(AuthContext)

  // Якщо користувач не залогінений — показуємо інформативний лендінг
  if(!user){
    return (
      <div className="full-screen center bg-landing">
        <div className="card landing-card" style={{maxWidth:900, margin:'0 auto', background:'var(--card)', padding:36, textAlign:'center'}}>
          <h2>Chronos — a meetings and events organizer</h2>
          <p>
            Welcome! Chronos helps you organize meetings, tasks, and events for the day, month, or year.
            When you register, a personal default calendar will be created for you automatically.
            We also add a built-in national holidays calendar depending on the user's region.
          </p>
          <div className="landing-cta" style={{display:'flex', gap:16, marginTop:20, justifyContent:'center'}}>
            <Link to="/register"><button>Register</button></Link>
            <Link to="/login"><button>Login</button></Link>
          </div>
        </div>
      </div>
    )
  }


  return (
    <div className="full-screen">
      <div style={{maxWidth:1000, margin:'0 auto'}}>
        <section style={{display:'flex', gap:20}}>
          <div style={{flex:1}}>
            <div style={{background:'var(--card)', padding:16}}>
              <CalendarView apiBase="http://localhost:3000/api" />
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
