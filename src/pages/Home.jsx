import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

export default function Home() {
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState('')
  const [selectedNote, setSelectedNote] = useState(null)

  useEffect(() => {
    async function fetchNotes() {
      const { data: notesData, error } = await supabase
        .from('sermon_notes')
        .select('id, title, content, created_at, user_id')
        .eq('published', true)
        .order('created_at', { ascending: false })

      if (error) {
        setFetchError(error.message)
        setLoading(false)
        return
      }

      const notes = notesData ?? []

      // Fetch pastor names for all unique user_ids
      const userIds = [...new Set(notes.map((n) => n.user_id))]
      let profileMap = {}
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', userIds)
        if (profiles) {
          profiles.forEach((p) => { profileMap[p.id] = p.full_name })
        }
      }

      setNotes(notes.map((n) => ({ ...n, pastorName: profileMap[n.user_id] ?? 'Unknown Pastor' })))
      setLoading(false)
    }
    fetchNotes()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-indigo-700">SermonNotes</h1>
          <Link
            to="/login"
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700 transition"
          >
            Pastor Login
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-indigo-700 text-white py-16 text-center px-4">
        <h2 className="text-4xl font-bold mb-3">Sermon Notes Library</h2>
        <p className="text-indigo-200 text-lg max-w-xl mx-auto">
          Browse sermon notes shared by pastors from around the community.
        </p>
      </section>

      {/* Notes Grid */}
      <main className="max-w-5xl mx-auto px-4 py-12">
        {loading ? (
          <p className="text-center text-gray-500">Loading sermon notes...</p>
        ) : fetchError ? (
          <p className="text-center text-red-500">Error: {fetchError}</p>
        ) : notes.length === 0 ? (
          <p className="text-center text-gray-400">No sermon notes published yet.</p>
        ) : (
          <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {notes.map((note) => (
              <button
                key={note.id}
                onClick={() => setSelectedNote(note)}
                className="bg-white rounded-xl shadow p-6 flex flex-col gap-2 text-left hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer w-full"
              >
                <h3 className="text-lg font-semibold text-gray-800">{note.title}</h3>
                <p className="text-sm text-gray-500">By {note.pastorName}</p>
                <p className="text-gray-600 text-sm line-clamp-3">{note.content}</p>
                <p className="text-xs text-gray-400 mt-auto">
                  {new Date(note.created_at).toLocaleDateString()}
                </p>
                <span className="text-xs text-indigo-500 font-medium">Read more →</span>
              </button>
            ))}
          </div>

          {/* Sermon Modal */}
          {selectedNote && (
            <div
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4"
              onClick={() => setSelectedNote(null)}
            >
              <div
                className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto p-8"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-start gap-4 mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">{selectedNote.title}</h2>
                    <p className="text-sm text-gray-500 mt-1">
                      By {selectedNote.pastorName} &bull; {new Date(selectedNote.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedNote(null)}
                    className="text-gray-400 hover:text-gray-600 text-2xl leading-none shrink-0"
                  >
                    &times;
                  </button>
                </div>
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{selectedNote.content}</p>
              </div>
            </div>
          )}
          </>
        )}
      </main>
    </div>
  )
}
