import React, { useContext } from 'react'
import { Link } from 'react-router-dom'
import { AuthContext } from '../contexts/AuthContext'

export default function Dashboard(){
  const { user } = useContext(AuthContext)

  // Якщо користувач не залогінений — показуємо інформативний лендінг
  if(!user){
    return (
      <div style={{maxWidth:800, margin:'24px auto', background:'#fff', padding:24}}>
        <h2>Chronos — a meetings and events organizer</h2>
        <p>
          Welcome! Chronos helps you organize meetings, tasks, and events for the day, month, or year.
          When you register, a personal default calendar will be created for you automatically.
          We also add a built-in national holidays calendar depending on the user's region.
        </p>
        <div style={{display:'flex', gap:12, marginTop:16}}>
          <Link to="/register"><button>Register</button></Link>
          <Link to="/login"><button>Login</button></Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{maxWidth:1000, margin:'24px auto'}}>
      <section style={{display:'flex', gap:20}}>
        <aside style={{width:260, background:'#fff', padding:16}}> 
          <h3>Your calendars</h3>
          {/* Тут буде список календарів користувача: main + додаткові */}
          <p>(placeholder)</p>
        </aside>
        <div style={{flex:1}}>
          <div style={{background:'#fff', padding:16}}>
            <h2>Calendar view (month)</h2>
            {/* Основна область для відображення подій у вигляді календаря */}
            <p>This is a placeholder calendar area.</p>
            <div style={{height:380, border:'1px dashed #d1d5db', display:'flex', alignItems:'center', justifyContent:'center'}}>
              <button>Create event (go to /events/new)</button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
