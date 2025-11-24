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

  async function submitEvent(e) {
    e.preventDefault();

    try {
      const calendarId =
          selectedCalendar ||
          calendars[0]?._id ||
          calendars[0]?.id;

      if (!calendarId) {
        alert("Немає доступного календаря для створення події");
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
      alert("Помилка створення події");
    }
  }

  async function fetchEvents(fetchInfo, successCallback, failureCallback) {
    try {
      const calendarId =
          selectedCalendar ||
          calendars[0]?._id ||
          calendars[0]?.id;

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
    <div className="calendar-page" style={{display:'flex', gap:16}}>

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

        events={fetchEvents}
        dateClick={(info) => {
          setSelectedDate(info.date);
          setIsModalOpen(true);
        }}

        eventClick={(info) => {
          info.jsEvent.preventDefault();
          openEventDetails(info.event.id);
        }}
      />
      </div>
      </div>
    </div>
  );
}