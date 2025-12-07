import React, { useState, useEffect, useRef, useContext, useMemo, useCallback } from 'react';
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
import CalendarShareModal from "../components/modals/CalendarShareModal";
import EventDeleteModal from "../components/modals/EventDeleteModal";

export default function CalendarView({ apiBase = '/api' }) {
  const calendarRef = useRef(null);
  const [view, setView] = useState('dayGridMonth');
  const [calendars, setCalendars] = useState([]);
  const [regionalCalendars, setRegionalCalendars] = useState([]);
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
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareCalendarId, setShareCalendarId] = useState(null);
  const [menuOpenId, setMenuOpenId] = useState(null);

  // Інформація про користувача з контексту аутентифікації
  const { user: authUser, loading: authLoading } = useContext(AuthContext);
  const [me, setMe] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [calendarLoadError, setCalendarLoadError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCalName, setNewCalName] = useState('');
  const [newCalDesc, setNewCalDesc] = useState('');
  const [newCalDefault, setNewCalDefault] = useState(false);
  const [newCalHolidays, setNewCalHolidays] = useState(false);
  const [creatingCalendar, setCreatingCalendar] = useState(false);
  const [hiddenCalendars, setHiddenCalendars] = useState([]);

  // Створюємо набір дат (Set string YYYY-MM-DD), які є святами
  const holidaySet = useMemo(() => {
    const dates = new Set();
    regionalCalendars.forEach(cal => {
      if (cal.events && Array.isArray(cal.events)) {
        cal.events.forEach(ev => {
          if (ev.startDate) {
            const dateStr = new Date(ev.startDate).toISOString().split('T')[0];
            dates.add(dateStr);
          }
        });
      }
    });
    return dates;
  }, [regionalCalendars]);

  const getDayCellClassNames = useCallback((arg) => {
    if (!selectedCalendar) return [];
    const currentCal = calendars.find(c => (c._id || c.id) === selectedCalendar);
    if (!currentCal) return [];
    const shouldShowHolidays = currentCal.isDefault || currentCal.includeHolidays;
    if (!shouldShowHolidays) {
      return [];
    }
    const offset = arg.date.getTimezoneOffset();
    const cleanDate = new Date(arg.date.getTime() - (offset * 60 * 1000));
    const dateStr = cleanDate.toISOString().split('T')[0];

    if (holidaySet.has(dateStr)) {
      return ['holiday-day-cell'];
    }
    return [];
  }, [selectedCalendar, calendars, holidaySet]); 

  // Завантажує календарі поточного користувача з бекенду.
  async function loadCalendars() {
    try {
      setCalendarLoadError(null);
      const res = await api.get('/calendar/my');
      console.log('loadCalendars response', res);
      const data = res.data?.calendars || [];
      const regularCalendars = data.filter(c => !c.isRegional);
      const regionalCalendarsData = data.filter(c => c.isRegional);
      setCalendars(regularCalendars);
      setRegionalCalendars(regionalCalendarsData);
      if (regularCalendars.length) {
        const defaultCal = regularCalendars.find(c => c.isDefault);
        const preferId = defaultCal ? (defaultCal._id || defaultCal.id) : (regularCalendars[0]._id || regularCalendars[0].id);
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
  const timerRef = useRef(null);
  const [showHamburger, setShowHamburger] = useState(false);

  useEffect(() => {
    if (!sidebarOpen) {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setShowHamburger(true), 200);
    } else {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      setShowHamburger(false);
    }
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [sidebarOpen]);

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

  function toggleHideCalendar(cal) {
    const id = cal._id || cal.id;
    if (cal.isDefault) {
      alert('Main calendar cannot be hidden');
      return;
    }

    setHiddenCalendars(prev => {
      const exists = prev.includes(id);
      const next = exists ? prev.filter(x => x !== id) : [...prev, id];
      if (!exists && selectedCalendar === id) {
        const visible = calendars.find(c => {
          const cid = c._id || c.id;
          return cid !== id && !next.includes(cid);
        });
        if (visible) setSelectedCalendar(visible._id || visible.id);
        else setSelectedCalendar(null);
      }
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
        setRegionalCalendars([]);
        setSelectedCalendar(null);
      }
    };
    handleAuthChange();
  }, [authUser]);

  useEffect(() => {
    if (!menuOpenId) return;
    const handler = () => setMenuOpenId(null);
    window.addEventListener('click', handler);
    return () => window.removeEventListener('click', handler);
  }, [menuOpenId]);

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
        includeHolidays: newCalHolidays,
      };
      const res = await api.post('/calendar/create', body);
      const data = await loadCalendars();
      const created = res.data?.calendar || res.data;
      const createdId = created?._id || created?.id;
      if (createdId) {
        setSelectedCalendar(createdId);
      }
      else if (data && data.length) setSelectedCalendar(data[0]._id || data[0].id);
      setShowCreateModal(false);
      setNewCalName('');
      setNewCalDesc('');
      setNewCalDefault(false);
      setNewCalHolidays(false);
      alert('Calendar created');
    } catch (err) {
      console.error('Create calendar failed', err);
      const msg = err?.response?.data?.message || err?.response?.data?.error || 'Failed to create calendar';
      alert(msg);
    } finally {
      setCreatingCalendar(false);
    }
  }

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

  async function removeCalendarForSelf(cal) {
    const id = cal._id || cal.id;
    if (!confirm('Do you want to remove this calendar from your account?')) return;
    try {
      const res = await api.post(`/calendar/${id}/unshare`, { user_to_unshare: me.id });
      setCalendars(prev => prev.filter(c => (c._id || c.id) !== id));
      setSelectedCalendar(prev => (prev === id ? null : prev));
      alert('Calendar removed from your account');
    } catch (err) {
      console.error('Failed to remove calendar for self', err);
      const msg = err?.response?.data?.message || err?.response?.data?.error || 'Error removing calendar';
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
      const body = { ...formData, calendar: calendarId };
      await api.post(`/event/create`, body);

      setIsModalOpen(false);

      const calendarApi = calendarRef.current?.getApi();
      if (calendarApi) calendarApi.refetchEvents();

    } catch (err) {
      console.error("Create event error", err);
      alert("Error creating event");
    }
  }

  const fetchEvents = useCallback(async (fetchInfo, successCallback, failureCallback) => {
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

      const selectedCal = calendars.find(c => (c._id || c.id) === calendarId);
      if (selectedCal && (selectedCal.isDefault || selectedCal.includeHolidays) && regionalCalendars.length > 0) {
        const holidayEvents = (regionalCalendars[0].events || []).map(ev => ({
          id: ev._id,
          title: ev.title,
          start: ev.startDate,
          end: ev.endDate,
          backgroundColor: '#cd0000',
          borderColor: '#ff6f6fff'
        }));
        events.push(...holidayEvents);
      }

      // Also load events where current user was invited and merge them
      try {
        if (me && me.id) {
          const invitedRes = await api.get(`/event/invited/${me.id}`);
          const invitedEvents = (invitedRes.data?.events || []).map(ev => ({
            id: ev._id,
            title: ev.title,
            start: ev.startDate,
            end: ev.endDate,
            backgroundColor: ev.color,
            borderColor: ev.color
          }));

          // Merge unique by id
          const seen = new Set(events.map(e => String(e.id)));
          for (const ie of invitedEvents) {
            if (!seen.has(String(ie.id))) {
              events.push(ie);
              seen.add(String(ie.id));
            }
          }
        }
      } catch (err) {
        console.error('Failed to load invited events:', err);
      }
      successCallback(events);

    } catch (err) {
      console.error("Failed to load events:", err);
      failureCallback(err);
    }
  }, [selectedCalendar, calendars, hiddenCalendars, regionalCalendars, me]);

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
        dayCellClassNames={getDayCellClassNames}
        events={fetchEvents}
        dateClick={(info) => {
          try {
            const clicked = info.date;
            const start = new Date(clicked);
            if (info.allDay) {
              start.setHours(9, 0, 0, 0);
            }
            const end = new Date(start.getTime() + 60 * 60 * 1000); 

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
          currentUserId={me?.id}
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
          onInvited={async () => {
            try {
              if (selectedEventData?._id) await openEventDetails(selectedEventData._id);
            } catch (e) { console.error('Failed to refresh event after invite', e); }
            try { calendarRef.current?.getApi().refetchEvents(); } catch (e) {}
          }}
      />

      <CalendarShareModal
          isOpen={shareModalOpen}
          calendarId={shareCalendarId}
          onClose={() => setShareModalOpen(false)}
          onShared={async () => {
            try { await loadCalendars(); } catch(e){}
            try { calendarRef.current?.getApi().refetchEvents(); } catch(e){}
          }}
      />

      <EventDeleteModal
          isOpen={deleteModalOpen}
          eventId={selectedEventData?._id}
          onDeleted={() => calendarRef.current?.getApi().refetchEvents()}
          onClose={() => setDeleteModalOpen(false)}
      />
      {showCreateModal && (
        <div style={{position:'fixed', inset:0, display:'flex', alignItems:'center', justifyContent:'center', zIndex:1200, pointerEvents:'none', background: 'rgba(0,0,0,0.6)'}}>
          <div style={{width:420,background:'var(--bg)',padding:18,borderRadius:8,boxShadow:'0 8px 30px rgba(0,0,0,0.6)', pointerEvents:'auto'}}>
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
              <div style={{marginBottom:8}}>
                <label style={{display:'flex', alignItems:'center', fontSize:13}}>
                  <input
                    type="checkbox"
                    className="nice-checkbox"
                    checked={newCalHolidays}
                    onChange={e => setNewCalHolidays(e.target.checked)}
                    style={{marginRight:8}}
                  />
                  Include holidays
                </label>
              </div>
              <div style={{display:'flex',justifyContent:'flex-end',gap:8}}>
                <button type="button" className="btn" onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button type="submit" className="btn primary" disabled={creatingCalendar}>{creatingCalendar ? 'Creating...' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
      <div style={{position: 'absolute', left: 0, top: `calc(var(--header-height) + 33px)`, height: 'calc(100vh - var(--header-height) - 24px)', width: 260, transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)', transition: 'transform 220ms ease', overflow:'auto', zIndex:1300, pointerEvents: sidebarOpen ? 'auto' : 'none'}}>
        <div className="card" style={{padding:12, marginBottom:12, width: 260}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:8}}>
            {sidebarOpen ? (
              <>
                <div style={{display:'flex',flexDirection:'column',alignItems:'flex-start',gap:6}}>
                  <button
                    className="btn primary"
                    onClick={() => {
                      setFormData({
                        title: "",
                        description: "",
                        type: "arrangement",
                        startDate: "",
                        endDate: "",
                        color: "#C9ABC3",
                        repeat: "none",
                      });
                      setSelectedDate(null);
                      setIsModalOpen(true);
                    }}
                    title="Create event"
                    style={{padding:'6px 10px', transform: 'translateY(-4px)'}}
                  >
                    + Create Event
                  </button>
                  <strong style={{marginTop:0, transform: 'translateY(-3px)'}}>My Calendars</strong>
                </div>
                <div style={{display:'flex',gap:8,alignItems:'center', marginTop:6}}>
                  <button className="btn" onClick={() => setShowCreateModal(true)} title="Add calendar"style={{transform: 'translate(40px, 10px)', padding: '5px 10px'}}>+</button>
                  <button className="btn" onClick={() => setSidebarOpen(false)} title="Collapse sidebar" style={{transform: 'translate(-8px, -20px)', padding: '1px 20px'}}>◀</button>
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
                const ownerId = (cal.owner && (cal.owner._id || cal.owner.id)) || cal.owner;
                const isOwner = me && ownerId && String(ownerId) === String(me.id);
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
                      <div style={{position:'relative'}} onClick={(e) => e.stopPropagation()}>
                        <button
                          className="btn"
                          onClick={(e) => { e.stopPropagation(); setMenuOpenId(menuOpenId === calId ? null : calId); }}
                          aria-expanded={menuOpenId === calId}
                          aria-haspopup="true"
                          title="Actions"
                        >
                          ⋮
                        </button>

                        {menuOpenId === calId && (
                          <div
                            style={{
                              position: 'absolute',
                              right: 0,
                              top: 'calc(100% + 6px)',
                              background: 'var(--card)',
                              padding: 8,
                              borderRadius: 8,
                              boxShadow: '0 6px 18px rgba(0,0,0,0.4)',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 6,
                              zIndex: 1600,
                              minWidth: 140
                            }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {!cal.isDefault && (
                              <button
                                className="btn"
                                onClick={(e) => { e.stopPropagation(); toggleHideCalendar(cal); setMenuOpenId(null); }}
                              >
                                {isHidden ? 'Show' : 'Hide'}
                              </button>
                            )}

                            {cal.isDefault ? (
                              isOwner ? (
                                <button
                                  className="btn"
                                  onClick={(e) => { e.stopPropagation(); handleDeleteCalendar(cal); setMenuOpenId(null); }}
                                  title="Clear calendar events"
                                >
                                  Clear
                                </button>
                              ) : (
                                <button
                                  className="btn"
                                  onClick={(e) => { e.stopPropagation(); removeCalendarForSelf(cal); setMenuOpenId(null); }}
                                >
                                  Remove from my calendars
                                </button>
                              )
                            ) : (
                              isOwner ? (
                                <button
                                  className="btn"
                                  onClick={(e) => { e.stopPropagation(); handleDeleteCalendar(cal); setMenuOpenId(null); }}
                                >
                                  Delete
                                </button>
                              ) : (
                                <button
                                  className="btn"
                                  onClick={(e) => { e.stopPropagation(); removeCalendarForSelf(cal); setMenuOpenId(null); }}
                                >
                                  Remove from my calendars
                                </button>
                              )
                            )}

                            {isOwner && !cal.isDefault && (
                              <button
                                className="btn"
                                onClick={(e) => { e.stopPropagation(); setShareCalendarId(calId); setShareModalOpen(true); setMenuOpenId(null); }}
                              >
                                Share
                              </button>
                            )}
                          </div>
                        )}
                      </div>
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
          style={{
            position:'absolute',
            left:8,
            top:`calc(var(--header-height) + 35px)`,
            zIndex:1400,
            padding:'10px 15px',
            borderRadius:6,
            background:'var(--card)',
            // Controlled visibility: appear after 0.3s
            opacity: showHamburger ? 1 : 0,
            transition: 'opacity 180ms ease',
            pointerEvents: showHamburger ? 'auto' : 'none'
          }}
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
        <div className="calendar-wrapper card" style={{flex:1}}>
          {renderCalendar()}
        </div>
      </div>
    </div>
    </>
  );
}