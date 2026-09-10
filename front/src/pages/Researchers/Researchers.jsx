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

      <section className="rounded-2xl bg-base-100 p-6 shadow-sm">

        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">

          <div>

            <p className="mb-2 text-sm font-semibold text-primary">
              Research Community
            </p>

            <h1 className="text-3xl font-bold tracking-tight">
              Researchers
            </h1>

            <p className="mt-2 text-sm text-base-content/60">
              Discover researchers and potential collaborators.
            </p>

          </div>


          <button
            onClick={() => alert("Collaborator search tools coming soon!")}
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

      <section className="rounded-2xl bg-base-100 p-4 shadow-sm">

        <div className="flex flex-col gap-3 md:flex-row">

          {/* Search */}

          <div className="relative flex-1">

            <Search
              size={19}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-base-content/40"
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

      <section className="rounded-2xl bg-base-100 shadow-sm">

        {/* Section Header */}

        <div className="border-b border-base-300 p-6">

          <div className="flex items-center justify-between">

            <div>

              <h2 className="text-xl font-bold">
                Research Community
              </h2>

              <p className="mt-1 text-sm text-base-content/60">
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
          <div className="flex min-h-[380px] items-center justify-center px-6 text-center text-sm text-base-content/60">
            Loading researchers from database...
          </div>
        ) : error ? (
          <div className="m-6 rounded-xl border border-rose-200 bg-rose-50 p-6 text-center text-sm font-medium text-rose-600">
            {error}
          </div>
        ) : filteredResearchers.length === 0 ? (
          <div className="flex min-h-[380px] flex-col items-center justify-center px-6 text-center">

            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">

              <Users size={30} />

            </div>


            <h3 className="text-xl font-bold">
              No researchers found
            </h3>


            <p className="mt-2 max-w-md text-sm leading-6 text-base-content/60">

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
              <div key={res.ID} className="rounded-xl border border-base-300 p-5 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Users size={20} />
                  </div>
                  <h3 className="font-bold text-lg">{res.FULL_NAME}</h3>
                  <p className="text-xs text-base-content/50 mt-1">{res.EMAIL}</p>
                  <p className="mt-3 text-sm text-base-content/70">
                    <span className="font-semibold">Department:</span> {res.DEPARTMENT || 'Not specified'}
                  </p>
                  <p className="mt-1 text-sm text-base-content/70 font-mono text-xs">
                    <span className="font-semibold">ORCID:</span> {res.ORCID || 'N/A'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

      </section>

    </div>

  )

}


export default Researchers