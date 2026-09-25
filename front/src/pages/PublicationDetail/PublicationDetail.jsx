import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  Eye,
  Download,
  FileText,
  Users,
  Layers,
  Star,
  ExternalLink,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { apiGet } from '../../lib/api'

const STATUS_STYLES = {
  Draft: 'bg-slate-100 text-slate-600',
  Submitted: 'bg-blue-50 text-blue-600',
  'Under Review': 'bg-amber-50 text-amber-600',
  'Revision Required': 'bg-orange-50 text-orange-600',
  Resubmitted: 'bg-blue-50 text-blue-600',
  Accepted: 'bg-emerald-50 text-emerald-600',
  Rejected: 'bg-rose-50 text-rose-600',
  Published: 'bg-indigo-50 text-indigo-600',
  Archived: 'bg-slate-100 text-slate-500',
}

/**
 * Public page (readable without login, like Publications.jsx) — but shows
 * review status/scores only when the backend actually includes REVIEWS in
 * the response, which it only does for an author of the paper or an
 * Admin/Manager (see pubController.getPublication).
 */
function PublicationDetail() {
  const { id } = useParams()
  const { token } = useAuth()

  const [pub, setPub] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setIsLoading(true)
    setError('')
    apiGet(`/api/publications/${id}`, token)
      .then((res) => setPub(res.data))
      .catch((err) => {
        console.error('Failed to load publication:', err)
        setError(err.message)
      })
      .finally(() => setIsLoading(false))
  }, [id, token])

  if (isLoading) {
    return (
      <main className="min-h-[calc(100vh-4rem)] bg-slate-50">
        <div className="mx-auto max-w-4xl px-5 py-16 text-center text-slate-500">Loading publication...</div>
      </main>
    )
  }

  if (error || !pub) {
    return (
      <main className="min-h-[calc(100vh-4rem)] bg-slate-50">
        <div className="mx-auto max-w-4xl px-5 py-16 text-center">
          <p className="text-sm font-medium text-rose-600">{error || 'Publication not found.'}</p>
          <Link to="/publications" className="btn btn-ghost btn-sm mt-4 gap-1">
            <ArrowLeft size={16} /> Back to Publications
          </Link>
        </div>
      </main>
    )
  }

  const statusClass = STATUS_STYLES[pub.CONFIRMATION_STATUS] || STATUS_STYLES.Draft
  const scoredReviews = (pub.REVIEWS || []).filter((r) => r.SCORE !== null && r.SCORE !== undefined)
  const avgScore = scoredReviews.length
    ? (scoredReviews.reduce((sum, r) => sum + Number(r.SCORE), 0) / scoredReviews.length).toFixed(1)
    : null

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-slate-50">
      <div className="mx-auto max-w-4xl space-y-6 px-5 py-10 lg:px-8">

        <Link to="/publications" className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-700">
          <ArrowLeft size={16} /> Back to Publications
        </Link>

        {/* HEADER CARD */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass}`}>
              {pub.CONFIRMATION_STATUS}
            </span>
            {pub.VENUE_NAME && (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                {pub.VENUE_NAME}
              </span>
            )}
          </div>

          <h1 className="mt-4 text-2xl font-bold leading-snug text-slate-900 sm:text-3xl">{pub.TITLE}</h1>

          {pub.ABSTRACT && (
            <p className="mt-4 text-sm leading-7 text-slate-600">{pub.ABSTRACT}</p>
          )}

          <div className="mt-6 flex flex-wrap gap-6 border-t border-slate-100 pt-5 text-sm text-slate-500">
            <span className="flex items-center gap-1.5">
              <Calendar size={15} />
              {pub.SUBMISSION_DATE ? new Date(pub.SUBMISSION_DATE).toLocaleDateString() : 'No date'}
            </span>
            <span className="flex items-center gap-1.5"><Eye size={15} /> {pub.TOTAL_VIEWS ?? 0} views</span>
            <span className="flex items-center gap-1.5"><Download size={15} /> {pub.TOTAL_DOWNLOADS ?? 0} downloads</span>
            {pub.DOI && (
              <a
                href={`https://doi.org/${pub.DOI}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-indigo-600 hover:text-indigo-700"
              >
                <ExternalLink size={15} /> DOI: {pub.DOI}
              </a>
            )}
          </div>
        </section>

        {/* AUTHORS */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Users size={16} /> Authors
          </h2>
          <div className="space-y-2">
            {pub.AUTHORS.map((a) => (
              <div key={a.USER_ID} className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-2.5">
                <span className="text-sm font-medium text-slate-900">
                  {a.AUTHOR_ORDER ? `${a.AUTHOR_ORDER}. ` : ''}{a.FULL_NAME}
                </span>
                <div className="flex gap-2">
                  {Number(a.IS_CORRESPONDING) === 1 && (
                    <span className="badge badge-sm badge-primary">Corresponding</span>
                  )}
                  <span className="badge badge-sm badge-ghost">{a.AUTHOR_ROLE}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* RESEARCH AREAS */}
        {pub.RESEARCH_AREAS.length > 0 && (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Layers size={16} /> Research Areas
            </h2>
            <div className="flex flex-wrap gap-2">
              {pub.RESEARCH_AREAS.map((ra) => (
                <span key={ra.AREA_ID} className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-600">
                  {ra.AREA_NAME}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* FILES */}
        {pub.FILES.length > 0 && (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
              <FileText size={16} /> Files
            </h2>
            <div className="space-y-2">
              {pub.FILES.map((f) => (
                <div key={f.FILE_ID} className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-2.5 text-sm">
                  <span className="font-medium text-slate-900">{f.FILE_NAME}</span>
                  <span className="text-xs text-slate-400">
                    {f.FILE_TYPE} · {f.FILE_SIZE ? `${(f.FILE_SIZE / 1024).toFixed(0)} KB` : 'unknown size'}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* REVIEWS - only present for authors/Admin/Manager (backend-gated) */}
        {pub.REVIEWS && (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <Star size={16} /> Peer Review Status
              </h2>
              {avgScore && (
                <span className="text-sm font-semibold text-indigo-600">Avg score: {avgScore}/10</span>
              )}
            </div>
            {pub.REVIEWS.length === 0 ? (
              <p className="text-sm text-slate-400">No reviewers assigned yet.</p>
            ) : (
              <div className="space-y-2">
                {pub.REVIEWS.map((r) => (
                  <div key={r.REVIEW_ID} className="rounded-xl border border-slate-100 px-4 py-2.5 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-slate-900">{r.REVIEWER_NAME}</span>
                      <span className="badge badge-sm badge-ghost">{r.STATUS}</span>
                    </div>
                    {r.SCORE !== null && r.SCORE !== undefined && (
                      <p className="mt-1 text-xs text-slate-500">
                        Score: {r.SCORE}/10 · Originality: {r.ORIGINALITY}% · {r.OVERALL_RECOMMENDATION}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

      </div>
    </main>
  )
}

export default PublicationDetail
