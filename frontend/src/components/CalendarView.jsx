import React, { useState, useEffect, useRef, useContext } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import api from '../services/api';
import { AuthContext } from '../contexts/AuthContext';

export default function CalendarView({ apiBase = '/api' }) {
  const calendarRef = useRef(null);
  const [view, setView] = useState('dayGridMonth');
  const [calendars, setCalendars] = useState([]);
  const [selectedCalendar, setSelectedCalendar] = useState(null);

  // Інформація про користувача з контексту аутентифікації
  const { user: authUser, loading: authLoading } = useContext(AuthContext);
  const [me, setMe] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [calendarLoadError, setCalendarLoadError] = useState(null);
  // Завантажує календарі поточного користувача з бекенду.
  async function loadCalendars() {
    try {
      setCalendarLoadError(null);
      const res = await api.get('/calendar/my');
      console.log('loadCalendars response', res);
      const data = res.data?.calendars || [];
      setCalendars(data);
      if (data.length && !selectedCalendar) setSelectedCalendar(data[0]._id || data[0].id);
      if (!data.length) setCalendarLoadError('No calendars returned from server');
      return data;
    } catch (err) {
      console.error('Failed to load calendars', err);
      setCalendarLoadError(err?.response?.data?.error || err?.response?.data?.message || String(err));
      return [];
    }
  }

  //при вході завантажує календарі, при виході очищує стан
  useEffect(() => {
    console.log('CalendarView authUser changed', authUser);
    const handleAuthChange = async () => {
      if (authUser) {
        setMe(authUser);
        setIsAuthenticated(true);
        await loadCalendars();
      } else {
        setMe(null);
        setIsAuthenticated(false);
        setCalendars([]);
        setSelectedCalendar(null);
      }
    };
    handleAuthChange();
  }, [authUser]);

  const calendarToUseForRender = selectedCalendar || (calendars && calendars.length ? (calendars[0]._id || calendars[0].id) : null);

  return (
    <div className="calendar-page" style={{display:'flex', gap:16}}>

      <div style={{flex:1}}>
        {!isAuthenticated && (
          <div className="card" style={{marginBottom:12, padding:12, background:'rgba(255,255,255,0.03)'}}>
            <strong>Ви не увійшли</strong>
            <div style={{marginTop:6}}>Щоб створювати події та бачити ваші календарі, будь ласка, <a href="/login">увійдіть в акаунт</a>.</div>
          </div>
        )}

        <div className="calendar-wrapper card" style={{flex:1}}>

      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
        initialView={view}
        firstDay={1}
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'timeGridDay,timeGridWeek,dayGridMonth,listWeek'
        }}
        nowIndicator={true}
        ref={calendarRef}
        height="auto"
      />
      </div>
      </div>
    </div>
  );
}