import React from 'react'

export default function Dashboard(){
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
