import { useState, useEffect, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  BookOpen,
  Search,
  Filter,
  Plus,
  Trash2,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { apiGet, apiPost, apiDelete, asList } from '../../lib/api'

function Publications() {
  const [publications, setPublications] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [formError, setFormError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Modal and form states matching the PUBLICATION table
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [abstract, setAbstract] = useState('')
  const [doi, setDoi] = useState('')

  // Read search query parameter from URL (e.g. from Home page search)
  const [searchParams, setSearchParams] = useSearchParams()
  const initialQuery = searchParams.get('search') || ''
  
  const [searchInput, setSearchInput] = useState(initialQuery)
  const [activeQuery, setActiveQuery] = useState(initialQuery)

  const { token, user, role, isAuthenticated } = useAuth()

  // The stored user object uses the backend's upper-case keys (ID), so the
  // old `user?.id === pub.USER_ID` check was always false and the Delete
  // button never rendered for the owner.
  const currentUserId = user?.ID ?? user?.id ?? null
  const canDelete = (pub) =>
    isAuthenticated && (Number(pub.USER_ID) === Number(currentUserId) || role === 'Admin')

  const loadPublications = useCallback(() => {
    return apiGet('/api/publications', token)
      .then((result) => setPublications(asList(result)))
      .catch((err) => {
        console.error('Failed to fetch publications:', err)
        setError(err.message)
      })
      .finally(() => setIsLoading(false))
  }, [token])

  useEffect(() => {
    loadPublications()
  }, [loadPublications])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    setActiveQuery(searchInput)
    if (searchInput.trim()) {
      setSearchParams({ search: searchInput.trim() })
    } else {
      setSearchParams({})
    }
  }

  // Handle ERD-compliant publication submission
  const handleAddPublication = async (e) => {
    e.preventDefault()
    if (!title || !abstract) return

    setFormError('')
    setIsSubmitting(true)

    try {
      // The backend returns the created row (joined with the author name),
      // so the list updates in place instead of doing a full page reload.
      const result = await apiPost('/api/publications', { title, abstract, doi }, token)

      if (result.data) {
        setPublications((prev) => [result.data, ...prev])
      } else {
        await loadPublications()
      }

      setTitle('')
      setAbstract('')
      setDoi('')
      setIsModalOpen(false)
    } catch (err) {
      console.error('Error submitting publication:', err)
      setFormError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle object-level deletion (Rubric 3.2)
  const handleDeletePublication = async (id) => {
    if (!window.confirm('Delete this publication? This cannot be undone.')) return

    try {
      await apiDelete(`/api/publications/${id}`, token)
      setPublications((prev) => prev.filter((p) => p.ID !== id))
    } catch (err) {
      console.error('Error deleting publication:', err)
      setError(err.message)
    }
  }

  // Filter publications based on active search input
  const filteredPublications = publications.filter(pub => {
    const query = activeQuery.toLowerCase()
    return (
      pub.TITLE?.toLowerCase().includes(query) ||
      pub.ABSTRACT?.toLowerCase().includes(query) ||
      pub.AUTHOR?.toLowerCase().includes(query) ||
      pub.DOI?.toLowerCase().includes(query)
    )
  })

  return (
    <main className="min-h-screen bg-base-200">

      <section className="mx-auto max-w-7xl px-5 py-16 lg:px-8">

        {/* Header */}
        <div className="mb-10 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
              <BookOpen size={16} />
              Research Publications
            </div>

            <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
              Browse Publications
            </h1>

            <p className="mt-4 max-w-2xl text-base-content/60">
              Discover academic publications, research papers and scholarly
              work available through the Research & Publication Management
              System.
            </p>
          </div>

          {isAuthenticated ? (
            <button
              onClick={() => setIsModalOpen(true)}
              className="btn btn-primary gap-2 self-start sm:self-auto"
            >
              <Plus size={18} />
              Submit Publication
            </button>
          ) : (
            <Link to="/login" className="btn btn-outline gap-2 self-start sm:self-auto">
              <Plus size={18} />
              Sign in to submit
            </Link>
          )}
        </div>


        {/* Search Form */}
        <form onSubmit={handleSearchSubmit} className="mb-10 rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row">
            <label className="input input-bordered flex flex-1 items-center gap-3">
              <Search size={18} className="text-base-content/40" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by title, author, keyword or DOI"
                className="grow bg-transparent outline-none"
              />
            </label>

            <button type="submit" className="btn btn-primary gap-2">
              <Search size={18} />
              Search
            </button>

            <button type="button" className="btn btn-outline gap-2">
              <Filter size={18} />
              Filters
            </button>
          </div>
        </form>


        {/* Content States: Loading, Empty, or Populated Grid */}
        {error && (
          <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-medium text-rose-600">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="rounded-2xl border border-dashed border-base-300 bg-base-100 p-16 text-center">
            <p className="text-sm text-base-content/50">Loading publications from database...</p>
          </div>
        ) : filteredPublications.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-base-300 bg-base-100 p-16 text-center">
            <BookOpen
              size={48}
              className="mx-auto mb-5 text-base-content/30"
            />
            <h2 className="text-xl font-semibold">
              No publications to display yet
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-base-content/50">
              Publications will appear here once researchers start adding
              research to RPMS.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {filteredPublications.map((pub) => (
              <div key={pub.ID} className="rounded-2xl border border-base-300 bg-base-100 p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <BookOpen size={20} />
                    </div>
                    <span className="badge badge-ghost text-xs">
                      {pub.CONFIRMATION_STATUS || 'Pending'}
                    </span>
                  </div>
                  <h2 className="text-lg font-semibold text-base-content">{pub.TITLE}</h2>
                  <p className="mt-2 text-sm text-base-content/60 line-clamp-3">{pub.ABSTRACT || 'No abstract provided.'}</p>
                </div>
                <div>
                  <div className="mt-4 pt-3 border-t border-base-100 text-xs text-base-content/50 flex justify-between">
                    <span>Views: {pub.TOTAL_VIEWS || 0}</span>
                    <span>Downloads: {pub.TOTAL_DOWNLOADS || 0}</span>
                  </div>
                  <div className="mt-2 pt-2 border-t border-base-200 flex items-center justify-between text-xs text-base-content/50">
                    <span>DOI: {pub.DOI || 'N/A'}</span>
                    <span className="font-medium text-primary">{pub.AUTHOR || 'Author'}</span>
                  </div>
                  {canDelete(pub) && (
                    <div className="mt-3 flex justify-end">
                      <button onClick={() => handleDeletePublication(pub.ID)} className="btn btn-ghost btn-xs text-error gap-1">
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

      </section>

      {/* =====================================================
          MODAL FOR SUBMITTING NEW PUBLICATION
      ====================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form onSubmit={handleAddPublication} className="w-full max-w-md rounded-2xl bg-base-100 p-6 shadow-xl space-y-4">
            <h2 className="text-xl font-bold">Submit New Publication</h2>

            {formError && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">
                {formError}
              </div>
            )}
            
            <div>
              <label className="label text-sm font-semibold">Title</label>
              <input 
                type="text" 
                required 
                placeholder="Publication title" 
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="input input-bordered w-full" 
              />
            </div>

            <div>
              <label className="label text-sm font-semibold">Abstract</label>
              <textarea 
                rows="4" 
                required 
                placeholder="Provide manuscript abstract..." 
                value={abstract}
                onChange={e => setAbstract(e.target.value)}
                className="textarea textarea-bordered w-full"
              ></textarea>
            </div>

            <div>
              <label className="label text-sm font-semibold">DOI (Optional)</label>
              <input 
                type="text" 
                placeholder="e.g. 10.1016/j.jqsrt.2020.107123" 
                value={doi}
                onChange={e => setDoi(e.target.value)}
                className="input input-bordered w-full" 
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" className="btn btn-ghost" onClick={() => setIsModalOpen(false)}>Cancel</button>
              <button type="submit" disabled={isSubmitting} className="btn btn-primary">
                {isSubmitting ? 'Submitting...' : 'Submit Manuscript'}
              </button>
            </div>
          </form>
        </div>
      )}

    </main>
  )
}

export default Publications