import { useState, useEffect } from 'react'

import {
  BookOpen,
  FolderKanban,
  Users,
  FileText,
  ArrowRight,
  Plus,
  Search,
  Bell,
  ShieldCheck,
} from 'lucide-react'

import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { apiGet, asList } from '../../lib/api'


function Dashboard() {
  const { user, role, token } = useAuth()

  // State for overview counts and recent data
  const [stats, setStats] = useState({
    publications: '—',
    projects: '—',
    researchers: '—',
    documents: '—',
  })
  const [recentPublications, setRecentPublications] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    // A failure in one panel shouldn't blank the whole dashboard, so each
    // request resolves to a safe fallback on error and the banner reports it.
    const safeList = (path) =>
      apiGet(path, token)
        .then(asList)
        .catch((err) => {
          console.error(`Dashboard: ${path} failed`, err)
          setError((prev) => prev || err.message)
          return []
        })

    // Summary counts come from ONE Oracle query (V_DASHBOARD_SUMMARY, see
    // database/views.sql) instead of fetching entire publication/project/
    // user/file tables just to read their .length.
    const safeSummary = () =>
      apiGet('/api/dashboard', token)
        .then((res) => res?.data || null)
        .catch((err) => {
          console.error('Dashboard: /api/dashboard failed', err)
          setError((prev) => prev || err.message)
          return null
        })

    Promise.all([safeSummary(), safeList('/api/publications')]).then(([summary, pubs]) => {
      if (cancelled) return

      setStats({
        publications: summary ? summary.TOTAL_PUBLICATIONS : pubs.length,
        projects: summary ? summary.TOTAL_PROJECTS : '—',
        researchers: summary ? summary.TOTAL_RESEARCHERS : '—',
        documents: summary ? summary.TOTAL_DOCUMENTS : '—',
      })

      setRecentPublications(pubs.slice(0, 3))
      setIsLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [token])

  return (

    <main className="min-h-[calc(100vh-4rem)] bg-slate-50">


      {/* =========================================
          DASHBOARD HEADER
      ========================================= */}

      <section className="border-b border-slate-200 bg-white">

        <div className="mx-auto max-w-7xl px-5 py-8 lg:px-8">

          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">


            {/* Welcome */}

            <div>

              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-semibold text-indigo-600">Research Workspace</span>
                <span className="badge badge-sm badge-ghost gap-1 font-mono">
                  <ShieldCheck size={12} className="text-indigo-600" /> {role || 'Researcher'}
                </span>
              </div>

              <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                Welcome back, {user?.FULL_NAME || 'Scholar'}!
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Manage your academic publications, projects, and research activities from one place.
              </p>

            </div>


            {/* Quick actions */}

            <div className="flex flex-wrap gap-3">

              <Link to="/dashboard/publications" className="btn btn-outline border-slate-200 bg-white text-slate-700 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600">

                <Search size={17} />

                Search

              </Link>


              <Link to="/dashboard/publications" className="btn bg-indigo-600 text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700">

                <Plus size={17} />

                New Publication

              </Link>

            </div>

          </div>

        </div>

      </section>


      {/* =========================================
          MAIN DASHBOARD CONTENT
      ========================================= */}

      <section className="mx-auto max-w-7xl px-5 py-8 lg:px-8">

        {error && (
          <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-medium text-rose-600">
            Some dashboard data could not be loaded: {error}
          </div>
        )}


        {/* =========================================
            OVERVIEW CARDS
        ========================================= */}

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">


          {/* Publications */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition">

            <div className="flex items-start justify-between">

              <div>

                <p className="text-sm font-medium text-slate-500">
                  Publications
                </p>

                <p className="mt-3 text-3xl font-bold text-slate-900">
                  {stats.publications}
                </p>

              </div>


              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">

                <BookOpen size={21} />

              </div>

            </div>


            <p className="mt-4 text-xs text-slate-400">
              {stats.publications === '—' ? 'Fetching from database...' : 'Synced with Oracle database'}
            </p>

          </div>


          {/* Projects */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition">

            <div className="flex items-start justify-between">

              <div>

                <p className="text-sm font-medium text-slate-500">
                  Research Projects
                </p>

                <p className="mt-3 text-3xl font-bold text-slate-900">
                  {stats.projects}
                </p>

              </div>


              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-600">

                <FolderKanban size={21} />

              </div>

            </div>


            <p className="mt-4 text-xs text-slate-400">
              {stats.projects === '—' ? 'Fetching from database...' : 'Synced with Oracle database'}
            </p>

          </div>


          {/* Researchers */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition">

            <div className="flex items-start justify-between">

              <div>

                <p className="text-sm font-medium text-slate-500">
                  Researchers
                </p>

                <p className="mt-3 text-3xl font-bold text-slate-900">
                  {stats.researchers}
                </p>

              </div>


              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">

                <Users size={21} />

              </div>

            </div>


            <p className="mt-4 text-xs text-slate-400">
              {stats.researchers === '—' ? 'Fetching from database...' : 'Synced with Oracle database'}
            </p>

          </div>


          {/* Documents */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition">

            <div className="flex items-start justify-between">

              <div>

                <p className="text-sm font-medium text-slate-500">
                  Documents
                </p>

                <p className="mt-3 text-3xl font-bold text-slate-900">
                  {stats.documents}
                </p>

              </div>


              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">

                <FileText size={21} />

              </div>

            </div>


            <p className="mt-4 text-xs text-slate-400">
              {stats.documents === '—' ? 'Fetching from database...' : 'Synced with Oracle database'}
            </p>

          </div>

        </div>


        {/* =========================================
            SECOND ROW
        ========================================= */}

        <div className="mt-6 grid gap-6 lg:grid-cols-3">


          {/* =========================================
              RECENT PUBLICATIONS
          ========================================= */}

          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm lg:col-span-2">

            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">

              <div>

                <h2 className="font-semibold text-slate-900">
                  Recent Publications
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Your latest research publications
                </p>

              </div>


              <Link
                to="/dashboard/publications"
                className="flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
              >

                View all

                <ArrowRight size={15} />

              </Link>

            </div>


            {/* Conditional state: Loading, Empty, or Populated */}
            {isLoading ? (
              <div className="flex min-h-64 flex-col items-center justify-center px-6 py-10 text-center">
                <p className="text-sm text-slate-400">Loading publications...</p>
              </div>
            ) : recentPublications.length === 0 ? (
              <div className="flex min-h-64 flex-col items-center justify-center px-6 py-10 text-center">

                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-500 mb-3">

                  <BookOpen size={24} />

                </div>


                <h3 className="font-semibold text-slate-800">
                  No publications yet
                </h3>


                <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">

                  Your recent publications will appear here
                  once manuscripts are added to the system.

                </p>

              </div>
            ) : (
              <div className="divide-y divide-slate-100 px-6 py-2">
                {recentPublications.map((pub) => (
                  <div key={pub.ID} className="py-4">
                    <h4 className="font-semibold text-slate-900">{pub.TITLE}</h4>
                    <p className="mt-1 text-xs text-slate-500 line-clamp-2">{pub.ABSTRACT || 'No abstract provided.'}</p>
                    <div className="mt-2 flex items-center gap-3 text-[11px] text-slate-400">
                      <span className="badge badge-xs badge-ghost">{pub.CONFIRMATION_STATUS || 'Pending'}</span>
                      <span>DOI: {pub.DOI || 'N/A'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>


          {/* =========================================
              ACTIVITY
          ========================================= */}

          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col justify-between">

            <div>
              <div className="border-b border-slate-100 px-6 py-5">

                <div className="flex items-center gap-3">

                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">

                    <Bell size={18} />

                  </div>


                  <div>

                    <h2 className="font-semibold text-slate-900">
                      Recent Activity
                    </h2>

                    <p className="mt-1 text-xs text-slate-500">
                      System notifications & events
                    </p>

                  </div>

                </div>

              </div>


              <div className="flex min-h-56 flex-col items-center justify-center px-6 py-10 text-center">

                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50 text-slate-400 mb-3">
                  <Bell size={22} />
                </div>

                <p className="text-sm font-semibold text-slate-800">
                  No recent activity
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-400 max-w-xs">

                  Research activities, grants, and peer reviews will appear here.

                </p>

              </div>
            </div>

            <div className="border-t border-slate-100 p-4 bg-slate-50/50 rounded-b-2xl text-center">
              <span className="text-xs text-slate-400 font-medium">Session Active • Secure JWT</span>
            </div>

          </div>

        </div>


        {/* =========================================
            QUICK ACTIONS
        ========================================= */}

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <div className="mb-5">

            <h2 className="font-semibold text-slate-900">
              Quick Actions
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Frequently used research tools
            </p>

          </div>


          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">


            <Link
              to="/publications"
              className="group rounded-xl border border-slate-200 p-4 transition hover:border-indigo-200 hover:bg-indigo-50/50"
            >

              <BookOpen
                size={20}
                className="text-indigo-600"
              />

              <p className="mt-3 text-sm font-semibold text-slate-800">
                Browse Publications
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Explore research publications
              </p>

            </Link>


            <Link
              to="/dashboard/projects"
              className="group rounded-xl border border-slate-200 p-4 transition hover:border-indigo-200 hover:bg-indigo-50/50"
            >

              <FolderKanban
                size={20}
                className="text-indigo-600"
              />

              <p className="mt-3 text-sm font-semibold text-slate-800">
                Research Projects
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Organize ongoing initiatives
              </p>

            </Link>


            <Link
              to="/dashboard/reviews"
              className="group rounded-xl border border-slate-200 p-4 transition hover:border-indigo-200 hover:bg-indigo-50/50"
            >

              <Users
                size={20}
                className="text-indigo-600"
              />

              <p className="mt-3 text-sm font-semibold text-slate-800">
                Peer Review
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Assess assigned manuscripts
              </p>

            </Link>


            <Link
              to="/dashboard/grants"
              className="group rounded-xl border border-slate-200 p-4 transition hover:border-indigo-200 hover:bg-indigo-50/50"
            >

              <FileText
                size={20}
                className="text-indigo-600"
              />

              <p className="mt-3 text-sm font-semibold text-slate-800">
                Grants & Funding
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Track financial allocations
              </p>

            </Link>

          </div>

        </div>

      </section>

    </main>

  )
}


export default Dashboard