import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  BookOpen,
  Plus,
  Search,
  SlidersHorizontal,
  FileText,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { apiGet, apiPost, apiPut, asList } from '../../lib/api'


function DashboardPublications() {
  const [publications, setPublications] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [form, setForm] = useState({ title: '', abstract: '', doi: '' })

  const { token, role } = useAuth()

  // Managers/Admins need to see and act on everyone's submissions, not just
  // their own, so this now loads the full list — same data the public
  // /publications page shows — rather than filtering to ?mine=true.
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

  const handleAddPublication = async (e) => {
    e.preventDefault()
    if (!form.title.trim() || !form.abstract.trim()) return

    setError('')
    setIsSubmitting(true)

    try {
      const result = await apiPost(
        '/api/publications',
        { title: form.title.trim(), abstract: form.abstract.trim(), doi: form.doi.trim() || null },
        token,
      )

      if (result.data) {
        setPublications((prev) => [result.data, ...prev])
      } else {
        await loadPublications()
      }

      setForm({ title: '', abstract: '', doi: '' })
      setIsModalOpen(false)
    } catch (err) {
      console.error('Error creating publication:', err)
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const canDecide = (pub) =>
    (role === 'Admin' || role === 'Manager') &&
    ['Under Review', 'Resubmitted'].includes(pub.CONFIRMATION_STATUS)

  const handleApprove = async (id) => {
    try {
      const result = await apiPut(`/api/publications/${id}/approve`, {}, token)
      setPublications((prev) => prev.map((p) => (p.ID === id ? { ...p, ...(result.data || {}) } : p)))
    } catch (err) {
      console.error('Error approving publication:', err)
      setError(err.message)
    }
  }

  const handleReject = async (id) => {
    if (!window.confirm('Reject this publication?')) return
    try {
      const result = await apiPut(`/api/publications/${id}/reject`, {}, token)
      setPublications((prev) => prev.map((p) => (p.ID === id ? { ...p, ...(result.data || {}) } : p)))
    } catch (err) {
      console.error('Error rejecting publication:', err)
      setError(err.message)
    }
  }

  const filteredPublications = publications.filter(pub =>
    pub.TITLE?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pub.ABSTRACT?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (

    <div className="mx-auto max-w-7xl space-y-6">

      {/* =========================================
          PAGE HEADER
      ========================================== */}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">

        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">

          <div>

            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                <BookOpen size={19} />
              </div>
              <span className="text-sm font-semibold text-indigo-600">
                Research Workspace
              </span>
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Publications
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
              Manage, organize and track your academic research
              publications from one place.
            </p>

          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="btn btn-primary gap-2 self-start md:self-auto"
          >
            <Plus size={18} />
            New Publication
          </button>

        </div>

      </section>


      {/* =========================================
          SEARCH + FILTER
      ========================================== */}

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

        <div className="flex flex-col gap-3 lg:flex-row">

          <div className="relative flex-1">
            <Search
              size={19}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search publications by title or abstract..."
              className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
            />
          </div>

          <button className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600">
            <SlidersHorizontal size={17} />
            Filters
          </button>

        </div>

      </section>


      {/* =========================================
          PUBLICATION CONTENT
      ========================================== */}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        <div className="flex flex-col gap-2 border-b border-slate-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              All Publications
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Every publication currently in the RPMS system.
            </p>
          </div>

          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
            {filteredPublications.length} publications
          </span>

        </div>

        {error && (
          <div className="mx-6 mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex min-h-[380px] items-center justify-center px-6 py-12 text-slate-500">
            Loading publications from database...
          </div>
        ) : filteredPublications.length === 0 ? (
          <div className="flex min-h-[380px] items-center justify-center px-6 py-12">

            <div className="max-w-md text-center">

              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-500">
                <FileText size={34} />
              </div>

              <h3 className="mt-6 text-xl font-semibold text-slate-900">
                No publications yet
              </h3>

              <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-slate-500">
                No research publications exist in the system yet.
                Once someone submits one, it will appear here.
              </p>

              <button
                onClick={() => setIsModalOpen(true)}
                className="btn btn-primary mt-7 gap-2"
              >
                <Plus size={18} />
                Add Your First Publication
              </button>

            </div>

          </div>
        ) : (
          <div className="divide-y divide-slate-100 px-6 py-4">
            {filteredPublications.map((pub) => (
              <div key={pub.ID} className="flex items-start justify-between gap-4 py-4">
                <div className="min-w-0">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="badge badge-ghost text-xs">
                      {pub.CONFIRMATION_STATUS || 'Draft'}
                    </span>
                    <span className="text-xs text-slate-400">by {pub.AUTHOR || 'Unknown'}</span>
                  </div>
                  <Link to={`/publications/${pub.ID}`} className="text-base font-semibold text-slate-900 hover:text-indigo-600">
                    {pub.TITLE}
                  </Link>
                  <p className="mt-1 text-sm text-slate-500">{pub.ABSTRACT || 'No abstract provided.'}</p>
                </div>
                {canDecide(pub) && (
                  <div className="flex shrink-0 gap-2">
                    <button onClick={() => handleApprove(pub.ID)} className="btn btn-ghost btn-xs text-emerald-600 gap-1">
                      <CheckCircle2 size={14} /> Approve
                    </button>
                    <button onClick={() => handleReject(pub.ID)} className="btn btn-ghost btn-xs text-amber-600 gap-1">
                      <XCircle size={14} /> Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

      </section>


      {/* =========================================
          NEW PUBLICATION MODAL
      ========================================== */}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form
            onSubmit={handleAddPublication}
            className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6 shadow-xl"
          >
            <h2 className="text-xl font-bold text-slate-900">New Publication</h2>

            <div>
              <label htmlFor="pub-title" className="label text-sm font-semibold text-slate-700">
                Title
              </label>
              <input
                id="pub-title"
                type="text"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Publication title"
                className="input input-bordered w-full"
              />
            </div>

            <div>
              <label htmlFor="pub-abstract" className="label text-sm font-semibold text-slate-700">
                Abstract
              </label>
              <textarea
                id="pub-abstract"
                rows="4"
                required
                value={form.abstract}
                onChange={(e) => setForm({ ...form, abstract: e.target.value })}
                placeholder="Provide the manuscript abstract..."
                className="textarea textarea-bordered w-full"
              />
            </div>

            <div>
              <label htmlFor="pub-doi" className="label text-sm font-semibold text-slate-700">
                DOI (optional)
              </label>
              <input
                id="pub-doi"
                type="text"
                value={form.doi}
                onChange={(e) => setForm({ ...form, doi: e.target.value })}
                placeholder="e.g. 10.1016/j.jqsrt.2020.107123"
                className="input input-bordered w-full"
              />
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="btn btn-ghost"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-primary"
              >
                {isSubmitting ? 'Saving...' : 'Save Publication'}
              </button>
            </div>
          </form>
        </div>
      )}

    </div>

  )

}


export default DashboardPublications