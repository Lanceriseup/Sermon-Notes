import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'

const GOLD = '#c9a44a'

function Sidebar({ active, onNav, pastorName, pastorAvatar, onSignOut }) {
  const navItems = [
    { key: 'dashboard', label: 'Dashboard', icon: <GridIcon /> },
    { key: 'browse', label: 'All Notes', icon: <AllNotesIcon /> },
    { key: 'notes', label: 'My Notes', icon: <DocIcon /> },
    { key: 'upload', label: 'Upload Note', icon: <PlusIcon /> },
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
            <div style={{ color: GOLD, fontSize: '0.58rem', letterSpacing: '0.14em', textTransform: 'uppercase' }}>Pastor Hub</div>
          </div>
        </div>
      </div>
      <nav style={{ padding: '1rem 0.75rem', flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <div style={{ color: '#3a3a3a', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.14em', padding: '0 0.75rem', marginBottom: 6, textTransform: 'uppercase' }}>Menu</div>
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
          <div style={{ width: 34, height: 34, background: '#1e1e1e', border: `1px solid ${GOLD}`, borderRadius: '50%', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', color: GOLD, fontSize: '0.72rem', fontWeight: 700, flexShrink: 0 }}>
            {pastorAvatar
              ? <img src={pastorAvatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : initials(pastorName)
            }
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: '#f7f5f0', fontSize: '0.8rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{pastorName}</div>
            <div style={{ color: '#3a3a3a', fontSize: '0.65rem' }}>Pastor</div>
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

export default function Dashboard() {
  const { session, profile } = useAuth()
  const navigate = useNavigate()
  const [activeSection, setActiveSection] = useState('dashboard')
  const [notes, setNotes] = useState([])
  const [loadingNotes, setLoadingNotes] = useState(true)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [published, setPublished] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // Browse all sermons
  const [allNotes, setAllNotes] = useState([])
  const [profilesMap, setProfilesMap] = useState({})
  const [loadingAll, setLoadingAll] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [profileNameInput, setProfileNameInput] = useState('')
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileMsg, setProfileMsg] = useState('')
  const [selectedNote, setSelectedNote] = useState(null)
  const [selectedNotePastorName, setSelectedNotePastorName] = useState('')
  const [selectedNoteReadOnly, setSelectedNoteReadOnly] = useState(false)

  useEffect(() => { if (session) fetchMyNotes() }, [session])

  useEffect(() => {
    if (activeSection === 'browse') fetchAllNotes()
  }, [activeSection])

  async function fetchAllNotes() {
    setLoadingAll(true)
    const [{ data: notesData }, { data: profilesData }] = await Promise.all([
      supabase.from('sermon_notes').select('id, title, content, published, created_at, user_id').eq('published', true).order('created_at', { ascending: false }),
      supabase.from('profiles').select('id, full_name, avatar_url')
    ])
    if (notesData) setAllNotes(notesData)
    if (profilesData) setProfilesMap(Object.fromEntries(profilesData.map(p => [p.id, { name: p.full_name || 'Unknown Pastor', avatar: p.avatar_url || null }])))
    setLoadingAll(false)
  }

  async function fetchMyNotes() {
    setLoadingNotes(true)
    const { data, error } = await supabase
      .from('sermon_notes')
      .select('id, title, content, published, created_at, user_id')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
    if (!error) setNotes(data ?? [])
    setLoadingNotes(false)
  }

  async function handleUpload(e) {
    e.preventDefault()
    setFormError(''); setSuccessMsg(''); setSubmitting(true)
    const { error } = await supabase.from('sermon_notes').insert({ user_id: session.user.id, title, content, published })
    if (error) { setFormError(error.message) }
    else { setSuccessMsg('Sermon note uploaded!'); setTitle(''); setContent(''); setPublished(true); fetchMyNotes(); setActiveSection('notes') }
    setSubmitting(false)
  }

  async function handleDelete(id) {
    if (!confirm('Delete this sermon note?')) return
    const { error } = await supabase.from('sermon_notes').delete().eq('id', id)
    if (!error) fetchMyNotes()
  }

  async function handleTogglePublish(note) {
    await supabase.from('sermon_notes').update({ published: !note.published }).eq('id', note.id)
    fetchMyNotes()
    fetchAllNotes()
  }

  async function handleSaveNote(updatedNote) {
    await supabase.from('sermon_notes').update({ title: updatedNote.title, content: updatedNote.content }).eq('id', updatedNote.id)
    await Promise.all([fetchMyNotes(), fetchAllNotes()])
  }

  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false)

  async function handleSignOut() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  async function saveProfile() {
    const trimmed = profileNameInput.trim()
    if (!trimmed && !avatarFile) return
    setSavingProfile(true)
    setProfileMsg('')
    let avatar_url = profile?.avatar_url ?? null
    if (avatarFile) {
      const ext = avatarFile.name.split('.').pop()
      const path = `${session.user.id}.${ext}`
      const { error: upErr } = await supabase.storage.from('avatars').upload(path, avatarFile, { upsert: true })
      if (upErr) {
        setProfileMsg('Avatar upload failed: ' + upErr.message)
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
      if (error) { setProfileMsg('Save failed: ' + error.message); setSavingProfile(false); return }
    }
    setSavingProfile(false)
    window.location.reload()
  }

  const pastorName = profile?.full_name ?? session?.user?.email ?? 'Pastor'
  const pastorAvatar = avatarPreview || profile?.avatar_url || null
  const publishedNotes = notes.filter(n => n.published).length
  const draftNotes = notes.filter(n => !n.published).length

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'Inter', sans-serif", background: '#f7f5f0' }}>
      <div className="hidden lg:flex">
        <Sidebar active={activeSection} onNav={setActiveSection} pastorName={pastorName} pastorAvatar={pastorAvatar} onSignOut={() => setShowSignOutConfirm(true)} />
      </div>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <header className="lg:hidden flex" style={{ background: '#111111', padding: '0.875rem 1.25rem', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1e1e1e', position: 'sticky', top: 0, zIndex: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: 26, height: 26, background: GOLD, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#111', fontSize: '0.8rem', fontWeight: 900 }}>✝</span>
            </div>
            <span style={{ color: '#f7f5f0', fontWeight: 800, fontSize: '0.85rem' }}>SERMON NOTES</span>
          </div>
          <button onClick={() => setActiveSection('profile')} style={{ width: 32, height: 32, background: '#1e1e1e', border: `1px solid ${GOLD}`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: GOLD, fontSize: '0.7rem', fontWeight: 700, padding: 0, cursor: 'pointer', overflow: 'hidden', flexShrink: 0 }}>
            {pastorAvatar
              ? <img src={pastorAvatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
              : initials(pastorName)}
          </button>
        </header>

        <main style={{ flex: 1, padding: 'clamp(1rem, 4vw, 2.5rem)', maxWidth: 900, width: '100%', paddingBottom: 100 }}>
          {activeSection === 'browse' && (
            <div>
              <div style={{ marginBottom: '1.75rem' }}>
                <p style={{ color: GOLD, fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 4 }}>Church Library</p>
                <h1 style={{ color: '#111', fontSize: '1.6rem', fontWeight: 800, marginBottom: '1rem' }}>All Sermons</h1>
                {/* Search bar */}
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: '#aaa', pointerEvents: 'none' }}>
                    <SearchIcon />
                  </span>
                  <input
                    type="text"
                    placeholder="Search by title or pastor..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    style={{ width: '100%', border: '1px solid #e0dbd0', borderRadius: 10, padding: '0.65rem 0.875rem 0.65rem 2.5rem', fontSize: '0.875rem', color: '#111', background: 'white', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} style={{ position: 'absolute', right: '0.875rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', fontSize: '1rem', lineHeight: 1 }}>✕</button>
                  )}
                </div>
              </div>

              {(() => {
                const q = searchQuery.toLowerCase()
                const filtered = allNotes.filter(n =>
                  n.title.toLowerCase().includes(q) ||
                  (profilesMap[n.user_id] ?? '').toLowerCase().includes(q)
                )
                return (
                  <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e8e4dc', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                    <div style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid #f0ece4', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#7a7a7a', fontSize: '0.75rem', fontWeight: 600 }}>
                        {loadingAll ? 'Loading...' : `${filtered.length} sermon${filtered.length !== 1 ? 's' : ''}${searchQuery ? ' found' : ''}`}
                      </span>
                      {!loadingAll && <button onClick={fetchAllNotes} style={{ background: 'none', border: 'none', cursor: 'pointer', color: GOLD, fontSize: '0.75rem', fontWeight: 600 }}>Refresh</button>}
                    </div>
                    {loadingAll ? (
                      <div style={{ padding: '3rem', textAlign: 'center', color: '#aaa', fontSize: '0.85rem' }}>Loading sermons...</div>
                    ) : filtered.length === 0 ? (
                      <div style={{ padding: '3rem', textAlign: 'center', color: '#aaa', fontSize: '0.85rem' }}>
                        {searchQuery ? `No sermons matching "${searchQuery}"` : 'No published sermons yet.'}
                      </div>
                    ) : filtered.map(note => (
                      <BrowseNoteRow key={note.id} note={note} pastorName={profilesMap[note.user_id]?.name || 'Unknown Pastor'} pastorAvatar={profilesMap[note.user_id]?.avatar || null} onOpen={(n, name) => { setSelectedNote(n); setSelectedNotePastorName(name); setSelectedNoteReadOnly(true) }} />
                    ))}
                  </div>
                )
              })()}
            </div>
          )}

          {activeSection === 'dashboard' && (
            <div>
              <div style={{ marginBottom: '2rem' }}>
                <p style={{ color: GOLD, fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 4 }}>Good Morning</p>
                <h1 style={{ color: '#111111', fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 800, letterSpacing: '-0.3px' }}>
                  Pastor {pastorName.split(' ').slice(-1)[0]}
                </h1>
                <p style={{ color: '#7a7a7a', fontSize: '0.85rem', marginTop: 4 }}>
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                  {draftNotes > 0 && <span style={{ color: '#9e7d30', marginLeft: 8 }}>· {draftNotes} draft{draftNotes > 1 ? 's' : ''} waiting</span>}
                </p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3" style={{ gap: '0.75rem', marginBottom: '1.5rem' }}>
                <StatCard label="Total Notes" value={notes.length} accent={GOLD} />
                <StatCard label="Published" value={publishedNotes} accent="#4a7c59" sub="▲ live" />
                <div className="col-span-2 sm:col-span-1">
                  <StatCard label="Drafts" value={draftNotes} accent="#7a7a7a" fullWidth />
                </div>
              </div>
              <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e8e4dc', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #f0ece4', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, color: '#111', fontSize: '0.9rem' }}>Recent Sermons</span>
                  <button onClick={() => setActiveSection('upload')} style={goldBtnStyle}>+ New Sermon</button>
                </div>
                {loadingNotes ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: '#aaa', fontSize: '0.85rem' }}>Loading...</div>
                ) : notes.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: '#aaa', fontSize: '0.85rem' }}>No notes yet — upload your first sermon.</div>
                ) : notes.slice(0, 5).map(note => (
                  <NoteRow key={note.id} note={note} onDelete={handleDelete} onToggle={handleTogglePublish} onOpen={n => { setSelectedNote(n); setSelectedNotePastorName(pastorName); setSelectedNoteReadOnly(false) }} />
                ))}
                {notes.length > 5 && (
                  <button onClick={() => setActiveSection('notes')} style={{ width: '100%', padding: '0.75rem', border: 'none', background: '#faf8f4', color: GOLD, fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', borderTop: '1px solid #f0ece4' }}>
                    View all {notes.length} notes →
                  </button>
                )}
              </div>
            </div>
          )}

          {activeSection === 'notes' && (
            <div>
              <div style={{ marginBottom: '1.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                  <p style={{ color: GOLD, fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 4 }}>My Library</p>
                  <h1 style={{ color: '#111', fontSize: '1.6rem', fontWeight: 800 }}>Sermon Notes</h1>
                </div>
                <button onClick={() => setActiveSection('upload')} className="hidden lg:block" style={goldBtnStyle}>+ New Sermon</button>
              </div>
              <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e8e4dc', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                {loadingNotes ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: '#aaa', fontSize: '0.85rem' }}>Loading...</div>
                ) : notes.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: '#aaa', fontSize: '0.85rem' }}>No notes yet.</div>
                ) : notes.map(note => (
                  <NoteRow key={note.id} note={note} onDelete={handleDelete} onToggle={handleTogglePublish} onOpen={n => { setSelectedNote(n); setSelectedNotePastorName(pastorName); setSelectedNoteReadOnly(false) }} />
                ))}
              </div>
            </div>
          )}

          {activeSection === 'upload' && (
            <div style={{ maxWidth: 680 }}>
              <div style={{ marginBottom: '1.75rem' }}>
                <p style={{ color: GOLD, fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 4 }}>Add New</p>
                <h1 style={{ color: '#111', fontSize: '1.6rem', fontWeight: 800 }}>Upload Sermon Note</h1>
              </div>
              <form onSubmit={handleUpload} style={{ background: 'white', borderRadius: 12, border: '1px solid #e8e4dc', padding: '1.75rem', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <label style={labelStyle}>Title</label>
                  <input required value={title} onChange={e => setTitle(e.target.value)} placeholder="Sermon title..." style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Content</label>
                  <textarea required rows={10} value={content} onChange={e => setContent(e.target.value)} placeholder="Write your sermon notes here..." style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <input type="checkbox" id="pub" checked={published} onChange={e => setPublished(e.target.checked)} style={{ accentColor: GOLD, width: 16, height: 16 }} />
                  <label htmlFor="pub" style={{ fontSize: '0.85rem', color: '#555', cursor: 'pointer' }}>Publish immediately (visible to all pastors)</label>
                </div>
                {formError && <p style={{ color: '#c05050', fontSize: '0.83rem' }}>{formError}</p>}
                {successMsg && <p style={{ color: '#4a7c59', fontSize: '0.83rem' }}>{successMsg}</p>}
                <button type="submit" disabled={submitting} style={{ ...goldBtnStyle, padding: '0.75rem 1.5rem', fontSize: '0.9rem', opacity: submitting ? 0.6 : 1 }}>
                  {submitting ? 'Uploading...' : 'Upload Sermon Note'}
                </button>
              </form>
            </div>
          )}

          {activeSection === 'profile' && (
            <div style={{ maxWidth: 480 }}>
              <div style={{ marginBottom: '1.75rem' }}>
                <p style={{ color: GOLD, fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 4 }}>Account</p>
                <h1 style={{ color: '#111', fontSize: '1.6rem', fontWeight: 800 }}>Edit Profile</h1>
              </div>
              <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e8e4dc', padding: '1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                {/* Avatar */}
                <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: 64, height: 64, borderRadius: '50%', overflow: 'hidden', background: '#1e1e1e', border: `2px solid ${GOLD}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: GOLD, fontWeight: 700, fontSize: '1.1rem', flexShrink: 0 }}>
                    {(avatarPreview || profile?.avatar_url)
                      ? <img src={avatarPreview || profile?.avatar_url} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : initials(pastorName)
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
                    placeholder={pastorName}
                    onKeyDown={e => e.key === 'Enter' && saveProfile()}
                    style={{ width: '100%', padding: '0.65rem 0.875rem', borderRadius: 8, border: '1px solid #e0dbd0', background: '#faf8f4', fontSize: '0.9rem', color: '#111', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
                {profileMsg && <p style={{ color: '#4a7c59', fontSize: '0.8rem', marginBottom: '0.75rem' }}>{profileMsg}</p>}
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button onClick={saveProfile} disabled={savingProfile} style={{ background: GOLD, color: '#111', border: 'none', borderRadius: 8, padding: '0.6rem 1.5rem', fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer', opacity: savingProfile ? 0.7 : 1 }}>{savingProfile ? 'Saving...' : 'Save Changes'}</button>
                  <button onClick={() => { setActiveSection('dashboard'); setProfileNameInput(''); setAvatarFile(null); setAvatarPreview(null) }} style={{ background: 'none', color: '#7a7a7a', border: '1px solid #e0dbd0', borderRadius: 8, padding: '0.6rem 1.25rem', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Note modal */}
        {selectedNote && (
          <PastorNoteModal note={selectedNote} pastorName={selectedNotePastorName} onClose={() => setSelectedNote(null)} isOwner={!selectedNoteReadOnly} onToggle={handleTogglePublish} onSave={handleSaveNote} />
        )}

        {/* Sign out confirmation */}
        {showSignOutConfirm && (
          <div onClick={() => setShowSignOutConfirm(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 360, padding: '2rem 1.75rem', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', textAlign: 'center' }}>
              <div style={{ width: 48, height: 48, background: '#f5f5f5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', color: '#7a7a7a' }}><SignOutIcon /></div>
              <h2 style={{ color: '#111', fontSize: '1.1rem', fontWeight: 800, margin: '0 0 0.5rem' }}>Sign out?</h2>
              <p style={{ color: '#7a7a7a', fontSize: '0.85rem', margin: '0 0 1.5rem' }}>You'll need to sign back in to access your sermon notes.</p>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button onClick={() => setShowSignOutConfirm(false)} style={{ flex: 1, padding: '0.65rem', border: '1px solid #e0dbd0', borderRadius: 8, background: 'none', color: '#333', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                <button onClick={handleSignOut} style={{ flex: 1, padding: '0.65rem', border: 'none', borderRadius: 8, background: '#111', color: '#fff', fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer' }}>Sign Out</button>
              </div>
            </div>
          </div>
        )}

        <nav className="lg:hidden flex" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#111111', borderTop: '1px solid #1e1e1e', zIndex: 20, alignItems: 'flex-end', paddingBottom: 'env(safe-area-inset-bottom)' }}>
          {[
            { key: 'dashboard', label: 'Home', icon: <GridIcon /> },
            { key: 'browse', label: 'All Notes', icon: <AllNotesIcon /> },
            { key: 'upload', label: 'Upload', icon: <PlusIcon color="#111" /> },
            { key: 'notes', label: 'My Notes', icon: <DocIcon /> },
            { key: 'signout', label: 'Sign Out', icon: <SignOutIcon /> },
          ].map(item => item.key === 'upload' ? (
            <button key="upload" onClick={() => setActiveSection('upload')} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', border: 'none', background: 'none', cursor: 'pointer', padding: '0 0 0.7rem' }}>
              <div style={{ width: 44, height: 44, background: GOLD, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: -18, boxShadow: '0 4px 16px rgba(201,164,74,0.5)', border: '3px solid #111111' }}>
                <PlusIcon color="#111" />
              </div>
              <span style={{ color: activeSection === 'upload' ? GOLD : '#3a3a3a', fontSize: '0.58rem', fontWeight: 700, marginTop: 4 }}>Upload</span>
            </button>
          ) : (
            <button key={item.key} onClick={() => item.key === 'signout' ? setShowSignOutConfirm(true) : setActiveSection(item.key)} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, border: 'none', background: 'none', cursor: 'pointer', padding: '0.6rem 0 0.7rem', color: activeSection === item.key ? GOLD : '#3a3a3a' }}>
              {item.icon}
              <span style={{ fontSize: '0.58rem', fontWeight: 600 }}>{item.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  )
}

function StatCard({ label, value, accent, sub, fullWidth }) {
  return (
    <div style={{ background: 'white', border: '1px solid #e8e4dc', borderRadius: 12, padding: '1.1rem 1.25rem', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', display: 'flex', flexDirection: fullWidth ? 'row' : 'column', alignItems: fullWidth ? 'center' : undefined, gap: fullWidth ? '1rem' : undefined, height: '100%' }}>
      {fullWidth ? (
        <>
          <div style={{ flex: 1 }}>
            <div style={{ color: '#7a7a7a', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
            <div style={{ width: 28, height: 2, background: accent, borderRadius: 2 }} />
          </div>
          <div style={{ color: '#111', fontSize: '2rem', fontWeight: 800 }}>{value}</div>
        </>
      ) : (
        <>
          <div style={{ color: '#7a7a7a', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>{label}</div>
          <div style={{ color: '#111', fontSize: '2rem', fontWeight: 800 }}>{value}</div>
          {sub && <div style={{ color: accent, fontSize: '0.72rem', marginTop: 4 }}>{sub}</div>}
          <div style={{ width: 28, height: 2, background: accent, borderRadius: 2, marginTop: 8 }} />
        </>
      )}
    </div>
  )
}

function NoteRow({ note, onDelete, onToggle, onOpen }) {
  return (
    <div onClick={() => onOpen(note)} style={{ padding: '0.9rem 1.25rem', borderBottom: '1px solid #f7f4ef', display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', transition: 'background 0.15s' }} onMouseEnter={e => e.currentTarget.style.background = '#faf8f4'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: '#111', fontSize: '0.875rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{note.title}</div>
        <div style={{ color: '#aaa', fontSize: '0.72rem', marginTop: 2 }}>{new Date(note.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
      </div>
      <button onClick={e => { e.stopPropagation(); onToggle(note) }} style={{ background: note.published ? 'rgba(74,124,89,0.1)' : '#f5f5f5', color: note.published ? '#4a7c59' : '#7a7a7a', border: note.published ? '1px solid rgba(74,124,89,0.3)' : '1px solid #e0e0e0', fontSize: '0.67rem', padding: '0.22rem 0.6rem', borderRadius: 999, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer', flexShrink: 0 }}>
        {note.published ? 'Published' : 'Draft'}
      </button>
      <button onClick={e => { e.stopPropagation(); onDelete(note.id) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ccc', fontSize: '0.9rem', padding: '0.2rem 0.4rem', flexShrink: 0 }} onMouseEnter={e => e.currentTarget.style.color = '#c05050'} onMouseLeave={e => e.currentTarget.style.color = '#ccc'}>
        ✕
      </button>
    </div>
  )
}

function AllNotesIcon() {
  return <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
}
function GridIcon() {
  return <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
}
function DocIcon() {
  return <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
}
function PlusIcon({ color = 'currentColor' }) {
  return <svg width="15" height="15" fill="none" stroke={color} strokeWidth="2.5" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
}
function SignOutIcon() {
  return <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
}
function SearchIcon() {
  return <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
}

function BrowseNoteRow({ note, pastorName, pastorAvatar, onOpen }) {
  return (
    <div style={{ borderBottom: '1px solid #f7f4ef' }}>
      <button onClick={() => onOpen(note, pastorName)} style={{ width: '100%', textAlign: 'left', padding: '0.9rem 1.25rem', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem' }} onMouseEnter={e => e.currentTarget.style.background = '#faf8f4'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
        <div style={{ width: 34, height: 34, background: '#f0ece4', border: '1px solid #e8e4dc', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7a7a7a', fontSize: '0.65rem', fontWeight: 700, flexShrink: 0, overflow: 'hidden' }}>
          {pastorAvatar
            ? <img src={pastorAvatar} alt={pastorName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : pastorName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || 'P'}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: '#111', fontSize: '0.875rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{note.title}</div>
          <div style={{ color: '#aaa', fontSize: '0.72rem', marginTop: 2 }}>
            {pastorName} · {new Date(note.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
        </div>
        <span style={{ color: '#ccc', fontSize: '0.75rem', flexShrink: 0 }}>›</span>
      </button>
    </div>
  )
}

function PastorNoteModal({ note, pastorName, onClose, isOwner, onToggle, onSave }) {
  const [toggling, setToggling] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(note.title)
  const [editContent, setEditContent] = useState(note.content || '')
  const [saving, setSaving] = useState(false)
  const [localNote, setLocalNote] = useState(note)

  async function handleSave() {
    setSaving(true)
    await onSave({ ...localNote, title: editTitle, content: editContent })
    setLocalNote(n => ({ ...n, title: editTitle, content: editContent }))
    setEditing(false)
    setSaving(false)
  }

  async function handleToggle() {
    setToggling(true)
    await onToggle(localNote)
    setLocalNote(n => ({ ...n, published: !n.published }))
    setToggling(false)
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 660, maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #f0ece4', display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: 6, flexWrap: 'wrap' }}>
              <span style={{ background: localNote.published ? 'rgba(74,124,89,0.1)' : '#f5f5f5', color: localNote.published ? '#4a7c59' : '#7a7a7a', border: localNote.published ? '1px solid rgba(74,124,89,0.3)' : '1px solid #e0e0e0', fontSize: '0.65rem', padding: '0.2rem 0.55rem', borderRadius: 999, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{localNote.published ? 'Published' : 'Draft'}</span>
              <span style={{ color: '#bbb', fontSize: '0.72rem' }}>{new Date(localNote.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
            </div>
            {editing ? (
              <input
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                style={{ width: '100%', border: '1px solid #c9a44a', borderRadius: 6, padding: '0.4rem 0.6rem', fontSize: '1.1rem', fontWeight: 800, color: '#111', background: '#faf8f4', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
              />
            ) : (
              <h2 style={{ color: '#111', fontSize: '1.2rem', fontWeight: 800, margin: 0, lineHeight: 1.3 }}>{localNote.title}</h2>
            )}
            <p style={{ color: '#7a7a7a', fontSize: '0.78rem', marginTop: 4 }}>by {pastorName}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#bbb', fontSize: '1.3rem', lineHeight: 1, padding: '0.2rem', flexShrink: 0 }} onMouseEnter={e => e.currentTarget.style.color = '#333'} onMouseLeave={e => e.currentTarget.style.color = '#bbb'}>✕</button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
          {editing ? (
            <textarea
              value={editContent}
              onChange={e => setEditContent(e.target.value)}
              rows={12}
              style={{ width: '100%', border: '1px solid #c9a44a', borderRadius: 8, padding: '0.75rem', fontSize: '0.9rem', lineHeight: 1.75, color: '#333', background: '#faf8f4', outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }}
            />
          ) : (
            <p style={{ color: '#333', fontSize: '0.9rem', lineHeight: 1.75, whiteSpace: 'pre-wrap', margin: 0 }}>{localNote.content || 'No content.'}</p>
          )}
        </div>

        {/* Footer */}
        {isOwner && (
          <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #f0ece4', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem' }}>
            <button
              disabled={toggling}
              onClick={handleToggle}
              style={{ background: localNote.published ? '#f5f5f5' : 'rgba(74,124,89,0.1)', color: localNote.published ? '#7a7a7a' : '#4a7c59', border: localNote.published ? '1px solid #e0e0e0' : '1px solid rgba(74,124,89,0.3)', borderRadius: 8, padding: '0.5rem 1.1rem', fontSize: '0.8rem', fontWeight: 700, cursor: toggling ? 'not-allowed' : 'pointer', opacity: toggling ? 0.6 : 1 }}
            >
              {toggling ? 'Saving…' : localNote.published ? 'Unpublish' : 'Publish'}
            </button>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {editing ? (
                <>
                  <button onClick={() => { setEditing(false); setEditTitle(localNote.title); setEditContent(localNote.content || '') }} style={{ background: 'none', border: '1px solid #e0dbd0', borderRadius: 8, padding: '0.5rem 1rem', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', color: '#7a7a7a' }}>Cancel</button>
                  <button onClick={handleSave} disabled={saving} style={{ background: '#c9a44a', color: '#111', border: 'none', borderRadius: 8, padding: '0.5rem 1.25rem', fontSize: '0.8rem', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1 }}>{saving ? 'Saving…' : 'Save'}</button>
                </>
              ) : (
                <button onClick={() => setEditing(true)} style={{ background: '#111', color: '#fff', border: 'none', borderRadius: 8, padding: '0.5rem 1.25rem', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}>Edit</button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function initials(name) {
  return name?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || 'P'
}

const goldBtnStyle = {
  background: '#c9a44a', color: '#111', border: 'none', borderRadius: 6,
  padding: '0.45rem 1rem', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer',
  letterSpacing: '0.03em', flexShrink: 0,
}
const labelStyle = {
  display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#333', marginBottom: 6, letterSpacing: '0.02em',
}
const inputStyle = {
  width: '100%', border: '1px solid #e0dbd0', borderRadius: 8,
  padding: '0.6rem 0.875rem', fontSize: '0.875rem', color: '#111',
  background: '#faf8f4', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
}
