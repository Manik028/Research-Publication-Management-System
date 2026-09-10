import { useState, useEffect, useCallback } from 'react'
import {
  BookOpen,
  Plus,
  Search,
  SlidersHorizontal,
  FileText,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { apiGet, apiPost, asList } from '../../lib/api'


function DashboardPublications() {
  const [publications, setPublications] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [form, setForm] = useState({ title: '', abstract: '', doi: '' })

  const { token } = useAuth()

  // This page only ever showed the current user's work, so it now asks the
  // backend for exactly that (?mine=true) instead of filtering client-side.
  const loadPublications = useCallback(() => {
    return apiGet('/api/publications?mine=true', token)
      .then((result) => setPublications(asList(result)))
      .catch((err) => {
        console.error('Failed to fetch publications:', err)
        setError(err.message)
      })
      .finally(() => setIsLoading(false))
  }, [token])

  // Fetch publications from your Node.js backend on load
  useEffect(() => {
    loadPublications()
  }, [loadPublications])

  // Creating a publication used to run on window.prompt(), which can't
  // validate input and is blocked in some browsers. It now uses a real form.
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

  // Filter publications based on live search input
  const filteredPublications = publications.filter(pub => 
    pub.TITLE?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pub.ABSTRACT?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (

    <div className="mx-auto max-w-7xl space-y-6">


      {/* =========================================
          PAGE HEADER
      ========================================== */}

      <section className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 px-6 py-7 shadow-xl shadow-black/10 sm:px-8">

        {/* Decorative glow */}

        <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-indigo-600/10 blur-3xl" />

        <div className="pointer-events-none absolute -bottom-20 left-1/3 h-40 w-40 rounded-full bg-violet-600/10 blur-3xl" />


        <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">

          <div>

            <div className="mb-3 flex items-center gap-2">

              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">

                <BookOpen size={19} />

              </div>

              <span className="text-sm font-semibold text-indigo-400">
                Research Workspace
              </span>

            </div>


            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Publications
            </h1>


            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">
              Manage, organize and track your academic research
              publications from one place.
            </p>

          </div>


          <button 
            onClick={() => setIsModalOpen(true)}
            className="group flex h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition-all duration-200 hover:bg-indigo-500 hover:shadow-indigo-500/30 active:scale-[0.98]"
          >

            <Plus
              size={18}
              className="transition-transform duration-200 group-hover:rotate-90"
            />

            New Publication

          </button>

        </div>

      </section>


      {/* =========================================
          SEARCH + FILTER
      ========================================== */}

      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-4 shadow-lg shadow-black/10">

        <div className="flex flex-col gap-3 lg:flex-row">

          {/* Search */}

          <div className="relative flex-1">

            <Search
              size={19}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
            />

            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search publications by title or abstract..."
              className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950 pl-11 pr-4 text-sm text-slate-200 outline-none transition placeholder:text-slate-600 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
            />

          </div>


          {/* Filter */}

          <button className="flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-950 px-5 text-sm font-medium text-slate-300 transition hover:border-slate-600 hover:bg-slate-800">

            <SlidersHorizontal size={17} />

            Filters

          </button>

        </div>

      </section>


      {/* =========================================
          PUBLICATION CONTENT
      ========================================== */}

      <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-lg shadow-black/10">


        {/* Section header */}

        <div className="flex flex-col gap-2 border-b border-slate-800 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">

          <div>

            <h2 className="text-lg font-semibold text-white">
              Your Publications
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Research works associated with your account.
            </p>

          </div>


          <span className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-xs font-medium text-slate-400">
            {filteredPublications.length} publications
          </span>

        </div>


        {/* Content State: Loading, Empty, or Populated List */}
        {error && (
          <div className="mx-6 mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm font-medium text-rose-400">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex min-h-[380px] items-center justify-center px-6 py-12 text-slate-400">
            Loading publications from database...
          </div>
        ) : filteredPublications.length === 0 ? (
          <div className="flex min-h-[380px] items-center justify-center px-6 py-12">

            <div className="max-w-md text-center">


              {/* Icon */}

              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl border border-indigo-500/10 bg-indigo-500/10 text-indigo-400">

                <FileText size={34} />

              </div>


              <h3 className="mt-6 text-xl font-semibold text-white">
                No publications yet
              </h3>


              <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-slate-500">
                You haven't added any research publications yet.
                Once you submit your research, your publications
                will appear here.
              </p>


              <button 
                onClick={() => setIsModalOpen(true)}
                className="group mt-7 inline-flex h-11 items-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition-all duration-200 hover:bg-indigo-500 hover:shadow-indigo-500/30 active:scale-[0.98]"
              >

                <Plus
                  size={18}
                  className="transition-transform duration-200 group-hover:rotate-90"
                />

                Add Your First Publication

              </button>

            </div>

          </div>
        ) : (
          <div className="divide-y divide-slate-800 px-6 py-4">
            {filteredPublications.map((pub) => (
              <div key={pub.ID} className="py-4">
                <h3 className="text-base font-semibold text-white">{pub.TITLE}</h3>
                <p className="mt-1 text-sm text-slate-400">{pub.ABSTRACT || 'No abstract provided.'}</p>
              </div>
            ))}
          </div>
        )}

      </section>


      {/* =========================================
          NEW PUBLICATION MODAL
      ========================================== */}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <form
            onSubmit={handleAddPublication}
            className="w-full max-w-md space-y-4 rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl"
          >
            <h2 className="text-xl font-bold text-white">New Publication</h2>

            <div>
              <label htmlFor="pub-title" className="mb-1.5 block text-sm font-semibold text-slate-300">
                Title
              </label>
              <input
                id="pub-title"
                type="text"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Publication title"
                className="h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 text-sm text-slate-200 outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label htmlFor="pub-abstract" className="mb-1.5 block text-sm font-semibold text-slate-300">
                Abstract
              </label>
              <textarea
                id="pub-abstract"
                rows="4"
                required
                value={form.abstract}
                onChange={(e) => setForm({ ...form, abstract: e.target.value })}
                placeholder="Provide the manuscript abstract..."
                className="w-full rounded-xl border border-slate-700 bg-slate-950 p-4 text-sm text-slate-200 outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label htmlFor="pub-doi" className="mb-1.5 block text-sm font-semibold text-slate-300">
                DOI (optional)
              </label>
              <input
                id="pub-doi"
                type="text"
                value={form.doi}
                onChange={(e) => setForm({ ...form, doi: e.target.value })}
                placeholder="e.g. 10.1016/j.jqsrt.2020.107123"
                className="h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 text-sm text-slate-200 outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-800 pt-4">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
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