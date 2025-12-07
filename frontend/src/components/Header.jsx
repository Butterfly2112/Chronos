import React, { useContext, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { AuthContext } from '../contexts/AuthContext'
import api from '../services/api'
import { useNavigate } from 'react-router-dom'
import EventViewModal from "../components/modals/EventViewModal";

export default function Header(){
  const { user, logout, setUser } = useContext(AuthContext)

  function getInitials(value){
    if(!value) return 'C'
    const parts = value.split(/\s+|\.|@/).filter(Boolean)
    if(parts.length === 0) return 'C'
    if(parts.length === 1) return parts[0].slice(0,1).toUpperCase()
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  const [imgFailed, setImgFailed] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState(null)
  const [avatarError, setAvatarError] = useState(null)
  const inputRef = useRef(null)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loadingSearch, setLoadingSearch] = useState(false)
  const [modalEvent, setModalEvent] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const searchTimeout = useRef(null)
  const navigate = useNavigate()

  const BACKEND_ROOT = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'

  async function handleFileChange(e){
    setAvatarError(null)
    const file = e.target.files && e.target.files[0]
    if(!file) return
    const objectUrl = URL.createObjectURL(file)
    setPreview(objectUrl)
    // upload
    const form = new FormData()
    form.append('avatar', file)
    let success = false
    try{
      setUploading(true)
      await api.post('/user/avatar', form, { headers: { 'Content-Type': 'multipart/form-data' } })
      const me = await api.get('/auth/me')
      if(me.data && me.data.user) {
        setUser(me.data.user)
        if(me.data.user.profilePicture){
          const profilePath = String(me.data.user.profilePicture).replace(/^\/+/, '')
          const serverUrl = `${BACKEND_ROOT}/${profilePath}`
          try{ URL.revokeObjectURL(objectUrl) }catch(e){}
          setPreview(serverUrl)
        }
      }
      success = true
    }catch(err){
      setAvatarError(err?.response?.data?.message || 'Upload failed')
      try{ URL.revokeObjectURL(objectUrl) }catch(e){}
      setPreview(null)
    }finally{
      setUploading(false)
    }
  }

  function triggerPick(){
    setAvatarError(null)
    if(inputRef.current) inputRef.current.click()
  }

  function handleSearch(value){
    setQuery(value)

    if(searchTimeout.current)
      clearTimeout(searchTimeout.current)

    if(!value.trim()){
      setResults([])
      return
    }

    searchTimeout.current = setTimeout(async () => {
      try{
        setLoadingSearch(true)
        const res = await api.get(`/event/search?q=${value}`)
        setResults(res.data || [])
      }catch(e){
        setResults([])
      }finally{
        setLoadingSearch(false)
      }
    }, 300)
  }

  async function openEvent(event) {
    try {
      const res = await api.get(`/event/${event._id}`);
      setModalEvent(res.data.event || res.data); // залежно від бекенду
      setModalOpen(true);
      setResults([]);
      setQuery('');
    } catch (err) {
      console.error("Failed to fetch event details", err);
    }
  }

  return (
      <>
    <header style={{ padding: '12px 0', boxShadow:'0 1px 0 rgba(0,0,0,0.06)' }}>
      <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', width:'100%', padding:0}}>
        <Link to="/" className="brand" style={{marginLeft:'15px', paddingLeft:0}}>Chronos</Link>
        <nav style={{display:'flex',gap:12, alignItems:'center', marginRight:0, paddingRight:0}}>
          {!user && (
            <>
              <Link to="/login" className="nav-link">Login</Link>
              <Link to="/register" className="nav-link">Register</Link>
            </>
          )}
          {user && (
              <>
                <div className="header-search" style={{ position: 'relative', width: '200px' }}>
                  <input
                      type="text"
                      placeholder="Search events..."
                      value={query}
                      onChange={(e) => handleSearch(e.target.value)}
                      style={{
                        width: '100%',
                        backgroundColor: '#b9a38d',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: '1px solid #3a2f28',
                        fontSize: '0.9rem',
                        outline: 'none',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                        transition: 'border-color 0.2s',
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#b9a38d'}
                      onBlur={(e) => e.target.style.borderColor = '#3a2f28'}
                  />

                  {loadingSearch && (
                      <div style={{
                        position: 'absolute',
                        top: '36px',
                        left: 0,
                        width: '100%',
                        padding: '6px',
                        background: '#b9a38d',
                        border: '1px solid #2b211b',
                        borderRadius: '6px',
                        fontSize: '0.85rem',
                        color: '#2b211b',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                        zIndex: 10,
                      }}>
                        Searching...
                      </div>
                  )}

                  {results.length > 0 && (
                      <div style={{
                        position: 'absolute',
                        top: '36px',
                        left: 0,
                        width: '100%',
                        background: '#b9a38d',
                        border: '1px solid #3a2f28',
                        borderRadius: '6px',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                        zIndex: 10,
                        color: '#2b211b',
                        maxHeight: '200px',
                        overflowY: 'auto',
                      }}>
                        {results.map(ev => (
                            <div
                                key={ev._id}
                                onClick={() => openEvent(ev)}
                                style={{
                                  padding: '8px 10px',
                                  cursor: 'pointer',
                                  borderBottom: '1px solid #f0f0f0',
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  transition: 'background 0.2s',
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = '#8e6b4f'}
                                onMouseLeave={e => e.currentTarget.style.background = '#b9a38d'}
                            >
                              <span style={{ fontWeight: 500 }}>{ev.title}</span>
                              <span style={{ fontSize: '0.8rem', color: '#888' }}>
            {new Date(ev.startDate).toLocaleDateString()}
          </span>
                            </div>
                        ))}
                      </div>
                  )}
                </div>


                <div className="user-chip">
              <div className="avatar" aria-hidden onClick={triggerPick} title="Click to change avatar">
                  {preview ? (
                    <img src={preview} alt="preview" className="avatar-img" onError={() => setImgFailed(true)} />
                  ) : !imgFailed ? (
                    user.profilePicture ? (
                      <img
                        src={`${BACKEND_ROOT}/${String(user.profilePicture).replace(/^\/+/, '')}`}
                        alt="avatar"
                        className="avatar-img"
                        onError={() => setImgFailed(true)}
                      />
                    ) : (
                      <div className="avatar-initials">{getInitials(user.username || user.login || user.email)}</div>
                    )
                  ) : (
                    getInitials(user.username || user.login || user.email)
                  )}
                  {uploading && <div className="avatar-loading">...</div>}
                  <input ref={inputRef} type="file" accept="image/*" className="avatar-input" onChange={handleFileChange} />
                </div>
              <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-start'}}>
                <span className="username">{user.username}</span>
                <span className="login" style={{fontSize: '0.8em', color: 'var(--muted)'}}>{user.login}</span>
              </div>
              {avatarError && <div className="form-error" style={{marginLeft:8}}>{avatarError}</div>}
              <button onClick={logout} className="btn btn-ghost">Logout</button>
            </div>
              </>
          )}
        </nav>
      </div>
    </header>
        <EventViewModal
            isOpen={modalOpen}
            event={modalEvent}
            onClose={() => setModalOpen(false)}
            onEdit={() => {
              if (modalEvent?.calendar && modalEvent?._id) {
                navigate(`/calendar/${modalEvent.calendar}/edit/${modalEvent._id}`)
              }
            }}
            onInvite={() => console.log('Invite logic')}
            onDelete={async () => {
              if (modalEvent?._id) {
                await api.delete(`/events/${modalEvent._id}`);
                setModalOpen(false);
              }
            }}
            currentUserId={user?._id}
        />

      </>
  )
}
