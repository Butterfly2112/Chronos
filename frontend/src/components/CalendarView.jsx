import React, { useState, useEffect, useRef, useContext } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import api from '../services/api';
import { AuthContext } from '../contexts/AuthContext';
import EventCreateModal from "../components/modals/EventCreateModal";
import EventViewModal from "../components/modals/EventViewModal";
import EventEditModal from "../components/modals/EventEditModal";
import EventInviteModal from "../components/modals/EventInviteModal";
import EventDeleteModal from "../components/modals/EventDeleteModal";

export default function CalendarView({ apiBase = '/api' }) {
  const calendarRef = useRef(null);
  const [view, setView] = useState('dayGridMonth');
  const [calendars, setCalendars] = useState([]);
  const [selectedCalendar, setSelectedCalendar] = useState(null);

  // Вікно створення події
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "arrangement",
    startDate: "",
    endDate: "",
    color: "#C9ABC3",
    repeat: "none",
  });

  // Вікно перегляду події
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedEventData, setSelectedEventData] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  // Інформація про користувача з контексту аутентифікації
  const { user: authUser, loading: authLoading } = useContext(AuthContext);
  const [me, setMe] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [calendarLoadError, setCalendarLoadError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCalName, setNewCalName] = useState('');
  const [newCalDesc, setNewCalDesc] = useState('');
  const [newCalDefault, setNewCalDefault] = useState(false);
  const [creatingCalendar, setCreatingCalendar] = useState(false);
  const [hiddenCalendars, setHiddenCalendars] = useState([]);
  // Завантажує календарі поточного користувача з бекенду.
  async function loadCalendars() {
    try {
      setCalendarLoadError(null);
      const res = await api.get('/calendar/my');
      console.log('loadCalendars response', res);
      const data = res.data?.calendars || [];
      setCalendars(data);
      if (data.length) {
        // Віддати перевагу календарю за замовчуванням, якщо він є
        const defaultCal = data.find(c => c.isDefault);
        const preferId = defaultCal ? (defaultCal._id || defaultCal.id) : (data[0]._id || data[0].id);
        if (!selectedCalendar || defaultCal) setSelectedCalendar(preferId);
      }
      if (!data.length) setCalendarLoadError('No calendars returned from server');
      return data;
    } catch (err) {
      console.error('Failed to load calendars', err);
      setCalendarLoadError(err?.response?.data?.error || err?.response?.data?.message || String(err));
      return [];
    }
  }

  // Коли змінюється вибраний календар, перезапитати події у FullCalendar
  useEffect(() => {
    if (!selectedCalendar) return;
    const calendarApi = calendarRef.current?.getApi();
    try {
      if (calendarApi) calendarApi.refetchEvents();
    } catch (e) {
      // ignore
    }
  }, [selectedCalendar]);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  function formatForDateTimeLocal(d) {
    if (!d) return '';
    const date = new Date(d);
    const pad = (n) => String(n).padStart(2, '0');
    const yyyy = date.getFullYear();
    const mm = pad(date.getMonth() + 1);
    const dd = pad(date.getDate());
    const hh = pad(date.getHours());
    const min = pad(date.getMinutes());
    return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
  }

  function renderCalendar() {
    return (
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

        events={fetchEvents}
        dateClick={(info) => {
          // Заповнює поля початку/кінця у формі створення події при кліку по даті
          try {
            const clicked = info.date;
            // Якщо клік по події в режимі 'allDay' — ставимо 09:00 місцевого часу
            const start = new Date(clicked);
            if (info.allDay) {
              start.setHours(9, 0, 0, 0);
            }
            const end = new Date(start.getTime() + 60 * 60 * 1000); // +1 година

            setFormData(prev => ({ ...prev, startDate: formatForDateTimeLocal(start), endDate: formatForDateTimeLocal(end) }));
            setSelectedDate(info.date);
            setIsModalOpen(true);
          } catch (e) {
            setSelectedDate(info.date);
            setIsModalOpen(true);
          }
        }}

        eventClick={(info) => {
          info.jsEvent.preventDefault();
          openEventDetails(info.event.id);
        }}
      />
    );
  }

  // Переключає приховування/показ календаря (тільки для не-дефолтних)
  function toggleHideCalendar(cal) {
    const id = cal._id || cal.id;
    if (cal.isDefault) {
      alert('Main calendar cannot be hidden');
      return;
    }

    setHiddenCalendars(prev => {
      const exists = prev.includes(id);
      const next = exists ? prev.filter(x => x !== id) : [...prev, id];

      // Якщо щойно приховали вибраний календар — вибрати інший видимий
      if (!exists && selectedCalendar === id) {
        const visible = calendars.find(c => {
          const cid = c._id || c.id;
          return cid !== id && !next.includes(cid);
        });
        if (visible) setSelectedCalendar(visible._id || visible.id);
        else setSelectedCalendar(null);
      }

      // запустити повторне завантаження подій
      try { calendarRef.current?.getApi().refetchEvents(); } catch (e) {}
      return next;
    });
  }

  async function openEventDetails(eventId) {
    try {
      const res = await api.get(`/event/${eventId}`);
      setSelectedEventData(res.data?.event);
      setViewModalOpen(true);
    } catch (err) {
      console.error("Failed to load event", err);
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

  // Створити новий календар (modal)
  async function createCalendar(e) {
    e.preventDefault();
    if (!newCalName || !newCalName.trim()) {
      alert("Назва календаря обов'язкова");
      return;
    }

    setCreatingCalendar(true);
    try {
      const body = {
        name: newCalName,
        description: newCalDesc,
        isDefault: !!newCalDefault,
      };

      const res = await api.post('/calendar/create', body);

      // Оновити список календарів
      const data = await loadCalendars();

      // Спробувати вибрати щойно створений календар
      const created = res.data?.calendar || res.data;
      const createdId = created?._id || created?.id;
      if (createdId) setSelectedCalendar(createdId);
      else if (data && data.length) setSelectedCalendar(data[0]._id || data[0].id);

      setShowCreateModal(false);
      setNewCalName('');
      setNewCalDesc('');
      setNewCalDefault(false);
      alert('Calendar created');
    } catch (err) {
      console.error('Create calendar failed', err);
      const msg = err?.response?.data?.message || err?.response?.data?.error || 'Failed to create calendar';
      alert(msg);
    } finally {
      setCreatingCalendar(false);
    }
  }

  // Обробник видалення/ресету календаря
  async function handleDeleteCalendar(cal) {
    const id = cal._id || cal.id;
    const isDefault = !!cal.isDefault;
    const confirmMsg = isDefault
      ? 'Are you sure you want to clear all events in the default calendar?'
      : 'Are you sure you want to delete this calendar?';

    if (!confirm(confirmMsg)) return;

    try {
      const res = await api.delete(`/calendar/${id}`);
      const body = res.data || {};

      const lowerMsg = (body.message || '').toLowerCase();

      if (lowerMsg.includes('events of default calendar deleted') || lowerMsg.includes('default calendar remains')) {
        await loadCalendars();
        alert('Default calendar has been reset: all events deleted.');
      }
      else if (res.status === 204 || lowerMsg.includes('calendar deleted')) {
        setCalendars(prev => prev.filter(c => (c._id || c.id) !== id));
        alert(isDefault ? 'Default calendar cleared (events deleted).' : 'Calendar deleted.');
      } else {
        await loadCalendars();
        alert(body.message || 'Operation completed.');
      }
    } catch (err) {
      console.error('Delete calendar failed', err);
      const msg = err?.response?.data?.message || err?.response?.data?.error || 'Error deleting calendar';
      alert(msg);
    }
  }

  async function submitEvent(e) {
    e.preventDefault();

    try {
      let calendarId = selectedCalendar;
      if (!calendarId) {
        const visible = calendars.find(c => !hiddenCalendars.includes(c._id || c.id));
        calendarId = visible ? (visible._id || visible.id) : null;
      }

      if (!calendarId) {
        alert("There is no calendar available to create an event");
        return;
      }

      const body = {
        ...formData,
        calendar: calendarId
      };

      await api.post(`/event/create`, body);

      setIsModalOpen(false);

      const calendarApi = calendarRef.current?.getApi();
      if (calendarApi) calendarApi.refetchEvents();

    } catch (err) {
      console.error("Create event error", err);
      alert("Error creating event");
    }
  }

  async function fetchEvents(fetchInfo, successCallback, failureCallback) {
    try {
      let calendarId = selectedCalendar;
      if (!calendarId) {
        const visible = calendars.find(c => !hiddenCalendars.includes(c._id || c.id));
        calendarId = visible ? (visible._id || visible.id) : null;
      }

      if (!calendarId) {
        successCallback([]);
        return;
      }

      const res = await api.get(`/event/calendar/${calendarId}`);

      const events = (res.data?.events || []).map(ev => ({
        id: ev._id,
        title: ev.title,
        start: ev.startDate,
        end: ev.endDate,
        backgroundColor: ev.color,
        borderColor: ev.color
      }));

      successCallback(events);

    } catch (err) {
      console.error("Failed to load events:", err);
      failureCallback(err);
    }
  }

  function openEditModal() {
    setViewModalOpen(false);
    setEditModalOpen(true);
  }

  function openInviteModal() {
    setViewModalOpen(false);
    setInviteModalOpen(true);
  }

  function openDeleteModal() {
    setViewModalOpen(false);
    setDeleteModalOpen(true);
  }

  return (
    <>
    <div className="calendar-page" style={{display:'flex', gap: sidebarOpen ? 16 : 0}}>

      <EventCreateModal
          isOpen={isModalOpen}
          formData={formData}
          setFormData={setFormData}
          onSubmit={submitEvent}
          onClose={() => setIsModalOpen(false)}
      />

      <EventViewModal
          isOpen={viewModalOpen}
          event={selectedEventData}
          onClose={() => setViewModalOpen(false)}
          onEdit={openEditModal}
          onInvite={openInviteModal}
          onDelete={openDeleteModal}
      />

      <EventEditModal
          isOpen={editModalOpen}
          event={selectedEventData}
          onUpdated={() => calendarRef.current?.getApi().refetchEvents()}
          onClose={() => setEditModalOpen(false)}
      />

      <EventInviteModal
          isOpen={inviteModalOpen}
          eventId={selectedEventData?._id}
          onClose={() => setInviteModalOpen(false)}
      />

      <EventDeleteModal
          isOpen={deleteModalOpen}
          eventId={selectedEventData?._id}
          onDeleted={() => calendarRef.current?.getApi().refetchEvents()}
          onClose={() => setDeleteModalOpen(false)}
      />
      <div style={{position: 'absolute', left: 0, top: `calc(var(--header-height) + 33px)`, height: 'calc(100vh - var(--header-height) - 24px)', width: 260, transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)', transition: 'transform 220ms ease', overflow:'auto', zIndex:1300, pointerEvents: sidebarOpen ? 'auto' : 'none'}}>
        <div className="card" style={{padding:12, marginBottom:12, width: 260}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:8}}>
            {sidebarOpen ? (
              <>
                <strong>Your calendars</strong>
                <div style={{display:'flex',gap:8}}>
                  <button className="btn" onClick={() => setShowCreateModal(true)}>Add calendar</button>
                  <button className="btn" onClick={() => setSidebarOpen(false)} title="Collapse sidebar">◀</button>
                </div>
              </>
            ) : (
              <div style={{display:'flex',alignItems:'center',justifyContent:'center',width:'100%'}}>
                <button className="btn" onClick={() => setSidebarOpen(true)} title="Open sidebar">☰</button>
              </div>
            )}
          </div>
          {sidebarOpen && (
            <>
              <div style={{marginTop:10}}>
              </div>
            </>
          )}  
          <div style={{marginTop: sidebarOpen ? 0 : 6}}>
            {sidebarOpen && calendars.length === 0 && (
              <div style={{color:'var(--muted)'}}>No calendars available</div>
            )}
            {sidebarOpen && (
            <ul style={{listStyle:'none', padding:0, margin:0}}>
              {calendars.map(cal => {
                const calId = cal._id || cal.id;
                const isActive = selectedCalendar === calId;
                const isHidden = hiddenCalendars.includes(calId);
                return (
                  <li
                    key={calId}
                    onClick={() => { if (!isHidden) setSelectedCalendar(calId); }}
                    style={{display:'flex',alignItems:'center',gap:8,padding:'8px 0',borderBottom:'1px solid rgba(255,255,255,0.03)', cursor:isHidden ? 'default' : 'pointer', background: isActive ? 'rgba(107, 107, 107, 0.26)' : 'transparent', opacity: isHidden ? 0.45 : 1, borderRadius: isActive ? 6 : 0, paddingLeft:8, paddingRight:8}}
                  >
                    <div style={{display:'flex',flexDirection:'column'}}>
                        <div style={{fontWeight:600}}>{cal.name}</div>
                        <div style={{fontSize:12,color:'var(--muted)'}}>{cal.description || ''}</div>
                    </div>
                    {cal.isDefault && (
                      <div style={{marginLeft:8,padding:'2px 6px',background:'rgba(255,255,255,0.03)',borderRadius:6,fontSize:12}}>Default</div>
                    )}
                    <div style={{marginLeft:'auto', display:'flex', gap:8}}>
                      {!cal.isDefault && (
                        <>
                          <button className="btn" onClick={(e) => { e.stopPropagation(); toggleHideCalendar(cal); }}>{isHidden ? 'Show' : 'Hide'}</button>
                          <button className="btn" onClick={(e) => { e.stopPropagation(); handleDeleteCalendar(cal); }}>Delete</button>
                        </>
                      )}
                      {cal.isDefault && (
                        <button className="btn" onClick={(e) => { e.stopPropagation(); handleDeleteCalendar(cal); }} title="Clear calendar events">Clear</button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
            )}
          </div>
        </div>
      </div>
      {!sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          title="Open calendars"
          style={{position:'absolute',left:8,top:`calc(var(--header-height) + 35px)`,zIndex:1400,padding:'10px 15px',borderRadius:6,background:'var(--card)'}}
        >
          ☰
        </button>
      )}
      <div style={{flex:1}}>
        <div style={{display:'flex',justifyContent:'flex-end',gap:8,marginBottom:8}}>
        </div>
        {!isAuthenticated && (
          <div className="card" style={{marginBottom:12, padding:12, background:'rgba(255,255,255,0.03)'}}>
            <strong>You're not logged in</strong>
            <div style={{marginTop:6}}>To create events and see your calendars, please <a href="/login">log in to your account</a>.</div>
          </div>
        )}
        <div className="calendar-wrapper card" style={{flex:1, position:'relative'}}>
          {showCreateModal && (
            <div style={{position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', zIndex:1200, pointerEvents:'none'}}>
              <div style={{width:420,background:'var(--card-bg, #0b0b0b)',padding:18,borderRadius:8,boxShadow:'0 8px 30px rgba(0,0,0,0.6)', pointerEvents:'auto'}}>
                <h3 style={{marginTop:0,marginBottom:8}}>Create calendar</h3>
                <form onSubmit={createCalendar}>
                  <div style={{marginBottom:8}}>
                    <label style={{display:'block',fontSize:13,marginBottom:6}}>Name</label>
                    <input
                      value={newCalName}
                      onChange={e => setNewCalName(e.target.value)}
                      className="input"
                      style={{width:'100%'}}
                      placeholder="My calendar"
                    />
                  </div>
                  <div style={{marginBottom:8}}>
                    <label style={{display:'block',fontSize:13,marginBottom:6}}>Description (optional)</label>
                    <textarea
                      value={newCalDesc}
                      onChange={e => setNewCalDesc(e.target.value)}
                      className="input"
                      style={{width:'100%'}}
                      rows={3}
                    />
                  </div>
                  <div style={{display:'flex',justifyContent:'flex-end',gap:8}}>
                    <button type="button" className="btn" onClick={() => setShowCreateModal(false)}>Cancel</button>
                    <button type="submit" className="btn primary" disabled={creatingCalendar}>{creatingCalendar ? 'Creating...' : 'Create'}</button>
                  </div>
                </form>
              </div>
            </div>
          )}
          {renderCalendar()}
        </div>
      </div>
    </div>
    </>
  );
}