import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'

export default function Dashboard() {
  const { session } = useAuth()
  const navigate = useNavigate()

  const [notes, setNotes] = useState([])
  const [loadingNotes, setLoadingNotes] = useState(true)

  // Upload form state
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [published, setPublished] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  useEffect(() => {
    if (session) fetchMyNotes()
  }, [session])

  async function fetchMyNotes() {
    setLoadingNotes(true)
    const { data, error } = await supabase
      .from('sermon_notes')
      .select('id, title, content, published, created_at')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })

    if (!error) setNotes(data ?? [])
    setLoadingNotes(false)
  }

  async function handleUpload(e) {
    e.preventDefault()
    setFormError('')
    setSuccessMsg('')
    setSubmitting(true)

    const { error } = await supabase.from('sermon_notes').insert({
      user_id: session.user.id,
      title,
      content,
      published,
    })

    if (error) {
      setFormError(error.message)
    } else {
      setSuccessMsg('Sermon note uploaded successfully!')
      setTitle('')
      setContent('')
      setPublished(true)
      fetchMyNotes()
    }

    setSubmitting(false)
  }

  async function handleDelete(id) {
    const { error } = await supabase.from('sermon_notes').delete().eq('id', id)
    if (!error) fetchMyNotes()
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    navigate('/')
  }

  const pastorName = session?.user?.user_metadata?.full_name ?? session?.user?.email

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <header className="bg-white shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-indigo-700">SermonNotes</h1>
            <p className="text-xs text-gray-500">Welcome, {pastorName}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="text-sm text-red-500 hover:underline"
          >
            Sign Out
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-10 grid gap-10 lg:grid-cols-2">
        {/* Upload Form */}
        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Upload Sermon Note</h2>
          <form onSubmit={handleUpload} className="bg-white rounded-xl shadow p-6 flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Sermon title..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
              <textarea
                required
                rows={8}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
                placeholder="Write your sermon notes here..."
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="published"
                checked={published}
                onChange={(e) => setPublished(e.target.checked)}
                className="accent-indigo-600"
              />
              <label htmlFor="published" className="text-sm text-gray-700">
                Publish publicly (visible on home page)
              </label>
            </div>

            {formError && <p className="text-red-500 text-sm">{formError}</p>}
            {successMsg && <p className="text-green-600 text-sm">{successMsg}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="bg-indigo-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-50"
            >
              {submitting ? 'Uploading...' : 'Upload Note'}
            </button>
          </form>
        </section>

        {/* My Notes */}
        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">My Sermon Notes</h2>
          {loadingNotes ? (
            <p className="text-gray-500 text-sm">Loading...</p>
          ) : notes.length === 0 ? (
            <p className="text-gray-400 text-sm">You haven't uploaded any notes yet.</p>
          ) : (
            <div className="flex flex-col gap-4">
              {notes.map((note) => (
                <div key={note.id} className="bg-white rounded-xl shadow p-4">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <h3 className="font-semibold text-gray-800">{note.title}</h3>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(note.created_at).toLocaleDateString()} &bull;{' '}
                        <span className={note.published ? 'text-green-500' : 'text-gray-400'}>
                          {note.published ? 'Published' : 'Draft'}
                        </span>
                      </p>
                    </div>
                    <button
                      onClick={() => handleDelete(note.id)}
                      className="text-xs text-red-400 hover:text-red-600 shrink-0"
                    >
                      Delete
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 mt-2 line-clamp-2">{note.content}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
