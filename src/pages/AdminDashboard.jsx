import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'

const GOLD = '#c9a44a'

function AdminSidebar({ active, onNav, adminName, adminAvatar, onSignOut }) {
  const navItems = [
    { key: 'overview', label: 'Overview', icon: <GridIcon /> },
    { key: 'pastors', label: 'Pastors', icon: <PeopleIcon /> },
    { key: 'notes', label: 'All Notes', icon: <DocIcon /> },
  ]
  return (
    <aside style={{
      width: 230, minWidth: 230, background: '#111111',
      display: 'flex', flexDirection: 'column', height: '100vh',
      position: 'sticky', top: 0, borderRight: '1px solid #1e1e1e',
    }}>
      <div style={{ padding: '1.5rem 1.25rem 1.25rem', borderBottom: '1px solid #1e1e1e' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{ width: 32, height: 32, background: GOLD, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#111', fontSize: '1rem', fontWeight: 900 }}>✝</span>
          </div>
          <div>
            <div style={{ color: '#f7f5f0', fontWeight: 800, fontSize: '0.85rem', letterSpacing: '0.04em' }}>SERMON NOTES</div>
            <div style={{ color: GOLD, fontSize: '0.58rem', letterSpacing: '0.14em', textTransform: 'uppercase' }}>Admin Portal</div>
          </div>
        </div>
      </div>
      <nav style={{ padding: '1rem 0.75rem', flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <div style={{ color: '#3a3a3a', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.14em', padding: '0 0.75rem', marginBottom: 6, textTransform: 'uppercase' }}>Admin Menu</div>
        {navItems.map(item => (
          <button key={item.key} onClick={() => onNav(item.key)} style={{
            display: 'flex', alignItems: 'center', gap: '0.75rem',
            padding: '0.65rem 0.75rem', borderRadius: 8, border: 'none', cursor: 'pointer',
            background: active === item.key ? 'rgba(201,164,74,0.12)' : 'transparent',
            outline: active === item.key ? '1px solid rgba(201,164,74,0.2)' : 'none',
            color: active === item.key ? GOLD : '#5a5a5a',
            fontSize: '0.83rem', fontWeight: active === item.key ? 600 : 400,
            textAlign: 'left', width: '100%',
          }}>
            <span style={{ color: active === item.key ? GOLD : '#3a3a3a' }}>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>
      <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid #1e1e1e' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{ width: 34, height: 34, background: GOLD, borderRadius: '50%', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#111', fontSize: '0.72rem', fontWeight: 800, flexShrink: 0 }}>
            {adminAvatar
              ? <img src={adminAvatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : initials(adminName)
            }
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: '#f7f5f0', fontSize: '0.8rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{adminName}</div>
            <div style={{ color: GOLD, fontSize: '0.65rem', fontWeight: 600 }}>Administrator</div>
          </div>
          <button onClick={() => onNav('profile')} title="Edit profile" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3a3a3a', padding: 4, fontSize: '1rem', lineHeight: 1 }}>
            ✎
          </button>
          <button onClick={onSignOut} title="Sign out" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3a3a3a', padding: 4 }}>
            <SignOutIcon />
          </button>
        </div>
      </div>
    </aside>
  )
}

export default function AdminDashboard() {
  const { session, profile } = useAuth()
  const navigate = useNavigate()
  const [activeSection, setActiveSection] = useState('overview')
  const [pastors, setPastors] = useState([])
  const [notes, setNotes] = useState([])
  const [loadingPastors, setLoadingPastors] = useState(true)
  const [loadingNotes, setLoadingNotes] = useState(true)
  const [profileNameInput, setProfileNameInput] = useState('')
  const [selectedNote, setSelectedNote] = useState(null)
  const [selectedPastor, setSelectedPastor] = useState(null)
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileError, setProfileError] = useState('')

  // Redirect if not admin
  useEffect(() => {
    if (profile && profile.role !== 'admin') navigate('/dashboard')
  }, [profile, navigate])

  useEffect(() => {
    if (session) {
      fetchPastors()
      fetchAllNotes()
    }
  }, [session])

  async function fetchPastors() {
    setLoadingPastors(true)
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, role, created_at, avatar_url')
      .order('created_at', { ascending: false })
    if (!error) setPastors(data ?? [])
    setLoadingPastors(false)
  }

  async function fetchAllNotes() {
    setLoadingNotes(true)
    const { data, error } = await supabase
      .from('sermon_notes')
      .select('id, title, content, published, created_at, user_id')
      .order('created_at', { ascending: false })
    if (error) {
      console.error('fetchAllNotes error:', error)
    } else {
      setNotes(data ?? [])
    }
    setLoadingNotes(false)
  }

  async function handleDeleteNote(id) {
    if (!confirm('Delete this sermon note?')) return
    const { error } = await supabase.from('sermon_notes').delete().eq('id', id)
    if (!error) fetchAllNotes()
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  async function saveProfile() {
    const trimmed = profileNameInput.trim()
    if (!trimmed && !avatarFile) return
    setSavingProfile(true)
    setProfileError('')
    let avatar_url = profile?.avatar_url ?? null
    if (avatarFile) {
      const ext = avatarFile.name.split('.').pop()
      const path = `${session.user.id}.${ext}`
      const { error: upErr } = await supabase.storage.from('avatars').upload(path, avatarFile, { upsert: true })
      if (upErr) {
        setProfileError('Avatar upload failed: ' + upErr.message)
      } else {
        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path)
        avatar_url = urlData.publicUrl
      }
    }
    const updates = {}
    if (trimmed) updates.full_name = trimmed
    if (avatar_url !== (profile?.avatar_url ?? null)) updates.avatar_url = avatar_url
    if (Object.keys(updates).length > 0) {
      const { error } = await supabase.from('profiles').update(updates).eq('id', session.user.id)
      if (error) { setProfileError('Save failed: ' + error.message); setSavingProfile(false); return }
    }
    setSavingProfile(false)
    window.location.reload()
  }

  const adminName = profile?.full_name ?? session?.user?.email ?? 'Admin'
  const adminAvatar = avatarPreview || profile?.avatar_url || null
  const totalPastors = pastors.filter(p => p.role === 'pastor').length
  const totalNotes = notes.length
  const publishedNotes = notes.filter(n => n.published).length
  const draftNotes = notes.filter(n => !n.published).length
  const pastorMap = Object.fromEntries(pastors.map(p => [p.id, p.full_name || 'Unknown Pastor']))

  // Notes per pastor map
  const notesByPastor = notes.reduce((acc, n) => {
    acc[n.user_id] = (acc[n.user_id] || 0) + 1
    return acc
  }, {})

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'Inter', sans-serif", background: '#f7f5f0' }}>
      <div className="hidden lg:flex">
        <AdminSidebar active={activeSection} onNav={setActiveSection} adminName={adminName} adminAvatar={adminAvatar} onSignOut={handleSignOut} />
      </div>

      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {/* Mobile header */}
        <header className="lg:hidden flex" style={{ background: '#111111', padding: '0.875rem 1.25rem', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1e1e1e', position: 'sticky', top: 0, zIndex: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: 26, height: 26, background: GOLD, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#111', fontSize: '0.8rem', fontWeight: 900 }}>✝</span>
            </div>
            <span style={{ color: '#f7f5f0', fontWeight: 800, fontSize: '0.85rem' }}>ADMIN PORTAL</span>
          </div>
          <div style={{ width: 32, height: 32, background: GOLD, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#111', fontSize: '0.7rem', fontWeight: 800 }}>
            {initials(adminName)}
          </div>
        </header>

        <main style={{ flex: 1, padding: 'clamp(1.25rem, 3vw, 2.5rem)', maxWidth: 960, width: '100%', paddingBottom: 90 }}>

          {/* ── OVERVIEW ── */}
          {activeSection === 'overview' && (
            <div>
              <div style={{ marginBottom: '2rem' }}>
                <p style={{ color: GOLD, fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 4 }}>Admin Overview</p>
                <h1 style={{ color: '#111111', fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 800 }}>Church Dashboard</h1>
                <p style={{ color: '#7a7a7a', fontSize: '0.85rem', marginTop: 4 }}>
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <StatCard label="Total Pastors" value={totalPastors} accent={GOLD} />
                <StatCard label="Total Notes" value={totalNotes} accent="#5a7ab5" />
                <StatCard label="Published" value={publishedNotes} accent="#4a7c59" sub="▲ live" />
                <StatCard label="Drafts" value={draftNotes} accent="#7a7a7a" />
              </div>

              {/* Recent notes table */}
              <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e8e4dc', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', marginBottom: '1.5rem' }}>
                <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #f0ece4', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, color: '#111', fontSize: '0.9rem' }}>Recent Activity</span>
                  <button onClick={() => setActiveSection('notes')} style={goldBtnStyle}>View All Notes</button>
                </div>
                {loadingNotes ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: '#aaa', fontSize: '0.85rem' }}>Loading...</div>
                ) : notes.slice(0, 5).map(note => (
                  <AdminNoteRow key={note.id} note={note} pastorName={pastorMap[note.user_id] || 'Unknown Pastor'} onDelete={handleDeleteNote} onOpen={setSelectedNote} />
                ))}
              </div>
            </div>
          )}

          {/* ── PASTORS ── */}
          {activeSection === 'pastors' && (
            <div>
              <div style={{ marginBottom: '1.75rem' }}>
                <p style={{ color: GOLD, fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 4 }}>Management</p>
                <h1 style={{ color: '#111', fontSize: '1.6rem', fontWeight: 800 }}>Pastors</h1>
              </div>
              <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e8e4dc', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #f0ece4' }}>
                  <span style={{ fontWeight: 700, color: '#111', fontSize: '0.9rem' }}>{totalPastors} Registered Pastor{totalPastors !== 1 ? 's' : ''}</span>
                </div>
                {loadingPastors ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: '#aaa', fontSize: '0.85rem' }}>Loading...</div>
                ) : pastors.filter(p => p.role === 'pastor').length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: '#aaa', fontSize: '0.85rem' }}>No pastors registered yet.</div>
                ) : pastors.filter(p => p.role === 'pastor').map(pastor => {
                  const isOpen = selectedPastor === pastor.id
                  const pastorNotes = notes.filter(n => n.user_id === pastor.id)
                  return (
                    <div key={pastor.id}>
                      <div onClick={() => setSelectedPastor(isOpen ? null : pastor.id)} style={{ padding: '0.9rem 1.25rem', borderBottom: isOpen ? 'none' : '1px solid #f7f4ef', display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', transition: 'background 0.15s' }} onMouseEnter={e => e.currentTarget.style.background = '#faf8f4'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <div style={{ width: 36, height: 36, background: '#f0ece4', border: '1px solid #e8e4dc', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7a7a7a', fontSize: '0.72rem', fontWeight: 700, flexShrink: 0, overflow: 'hidden' }}>
                          {pastor.avatar_url
                            ? <img src={pastor.avatar_url} alt={pastor.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : initials(pastor.full_name)}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ color: '#111', fontSize: '0.875rem', fontWeight: 600 }}>{pastor.full_name || 'Unnamed Pastor'}</div>
                          <div style={{ color: '#aaa', fontSize: '0.72rem', marginTop: 2 }}>
                            Joined {new Date(pastor.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </div>
                        </div>
                        <div style={{ background: '#f5f5f5', color: '#555', border: '1px solid #e0e0e0', fontSize: '0.67rem', padding: '0.22rem 0.6rem', borderRadius: 999, fontWeight: 700, flexShrink: 0 }}>
                          {notesByPastor[pastor.id] ?? 0} notes
                        </div>
                        <span style={{ color: '#bbb', fontSize: '0.75rem', marginLeft: 4, flexShrink: 0 }}>{isOpen ? '▲' : '▼'}</span>
                      </div>
                      {isOpen && (
                        <div style={{ background: '#faf8f4', borderBottom: '1px solid #f0ece4', borderTop: '1px solid #f0ece4' }}>
                          {pastorNotes.length === 0 ? (
                            <div style={{ padding: '1rem 1.5rem', color: '#aaa', fontSize: '0.82rem' }}>No sermon notes yet.</div>
                          ) : pastorNotes.map(note => (
                            <div key={note.id} onClick={() => setSelectedNote(note)} style={{ padding: '0.75rem 1.5rem', borderBottom: '1px solid #f0ece4', display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', transition: 'background 0.15s' }} onMouseEnter={e => e.currentTarget.style.background = '#f3f0ea'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ color: '#111', fontSize: '0.835rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{note.title}</div>
                                <div style={{ color: '#bbb', fontSize: '0.7rem', marginTop: 2 }}>{new Date(note.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                              </div>
                              <span style={{ background: note.published ? 'rgba(74,124,89,0.1)' : '#f5f5f5', color: note.published ? '#4a7c59' : '#7a7a7a', border: note.published ? '1px solid rgba(74,124,89,0.3)' : '1px solid #e0e0e0', fontSize: '0.64rem', padding: '0.18rem 0.5rem', borderRadius: 999, fontWeight: 700, textTransform: 'uppercase', flexShrink: 0 }}>{note.published ? 'Published' : 'Draft'}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── ALL NOTES ── */}
          {activeSection === 'notes' && (
            <div>
              <div style={{ marginBottom: '1.75rem' }}>
                <p style={{ color: GOLD, fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 4 }}>All Content</p>
                <h1 style={{ color: '#111', fontSize: '1.6rem', fontWeight: 800 }}>Sermon Notes</h1>
              </div>
              <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e8e4dc', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #f0ece4' }}>
                  <span style={{ fontWeight: 700, color: '#111', fontSize: '0.9rem' }}>{totalNotes} Total Note{totalNotes !== 1 ? 's' : ''}</span>
                </div>
                {loadingNotes ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: '#aaa', fontSize: '0.85rem' }}>Loading...</div>
                ) : notes.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: '#aaa', fontSize: '0.85rem' }}>No notes yet.</div>
                ) : notes.map(note => (
                  <AdminNoteRow key={note.id} note={note} pastorName={pastorMap[note.user_id] || 'Unknown Pastor'} onDelete={handleDeleteNote} onOpen={setSelectedNote} />
                ))}
              </div>
            </div>
          )}
          {/* ── PROFILE ── */}
          {activeSection === 'profile' && (
            <div style={{ maxWidth: 480 }}>
              <div style={{ marginBottom: '1.75rem' }}>
                <p style={{ color: GOLD, fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 4 }}>Account</p>
                <h1 style={{ color: '#111', fontSize: '1.6rem', fontWeight: 800 }}>Edit Profile</h1>
              </div>
              <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e8e4dc', padding: '1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                {/* Avatar */}
                <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: 64, height: 64, borderRadius: '50%', overflow: 'hidden', background: GOLD, border: '2px solid #e0d5b8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#111', fontWeight: 800, fontSize: '1.1rem', flexShrink: 0 }}>
                    {(avatarPreview || profile?.avatar_url)
                      ? <img src={avatarPreview || profile?.avatar_url} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : initials(adminName)
                    }
                  </div>
                  <div>
                    <label style={{ display: 'inline-block', background: '#f5f0e8', color: '#7a6a3a', border: '1px solid #e0d5b8', borderRadius: 8, padding: '0.45rem 1rem', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>
                      Choose Photo
                      <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => {
                        const file = e.target.files[0]
                        if (!file) return
                        setAvatarFile(file)
                        setAvatarPreview(URL.createObjectURL(file))
                      }} />
                    </label>
                    <p style={{ color: '#bbb', fontSize: '0.7rem', marginTop: 4 }}>JPG, PNG or WebP</p>
                  </div>
                </div>
                {/* Name */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', color: '#7a7a7a', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Display Name</label>
                  <input
                    value={profileNameInput}
                    onChange={e => setProfileNameInput(e.target.value)}
                    placeholder={adminName}
                    onKeyDown={e => e.key === 'Enter' && saveProfile()}
                    style={{ width: '100%', padding: '0.65rem 0.875rem', borderRadius: 8, border: '1px solid #e0dbd0', background: '#faf8f4', fontSize: '0.9rem', color: '#111', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
                {profileError && <p style={{ color: '#c05050', fontSize: '0.8rem', marginBottom: '0.75rem' }}>{profileError}</p>}
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button onClick={saveProfile} disabled={savingProfile} style={{ background: GOLD, color: '#111', border: 'none', borderRadius: 8, padding: '0.6rem 1.5rem', fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer', opacity: savingProfile ? 0.7 : 1 }}>{savingProfile ? 'Saving...' : 'Save Changes'}</button>
                  <button onClick={() => { setActiveSection('overview'); setProfileNameInput(''); setAvatarFile(null); setAvatarPreview(null) }} style={{ background: 'none', color: '#7a7a7a', border: '1px solid #e0dbd0', borderRadius: 8, padding: '0.6rem 1.25rem', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Note modal */}
        {selectedNote && (
          <NoteModal note={selectedNote} pastorName={pastorMap[selectedNote.user_id] || 'Unknown Pastor'} onClose={() => setSelectedNote(null)} onDelete={(id) => { handleDeleteNote(id); setSelectedNote(null) }} />
        )}

        {/* Mobile bottom nav */}
        <nav className="lg:hidden flex" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#111111', borderTop: '1px solid #1e1e1e', zIndex: 20 }}>
          {[
            { key: 'overview', label: 'Overview', icon: <GridIcon /> },
            { key: 'pastors', label: 'Pastors', icon: <PeopleIcon /> },
            { key: 'notes', label: 'Notes', icon: <DocIcon /> },
            { key: 'signout', label: 'Sign Out', icon: <SignOutIcon /> },
          ].map(item => (
            <button key={item.key} onClick={() => item.key === 'signout' ? handleSignOut() : setActiveSection(item.key)} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, border: 'none', background: 'none', cursor: 'pointer', padding: '0.6rem 0 0.7rem', color: activeSection === item.key ? GOLD : '#3a3a3a' }}>
              {item.icon}
              <span style={{ fontSize: '0.58rem', fontWeight: 600 }}>{item.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  )
}

function StatCard({ label, value, accent, sub }) {
  return (
    <div style={{ background: 'white', border: '1px solid #e8e4dc', borderRadius: 12, padding: '1.25rem', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
      <div style={{ color: '#7a7a7a', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>{label}</div>
      <div style={{ color: '#111', fontSize: '2rem', fontWeight: 800 }}>{value}</div>
      {sub && <div style={{ color: accent, fontSize: '0.72rem', marginTop: 4 }}>{sub}</div>}
      <div style={{ width: 28, height: 2, background: accent, borderRadius: 2, marginTop: 8 }} />
    </div>
  )
}

function AdminNoteRow({ note, pastorName, onDelete, onOpen }) {
  return (
    <div onClick={() => onOpen(note)} style={{ padding: '0.9rem 1.25rem', borderBottom: '1px solid #f7f4ef', display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', transition: 'background 0.15s' }} onMouseEnter={e => e.currentTarget.style.background = '#faf8f4'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: '#111', fontSize: '0.875rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{note.title}</div>
        <div style={{ color: '#aaa', fontSize: '0.72rem', marginTop: 2 }}>
          by {pastorName} · {new Date(note.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </div>
      </div>
      <span style={{ background: note.published ? 'rgba(74,124,89,0.1)' : '#f5f5f5', color: note.published ? '#4a7c59' : '#7a7a7a', border: note.published ? '1px solid rgba(74,124,89,0.3)' : '1px solid #e0e0e0', fontSize: '0.67rem', padding: '0.22rem 0.6rem', borderRadius: 999, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', flexShrink: 0 }}>
        {note.published ? 'Published' : 'Draft'}
      </span>
      <button onClick={(e) => { e.stopPropagation(); onDelete(note.id) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ccc', fontSize: '0.9rem', padding: '0.2rem 0.4rem', flexShrink: 0 }} onMouseEnter={e => e.currentTarget.style.color = '#c05050'} onMouseLeave={e => e.currentTarget.style.color = '#ccc'}>
        ✕
      </button>
    </div>
  )
}

function NoteModal({ note, pastorName, onClose, onDelete }) {
  // Close on backdrop click
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 660, maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #f0ece4', display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: 4, flexWrap: 'wrap' }}>
              <span style={{ background: note.published ? 'rgba(74,124,89,0.1)' : '#f5f5f5', color: note.published ? '#4a7c59' : '#7a7a7a', border: note.published ? '1px solid rgba(74,124,89,0.3)' : '1px solid #e0e0e0', fontSize: '0.65rem', padding: '0.2rem 0.55rem', borderRadius: 999, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{note.published ? 'Published' : 'Draft'}</span>
              <span style={{ color: '#bbb', fontSize: '0.72rem' }}>{new Date(note.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
            </div>
            <h2 style={{ color: '#111', fontSize: '1.2rem', fontWeight: 800, margin: 0, lineHeight: 1.3 }}>{note.title}</h2>
            <p style={{ color: '#7a7a7a', fontSize: '0.78rem', marginTop: 4 }}>by {pastorName}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#bbb', fontSize: '1.3rem', lineHeight: 1, padding: '0.2rem', flexShrink: 0 }} onMouseEnter={e => e.currentTarget.style.color = '#333'} onMouseLeave={e => e.currentTarget.style.color = '#bbb'}>✕</button>
        </div>
        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
          <p style={{ color: '#333', fontSize: '0.9rem', lineHeight: 1.75, whiteSpace: 'pre-wrap', margin: 0 }}>{note.content || 'No content.'}</p>
        </div>
        {/* Footer */}
        <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #f0ece4', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={() => onDelete(note.id)} style={{ background: 'none', color: '#c05050', border: '1px solid rgba(192,80,80,0.3)', borderRadius: 8, padding: '0.5rem 1.25rem', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}>Delete Note</button>
        </div>
      </div>
    </div>
  )
}

function GridIcon() {
  return <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
}
function PeopleIcon() {
  return <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
}
function DocIcon() {
  return <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
}
function SignOutIcon() {
  return <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
}

function initials(name) {
  return name?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || 'A'
}

const goldBtnStyle = {
  background: '#c9a44a', color: '#111', border: 'none', borderRadius: 6,
  padding: '0.45rem 1rem', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer',
  letterSpacing: '0.03em', flexShrink: 0,
}