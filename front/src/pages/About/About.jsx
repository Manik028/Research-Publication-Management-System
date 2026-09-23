import { useState, useEffect } from 'react'

import {
  FlaskConical,
  Users,
  FileText,
  ShieldCheck,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { apiGet, asList } from '../../lib/api'

function About() {
  // State to hold live database counts connected to your backend API
  const [stats, setStats] = useState({
    researchers: '...',
    publications: '...',
    projects: '...',
    reviews: '...',
  })

  // About is a public page: /api/users, /api/projects and /api/reviews all
  // require a token, so those counters only fill in for a signed-in visitor
  // and fall back to 0 (rather than a crash) for anonymous ones.
  const { token } = useAuth()

  useEffect(() => {
    let cancelled = false

    const count = (path) =>
      apiGet(path, token)
        .then((result) => asList(result).length)
        .catch(() => 0)

    Promise.all([
      count('/api/users'),
      count('/api/publications'),
      count('/api/projects'),
      count('/api/reviews'),
    ]).then(([researchers, publications, projects, reviews]) => {
      if (cancelled) return
      setStats({ researchers, publications, projects, reviews })
    })

    return () => {
      cancelled = true
    }
  }, [token])

  return (
    <main className="min-h-screen bg-slate-50">

      <section className="mx-auto max-w-7xl px-5 py-16 lg:px-8">

        <div className="max-w-3xl">

          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-indigo-600">

            <FlaskConical size={16} />

            About RPMS

          </div>


          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
            Research & Publication Management System
          </h1>


          <p className="mt-6 text-lg leading-8 text-slate-500">
            RPMS is a centralized academic platform designed to help
            researchers manage research activities, publications,
            collaborations and peer-review workflows.
          </p>

        </div>


        <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-4">

          <Feature
            icon={<Users size={22} />}
            title="Researchers"
            text="Connect researchers and collaborators in one platform."
            stat={stats.researchers}
          />

          <Feature
            icon={<FileText size={22} />}
            title="Publications"
            text="Organize and discover academic research publications."
            stat={stats.publications}
          />

          <Feature
            icon={<FlaskConical size={22} />}
            title="Research"
            text="Manage research projects and academic activities."
            stat={stats.projects}
          />

          <Feature
            icon={<ShieldCheck size={22} />}
            title="Peer Review"
            text="Support structured academic review workflows."
            stat={stats.reviews}
          />

        </div>

      </section>

    </main>
  )
}


function Feature({ icon, title, text, stat }) {

  return (

    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

      <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-indigo-600">

        {icon}

      </div>


      <div className="flex items-center justify-between">
        <h2 className="font-semibold">
          {title}
        </h2>
        {stat !== undefined && (
          <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-bold text-indigo-600">
            {stat}
          </span>
        )}
      </div>


      <p className="mt-2 text-sm leading-6 text-slate-400">
        {text}
      </p>

    </div>

  )
}


export default About