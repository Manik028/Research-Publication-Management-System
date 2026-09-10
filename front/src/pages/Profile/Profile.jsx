import { useState, useEffect } from 'react'
import {
  UserCircle,
  Mail,
  GraduationCap,
  BookOpen,
  Award,
  Edit3,
  Save,
  X,
  ShieldCheck,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { apiGet, apiPut, asList } from '../../lib/api'

function Profile() {
  const { user, token, role, updateUser } = useAuth()

  const [profile, setProfile] = useState({
    fullName: user?.FULL_NAME || 'Researcher Name',
    email: user?.EMAIL || 'researcher@example.com',
    institution: user?.INSTITUTION || 'Not specified',
    department: user?.DEPARTMENT || 'Not specified',
    orcid: user?.ORCID || 'Not specified',
    id: user?.ID || user?.id || null,
  })

  const [stats, setStats] = useState({
    publications: 0,
    projects: 0,
    reviews: 0,
  })

  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)

  useEffect(() => {
    if (!token) return
    let cancelled = false

    const safe = (path) => apiGet(path, token).then(asList).catch(() => [])

    Promise.all([
      safe('/api/publications?mine=true'),
      safe('/api/projects'),
      safe('/api/reviews'),
    ]).then(([pubs, projects, reviews]) => {
      if (cancelled) return

      const myId = user?.ID ?? user?.id ?? null

      setStats({
        publications: pubs.length,
        // Only the projects this user actually manages.
        projects: projects.filter((p) => Number(p.MANAGER_ID) === Number(myId)).length,
        reviews: reviews.filter((r) => r.STATUS?.toLowerCase() === 'completed').length,
      })
      setIsLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [token, user])

  const handleChange = (e) => {
    const { name, value } = e.target
    setProfile(prev => ({ ...prev, [name]: value }))
  }

  const handleSave = async () => {
    if (!profile.id) {
      setIsError(true)
      setMessage('Cannot save: user id not found. Try signing out and back in.')
      return
    }

    setIsSaving(true)
    setIsError(false)
    setMessage('')

    try {
      // DEPARTMENT and ORCID are sent explicitly so the backend keeps them.
      const result = await apiPut(
        `/api/users/${profile.id}`,
        {
          FULL_NAME: profile.fullName,
          EMAIL: profile.email,
          DEPARTMENT: profile.department,
          ORCID: profile.orcid,
        },
        token,
      )

      // Keep the cached session user in sync so the sidebar/navbar update too.
      if (result.data) updateUser(result.data)

      setIsEditing(false)
      setMessage('Profile updated successfully.')
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      console.error('Error updating profile:', err)
      setIsError(true)
      setMessage(err.message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">

      {/* =====================================================
          PAGE HEADER
      ====================================================== */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <UserCircle size={19} />
              </div>
              <p className="text-sm font-semibold text-indigo-600">
                Account
              </p>
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              My Profile
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-500 sm:text-base">
              Manage your researcher profile and academic credentials.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700 hover:shadow-xl active:scale-[0.99]"
          >
            {isEditing ? <X size={17} /> : <Edit3 size={17} />}
            {isEditing ? 'Cancel Editing' : 'Edit Profile'}
          </button>
        </div>

        {message && (
          <div
            className={`mt-4 rounded-xl px-4 py-2 text-sm font-medium ${
              isError
                ? 'border border-rose-200 bg-rose-50 text-rose-600'
                : 'bg-indigo-50 text-indigo-700'
            }`}
          >
            {message}
          </div>
        )}
      </section>

      {/* =====================================================
          PROFILE OVERVIEW
      ====================================================== */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="h-32 bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600" />

        <div className="px-6 pb-7 sm:px-8">
          <div className="-mt-12 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            {/* Avatar */}
            <div className="relative">
              <div className="flex h-24 w-24 items-center justify-center rounded-2xl border-4 border-white bg-indigo-50 text-indigo-600 shadow-lg font-bold text-3xl">
                {profile.fullName?.charAt(0) || 'R'}
              </div>
              <div className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-xl border-2 border-white bg-indigo-600 text-white shadow-md">
                <ShieldCheck size={18} />
              </div>
            </div>

            {/* Profile name */}
            <div className="flex-1 sm:pb-1">
              <h2 className="text-2xl font-bold text-slate-900">
                {profile.fullName}
              </h2>
              <p className="mt-1 text-sm text-slate-500 capitalize">
                Role: <span className="font-semibold text-indigo-600">{role || 'Researcher'}</span>
              </p>
            </div>

            {/* Status */}
            <span className="inline-flex w-fit items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
              Active Session
            </span>
          </div>
        </div>
      </section>

      {/* =====================================================
          PERSONAL INFORMATION
      ====================================================== */}
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-5 sm:px-8">
          <h2 className="text-lg font-bold text-slate-900">
            Personal Information
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Your core account credentials mapped from the database.
          </p>
        </div>

        <div className="grid gap-6 p-6 sm:grid-cols-2 sm:p-8">
          {/* Full Name */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Full Name
            </label>
            <div className="relative">
              <UserCircle size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                name="fullName"
                value={profile.fullName}
                onChange={handleChange}
                readOnly={!isEditing}
                className={`h-12 w-full rounded-xl border border-slate-200 pl-11 pr-4 text-sm outline-none ${isEditing ? 'bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100' : 'bg-slate-50 text-slate-700'}`}
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Email Address
            </label>
            <div className="relative">
              <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                name="email"
                value={profile.email}
                onChange={handleChange}
                readOnly={!isEditing}
                className={`h-12 w-full rounded-xl border border-slate-200 pl-11 pr-4 text-sm outline-none ${isEditing ? 'bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100' : 'bg-slate-50 text-slate-700'}`}
              />
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          ACADEMIC INFORMATION
      ====================================================== */}
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-5 sm:px-8">
          <h2 className="text-lg font-bold text-slate-900">
            Academic Information
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Your departmental affiliation and professional identifiers.
          </p>
        </div>

        <div className="grid gap-6 p-6 sm:grid-cols-2 sm:p-8">
          {/* Department */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Department
            </label>
            <div className="relative">
              <GraduationCap size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                name="department"
                value={profile.department}
                onChange={handleChange}
                readOnly={!isEditing}
                className={`h-12 w-full rounded-xl border border-slate-200 pl-11 pr-4 text-sm outline-none ${isEditing ? 'bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100' : 'bg-slate-50 text-slate-700'}`}
              />
            </div>
          </div>

          {/* ORCID */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              ORCID Identifier
            </label>
            <div className="relative">
              <BookOpen size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                name="orcid"
                value={profile.orcid}
                onChange={handleChange}
                readOnly={!isEditing}
                className={`h-12 w-full rounded-xl border border-slate-200 pl-11 pr-4 text-sm outline-none ${isEditing ? 'bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100' : 'bg-slate-50 text-slate-700'}`}
              />
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          RESEARCH SUMMARY
      ====================================================== */}
      <section className="grid gap-5 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <BookOpen size={21} />
            </div>
            <span className="text-2xl font-bold text-slate-900">
              {isLoading ? '—' : stats.publications}
            </span>
          </div>
          <h3 className="mt-5 text-sm font-semibold text-slate-700">Publications</h3>
          <p className="mt-1 text-xs text-slate-500">Research papers in system</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
              <GraduationCap size={21} />
            </div>
            <span className="text-2xl font-bold text-slate-900">
              {isLoading ? '—' : stats.projects}
            </span>
          </div>
          <h3 className="mt-5 text-sm font-semibold text-slate-700">Research Projects</h3>
          <p className="mt-1 text-xs text-slate-500">Active project initiatives</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Award size={21} />
            </div>
            <span className="text-2xl font-bold text-slate-900">
              {isLoading ? '—' : stats.reviews}
            </span>
          </div>
          <h3 className="mt-5 text-sm font-semibold text-slate-700">Reviews Completed</h3>
          <p className="mt-1 text-xs text-slate-500">Peer review assessments</p>
        </div>
      </section>

      {/* =====================================================
          SAVE AREA
      ====================================================== */}
      {isEditing && (
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-60"
          >
            <Save size={17} /> {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      )}

    </div>
  )
}

export default Profile