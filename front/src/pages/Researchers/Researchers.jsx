import { useState, useEffect } from 'react'
import {
  Users,
  Plus,
  Search,
  SlidersHorizontal,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { apiGet, asList } from '../../lib/api'


function Researchers() {
  const [researchers, setResearchers] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const { token } = useAuth()

  // ---- FIND COLLABORATORS (real feature, replaces the old placeholder) ----
  const [showCollabModal, setShowCollabModal] = useState(false)
  const [researchAreas, setResearchAreas] = useState([])
  const [institutions, setInstitutions] = useState([])
  const [collabAreaId, setCollabAreaId] = useState('')
  const [collabInstitutionId, setCollabInstitutionId] = useState('')
  const [collabResults, setCollabResults] = useState(null) // null = not searched yet
  const [isCollabSearching, setIsCollabSearching] = useState(false)
  const [collabError, setCollabError] = useState('')

  const openCollabModal = () => {
    setShowCollabModal(true)
    setCollabResults(null)
    setCollabError('')
    if (!researchAreas.length) {
      apiGet('/api/research-areas', token).then((r) => setResearchAreas(asList(r))).catch(() => { })
    }
    if (!institutions.length) {
      apiGet('/api/institutions', token).then((r) => setInstitutions(asList(r))).catch(() => { })
    }
  }

  const handleCollabSearch = async (e) => {
    e.preventDefault()
    setIsCollabSearching(true)
    setCollabError('')
    try {
      const params = new URLSearchParams()
      if (collabAreaId) params.set('areaId', collabAreaId)
      if (collabInstitutionId) params.set('institutionId', collabInstitutionId)

      const result = await apiGet(`/api/users/collaborators?${params.toString()}`, token)
      setCollabResults(asList(result))
    } catch (err) {
      console.error('Collaborator search failed:', err)
      setCollabError(err.message)
    } finally {
      setIsCollabSearching(false)
    }
  }

  // Fetch users/researchers from your Node.js backend on load with Token Auth
  useEffect(() => {
    let cancelled = false

    apiGet('/api/users', token)
      .then((result) => {
        if (!cancelled) setResearchers(asList(result))
      })
      .catch((err) => {
        if (cancelled) return
        console.error('Failed to fetch researchers:', err)
        setError(err.message)
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [token])

  // Filter researchers based on live search input (mapped to ERD attributes)
  const filteredResearchers = researchers.filter(res =>
    res.FULL_NAME?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    res.EMAIL?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    res.DEPARTMENT?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    res.ORCID?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (

    <div className="space-y-6">

      {/* =====================================================
          HEADER
      ====================================================== */}

      <section className="rounded-2xl bg-white p-6 shadow-sm">

        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">

          <div>

            <p className="mb-2 text-sm font-semibold text-indigo-600">
              Research Community
            </p>

            <h1 className="text-3xl font-bold tracking-tight">
              Researchers
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Discover researchers and potential collaborators.
            </p>

          </div>


          <button
            onClick={openCollabModal}
            className="btn btn-primary gap-2"
          >
            <Plus size={18} />

            Find Collaborators
          </button>

        </div>

      </section>


      {/* =====================================================
          SEARCH & FILTER
      ====================================================== */}

      <section className="rounded-2xl bg-white p-4 shadow-sm">

        <div className="flex flex-col gap-3 md:flex-row">

          {/* Search */}

          <div className="relative flex-1">

            <Search
              size={19}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search researchers by name, department or email..."
              className="input input-bordered w-full pl-11"
            />

          </div>


          {/* Filter */}

          <button className="btn btn-outline gap-2">

            <SlidersHorizontal size={18} />

            Filters

          </button>

        </div>

      </section>


      {/* =====================================================
          RESEARCHERS
      ====================================================== */}

      <section className="rounded-2xl bg-white shadow-sm">

        {/* Section Header */}

        <div className="border-b border-slate-200 p-6">

          <div className="flex items-center justify-between">

            <div>

              <h2 className="text-xl font-bold">
                Research Community
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Researchers available in the RPMS system.
              </p>

            </div>


            <span className="badge badge-outline">
              {filteredResearchers.length} researchers
            </span>

          </div>

        </div>


        {/* Content States: Loading, Empty, or Populated Grid */}

        {isLoading ? (
          <div className="flex min-h-[380px] items-center justify-center px-6 text-center text-sm text-slate-500">
            Loading researchers from database...
          </div>
        ) : error ? (
          <div className="m-6 rounded-xl border border-rose-200 bg-rose-50 p-6 text-center text-sm font-medium text-rose-600">
            {error}
          </div>
        ) : filteredResearchers.length === 0 ? (
          <div className="flex min-h-[380px] flex-col items-center justify-center px-6 text-center">

            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-indigo-600">

              <Users size={30} />

            </div>


            <h3 className="text-xl font-bold">
              No researchers found
            </h3>


            <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">

              Researcher profiles will appear here once
              researchers are registered and their information
              is available in the system.

            </p>


            <button
              onClick={() => window.location.reload()}
              className="btn btn-primary mt-6 gap-2"
            >

              <Users size={18} />

              Explore Researchers

            </button>

          </div>
        ) : (
          <div className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredResearchers.map((res) => (
              <div key={res.ID} className="rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-indigo-600">
                    <Users size={20} />
                  </div>
                  <h3 className="font-bold text-lg">{res.FULL_NAME}</h3>
                  <p className="text-xs text-slate-400 mt-1">{res.EMAIL}</p>
                  <p className="mt-3 text-sm text-slate-600">
                    <span className="font-semibold">Department:</span> {res.DEPARTMENT || 'Not specified'}
                  </p>
                  <p className="mt-1 text-sm text-slate-600 font-mono text-xs">
                    <span className="font-semibold">ORCID:</span> {res.ORCID || 'N/A'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

      </section>

      {/* =====================================================
          FIND COLLABORATORS MODAL (real feature)
      ====================================================== */}
      {showCollabModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="mb-1 text-xl font-bold text-slate-900">Find Collaborators</h2>
            <p className="mb-4 text-sm text-slate-500">
              Search researchers by research area and/or institution.
            </p>

            <form onSubmit={handleCollabSearch} className="flex flex-col gap-3 sm:flex-row">
              <select
                value={collabAreaId}
                onChange={(e) => setCollabAreaId(e.target.value)}
                className="select select-bordered flex-1"
              >
                <option value="">Any research area</option>
                {researchAreas.map((a) => (
                  <option key={a.ID} value={a.ID}>{a.AREA_NAME}</option>
                ))}
              </select>

              <select
                value={collabInstitutionId}
                onChange={(e) => setCollabInstitutionId(e.target.value)}
                className="select select-bordered flex-1"
              >
                <option value="">Any institution</option>
                {institutions.map((i) => (
                  <option key={i.ID} value={i.ID}>{i.NAME}</option>
                ))}
              </select>

              <button type="submit" disabled={isCollabSearching} className="btn btn-primary gap-2">
                <Search size={16} /> {isCollabSearching ? 'Searching...' : 'Search'}
              </button>
            </form>

            {collabError && (
              <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">
                {collabError}
              </div>
            )}

            <div className="mt-4 max-h-80 space-y-2 overflow-y-auto">
              {collabResults === null ? (
                <p className="py-8 text-center text-sm text-slate-400">Choose a filter and search to see matching researchers.</p>
              ) : collabResults.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-400">No researchers match those filters.</p>
              ) : (
                collabResults.map((r) => (
                  <div key={r.ID} className="rounded-xl border border-slate-200 p-4">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-slate-900">{r.FULL_NAME}</p>
                      <span className="badge badge-ghost text-xs">{r.PUBLICATION_COUNT} publications</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {r.DEPARTMENT || 'No department'} · {r.INSTITUTION_NAME || 'No institution'}
                    </p>
                    {r.RESEARCH_AREAS && (
                      <p className="mt-2 text-xs text-indigo-600">{r.RESEARCH_AREAS}</p>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="mt-4 flex justify-end border-t border-slate-100 pt-4">
              <button onClick={() => setShowCollabModal(false)} className="btn btn-ghost">Close</button>
            </div>
          </div>
        </div>
      )}

    </div>

  )

}


export default Researchers