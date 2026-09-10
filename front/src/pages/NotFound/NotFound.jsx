import { Link } from 'react-router-dom'
import { Compass } from 'lucide-react'

export default function NotFound() {
  return (
    <main className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center bg-slate-50 px-6 text-center">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
        <Compass size={32} />
      </div>

      <h1 className="text-4xl font-bold tracking-tight text-slate-900">404</h1>

      <p className="mt-3 max-w-md text-sm leading-6 text-slate-500">
        We couldn&apos;t find that page. It may have been moved, or the link
        might be out of date.
      </p>

      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <Link to="/" className="btn btn-primary">Back to home</Link>
        <Link to="/dashboard" className="btn btn-outline">Go to dashboard</Link>
      </div>
    </main>
  )
}
