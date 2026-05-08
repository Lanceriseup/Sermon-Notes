import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

export default function Home() {
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchNotes() {
      const { data, error } = await supabase
        .from('sermon_notes')
        .select('id, title, content, created_at, profiles(full_name)')
        .eq('published', true)
        .order('created_at', { ascending: false })

      if (!error) setNotes(data ?? [])
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
        ) : notes.length === 0 ? (
          <p className="text-center text-gray-400">No sermon notes published yet.</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {notes.map((note) => (
              <div key={note.id} className="bg-white rounded-xl shadow p-6 flex flex-col gap-2">
                <h3 className="text-lg font-semibold text-gray-800">{note.title}</h3>
                <p className="text-sm text-gray-500">
                  By {note.profiles?.full_name ?? 'Unknown Pastor'}
                </p>
                <p className="text-gray-600 text-sm line-clamp-3">{note.content}</p>
                <p className="text-xs text-gray-400 mt-auto">
                  {new Date(note.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
