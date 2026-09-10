import { useState, useEffect, useCallback } from 'react'
import {
  FolderKanban,
  Plus,
  Search,
  Trash2,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { apiGet, apiPost, apiDelete, asList } from '../../lib/api'

function Projects() {
  const [projects, setProjects] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  // Form states matching ERD (TITLE, STATUS, TIMELINE, BUDGET)
  const [title, setTitle] = useState('')
  const [status, setStatus] = useState('Planned')
  const [timeline, setTimeline] = useState('')
  const [budget, setBudget] = useState('')
  const [error, setError] = useState('')
  const [formError, setFormError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { token, user, role } = useAuth()

  const currentUserId = user?.ID ?? user?.id ?? null
  const canDelete = (proj) =>
    Number(proj.MANAGER_ID) === Number(currentUserId) || role === 'Admin'

  const loadProjects = useCallback(() => {
    return apiGet('/api/projects', token)
      .then((result) => setProjects(asList(result)))
      .catch((err) => {
        console.error('Failed to fetch projects:', err)
        setError(err.message)
      })
      .finally(() => setIsLoading(false))
  }, [token])

  // Fetch projects from your Node.js backend on component load
  useEffect(() => {
    loadProjects()
  }, [loadProjects])

  // Handle creating a new project via POST request matching ERD
  const handleAddProject = async (e) => {
    e.preventDefault()
    if (!title.trim()) return

    setFormError('')
    setIsSubmitting(true)

    try {
      // The backend returns the created row (including MANAGER_NAME), so the
      // grid no longer appends an undefined entry.
      const result = await apiPost(
        '/api/projects',
        {
          title: title.trim(),
          status,
          timeline: timeline.trim(),
          budget: budget === '' ? null : Number(budget),
        },
        token,
      )

      if (result.data) {
        setProjects((prev) => [result.data, ...prev])
      } else {
        await loadProjects()
      }

      setTitle('')
      setStatus('Planned')
      setTimeline('')
      setBudget('')
      setIsModalOpen(false)
    } catch (err) {
      console.error('Error creating project:', err)
      setFormError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle object-level deletion (Rubric 3.2)
  const handleDeleteProject = async (id) => {
    if (!window.confirm('Delete this project? This cannot be undone.')) return

    try {
      await apiDelete(`/api/projects/${id}`, token)
      setProjects((prev) => prev.filter((p) => p.ID !== id))
    } catch (err) {
      console.error('Error deleting project:', err)
      setError(err.message)
    }
  }

  // Filter projects based on live search input
  const filteredProjects = projects.filter(proj => 
    proj.TITLE?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    proj.STATUS?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    proj.TIMELINE?.toLowerCase().includes(searchQuery.toLowerCase())
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
              Research Workspace
            </p>
            <h1 className="text-3xl font-bold tracking-tight">
              Research Projects
            </h1>
            <p className="mt-2 text-sm text-base-content/60">
              Create, organize and manage your research projects.
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="btn btn-primary gap-2"
          >
            <Plus size={18} />
            New Project
          </button>
        </div>
      </section>

      {/* =====================================================
          SEARCH
      ====================================================== */}
      <section className="rounded-2xl bg-base-100 p-4 shadow-sm">
        <div className="relative">
          <Search
            size={19}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-base-content/40"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search your research projects..."
            className="input input-bordered w-full pl-11"
          />
        </div>
      </section>

      {/* =====================================================
          PROJECTS
      ====================================================== */}
      <section className="rounded-2xl bg-base-100 shadow-sm">
        <div className="border-b border-base-300 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">
                Your Projects
              </h2>
              <p className="mt-1 text-sm text-base-content/60">
                Research projects associated with your account.
              </p>
            </div>

            <span className="badge badge-outline">
              {filteredProjects.length} projects
            </span>
          </div>
        </div>

        {/* Content States: Loading, Empty, or Populated List */}
        {error && (
          <div className="mx-6 mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex min-h-[350px] items-center justify-center px-6 text-center text-sm text-base-content/60">
            Loading projects from database...
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="flex min-h-[350px] flex-col items-center justify-center px-6 text-center">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <FolderKanban size={30} />
            </div>

            <h3 className="text-xl font-bold">
              No projects yet
            </h3>

            <p className="mt-2 max-w-md text-sm leading-6 text-base-content/60">
              You haven't created any research projects yet.
              Your projects will appear here once you add them
              to the system.
            </p>

            <button
              onClick={() => setIsModalOpen(true)}
              className="btn btn-primary mt-6 gap-2"
            >
              <Plus size={18} />
              Create Project
            </button>
          </div>
        ) : (
          <div className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProjects.map((proj) => (
              <div key={proj.ID} className="flex flex-col justify-between rounded-xl border border-base-300 p-5 shadow-sm">
                <div>
                  <h3 className="font-bold text-lg">{proj.TITLE}</h3>
                  <div className="mt-3 space-y-1 text-sm text-base-content/70">
                    <p>Status: <span className="font-medium text-primary">{proj.STATUS}</span></p>
                    <p>Timeline: {proj.TIMELINE || 'N/A'}</p>
                    <p>Budget: ${Number(proj.BUDGET || 0).toLocaleString()}</p>
                    <p>Manager: {proj.MANAGER_NAME || 'Unknown'}</p>
                  </div>
                </div>
                {canDelete(proj) && (
                  <div className="mt-4 flex justify-end border-t border-base-200 pt-3">
                    <button onClick={() => handleDeleteProject(proj.ID)} className="btn btn-ghost btn-sm text-error gap-1">
                      <Trash2 size={16}/> Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* =====================================================
          MODAL FOR ERD-COMPLIANT PROJECT CREATION
      ====================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form onSubmit={handleAddProject} className="w-full max-w-md rounded-2xl bg-base-100 p-6 shadow-xl">
            <h2 className="mb-4 text-xl font-bold">Create New Project</h2>

            {formError && (
              <div className="mb-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">
                {formError}
              </div>
            )}
            
            <label className="label text-sm font-semibold">Project Title</label>
            <input 
              type="text" 
              placeholder="Enter title" 
              required 
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="input input-bordered mb-3 w-full" 
            />

            <label className="label text-sm font-semibold">Status</label>
            <select 
              value={status}
              onChange={e => setStatus(e.target.value)}
              className="select select-bordered mb-3 w-full"
            >
              <option value="Planned">Planned</option>
              <option value="Active">Active</option>
              <option value="Completed">Completed</option>
            </select>

            <label className="label text-sm font-semibold">Timeline</label>
            <input 
              type="text" 
              placeholder="e.g. 6 Months" 
              value={timeline}
              onChange={e => setTimeline(e.target.value)}
              className="input input-bordered mb-3 w-full" 
            />

            <label className="label text-sm font-semibold">Budget ($)</label>
            <input 
              type="number" 
              placeholder="Enter budget" 
              value={budget}
              onChange={e => setBudget(e.target.value)}
              className="input input-bordered mb-5 w-full" 
            />

            <div className="flex justify-end gap-3">
              <button type="button" className="btn btn-ghost" onClick={() => setIsModalOpen(false)}>Cancel</button>
              <button type="submit" disabled={isSubmitting} className="btn btn-primary">
                {isSubmitting ? 'Saving...' : 'Save Project'}
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  )
}

export default Projects