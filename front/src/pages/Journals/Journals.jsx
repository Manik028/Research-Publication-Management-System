import { useState, useEffect } from 'react'
import { Library } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { apiGet, asList } from '../../lib/api'

function Journals() {
  const [journals, setJournals] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const { token } = useAuth()

  useEffect(() => {
    let cancelled = false

    apiGet('/api/venues', token)
      .then((result) => {
        if (cancelled) return
        setJournals(
          asList(result).filter(
            (venue) => venue.TYPE && venue.TYPE.toLowerCase().includes('journal'),
          ),
        )
      })
      .catch((err) => {
        if (cancelled) return
        console.error('Failed to fetch journals:', err)
        setError(err.message)
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [token])

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto max-w-7xl px-5 py-12 lg:px-8">
        <div className="mb-10 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-indigo-50 px-4 py-1.5 text-xs font-semibold text-indigo-600">
            <Library size={15} />
            Academic Journals
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Browse Journals
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-slate-500 sm:text-base">
            Explore academic journals, publication guidelines, and indexing details in the RPMS platform.
          </p>
        </div>

        {isLoading ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-16 text-center text-slate-400">
            Loading journals from database...
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center text-sm font-medium text-rose-600">
            {error}
          </div>
        ) : journals.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-16 text-center">
            <Library size={48} className="mx-auto mb-4 text-slate-300" />
            <h2 className="text-xl font-bold text-slate-800">
              No journals available yet
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
              Journal information will appear here once venue records are added to the database.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {journals.map((journal) => (
              <div key={journal.ID} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between">
                <div>
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                    <Library size={20} />
                  </div>
                  <h2 className="text-lg font-bold text-slate-900">{journal.NAME}</h2>
                  <div className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-xs text-slate-600">
                    <p className="font-semibold uppercase tracking-wider text-indigo-600">{journal.TYPE}</p>
                    {journal.SUBMISSION_DEADLINE && (
                      <p className="font-medium">
                        Deadline: {new Date(journal.SUBMISSION_DEADLINE).toLocaleDateString()}
                      </p>
                    )}
                    <p className="font-medium">
                      Status: <span className={journal.STATUS === 'Closed' ? 'text-rose-600' : 'text-emerald-600 font-semibold'}>{journal.STATUS || 'Open'}</span>
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}

export default Journals