import { useState, useEffect } from 'react'
import {
  FileCheck2,
  Search,
  SlidersHorizontal,
  Clock3,
  CheckCircle2,
  AlertCircle,
  Send,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { apiGet, apiPut, asList } from '../../lib/api'


function PeerReview() {
  const [reviews, setReviews] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  // Modal / Grading Form states matching the ERD 'REVIEW' table
  const [selectedReview, setSelectedReview] = useState(null)
  const [score, setScore] = useState('')
  const [originality, setOriginality] = useState('')
  const [recommendation, setRecommendation] = useState('Accept')
  const [authorComments, setAuthorComments] = useState('')
  const [editorComments, setEditorComments] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [formError, setFormError] = useState('')

  const { token } = useAuth()

  // Captured once so the "needs attention" calculation stays pure across
  // renders instead of reading the clock on every pass.
  const [now] = useState(() => Date.now())

  // Fetch reviews from your Node.js backend on load
  useEffect(() => {
    let cancelled = false

    apiGet('/api/reviews', token)
      .then((result) => {
        if (!cancelled) setReviews(asList(result))
      })
      .catch((err) => {
        if (cancelled) return
        console.error('Failed to fetch reviews:', err)
        setError(err.message)
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [token])

  // Handle submitting review assessment to backend PUT endpoint
  const handleGradeSubmit = async (e) => {
    e.preventDefault()
    if (!selectedReview) return

    setFormError('')
    setIsSubmitting(true)

    try {
      const result = await apiPut(
        `/api/reviews/${selectedReview.ID}/submit`,
        {
          score: Number(score),
          originality: Number(originality),
          recommendation,
          authorComments,
          editorComments,
        },
        token,
      )

      const updated = result.data
      setReviews((prev) =>
        prev.map((r) =>
          r.ID === selectedReview.ID ? { ...r, ...(updated || {}), STATUS: 'Completed' } : r,
        ),
      )

      setSelectedReview(null)
      setScore('')
      setOriginality('')
      setRecommendation('Accept')
      setAuthorComments('')
      setEditorComments('')
    } catch (err) {
      console.error('Error submitting review:', err)
      setFormError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Calculate dynamic stats based on fetched data
  const pendingCount = reviews.filter(r => r.STATUS?.toLowerCase() === 'pending').length
  const completedCount = reviews.filter(r => r.STATUS?.toLowerCase() === 'completed').length
  const assignedCount = reviews.length
  // Pending assignments due within the next 7 days (or already overdue).
  const attentionCount = reviews.filter((r) => {
    if (r.STATUS?.toLowerCase() === 'completed' || !r.DEADLINE) return false
    const daysLeft = (new Date(r.DEADLINE).getTime() - now) / (1000 * 60 * 60 * 24)
    return daysLeft <= 7
  }).length

  // Filter reviews based on live search input
  const filteredReviews = reviews.filter((rev) => {
    const query = searchQuery.toLowerCase()
    return (
      rev.PUBLICATION_TITLE?.toLowerCase().includes(query) ||
      rev.REVIEWER_NAME?.toLowerCase().includes(query) ||
      rev.OVERALL_RECOMMENDATION?.toLowerCase().includes(query) ||
      rev.STATUS?.toLowerCase().includes(query)
    )
  })

  return (
    <div className="space-y-6">

      {/* =====================================================
          PAGE HEADER
      ====================================================== */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <FileCheck2 size={19} />
              </div>
              <p className="text-sm font-semibold text-indigo-600">
                Academic Review
              </p>
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Peer Review
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
              Manage publication reviews, assigned manuscripts, and
              your peer-review activities.
            </p>
          </div>
        </div>
      </section>

      {/* =====================================================
          REVIEW STATISTICS
      ====================================================== */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Pending */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Clock3 size={21} />
            </div>
            <span className="text-2xl font-bold text-slate-900">
              {pendingCount}
            </span>
          </div>
          <h3 className="mt-5 text-sm font-semibold text-slate-700">
            Pending Reviews
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Reviews waiting for your response
          </p>
        </div>

        {/* Completed */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 size={21} />
            </div>
            <span className="text-2xl font-bold text-slate-900">
              {completedCount}
            </span>
          </div>
          <h3 className="mt-5 text-sm font-semibold text-slate-700">
            Completed Reviews
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Reviews you have completed
          </p>
        </div>

        {/* Assigned */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <FileCheck2 size={21} />
            </div>
            <span className="text-2xl font-bold text-slate-900">
              {assignedCount}
            </span>
          </div>
          <h3 className="mt-5 text-sm font-semibold text-slate-700">
            Assigned Reviews
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Reviews currently assigned to you
          </p>
        </div>

        {/* Attention */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
              <AlertCircle size={21} />
            </div>
            <span className="text-2xl font-bold text-slate-900">
              {attentionCount}
            </span>
          </div>
          <h3 className="mt-5 text-sm font-semibold text-slate-700">
            Needs Attention
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Reviews approaching their deadline
          </p>
        </div>
      </div>

      {/* =====================================================
          SEARCH AND FILTER
      ====================================================== */}
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
              placeholder="Search reviews by publication title or researcher..."
              className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
            />
          </div>

          <button
            type="button"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
          >
            <SlidersHorizontal size={18} />
            Filters
          </button>
        </div>
      </section>

      {/* =====================================================
          REVIEW LIST
      ====================================================== */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Review Assignments
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Publications currently assigned for peer review.
              </p>
            </div>

            <span className="inline-flex w-fit items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
              {filteredReviews.length} assignments
            </span>
          </div>
        </div>

        {/* Conditional States: Loading, Empty, or Populated List */}
        {error && (
          <div className="mx-6 mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex min-h-[380px] items-center justify-center px-6 py-12 text-slate-500">
            Loading review assignments...
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="flex min-h-[380px] flex-col items-center justify-center px-6 py-12 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-500">
              <FileCheck2 size={36} strokeWidth={1.8} />
            </div>

            <h3 className="mt-6 text-xl font-bold text-slate-900">
              No review assignments
            </h3>

            <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
              You currently have no publications assigned for peer
              review. New review assignments will appear here when
              they become available.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 px-6 py-4">
            {filteredReviews.map((rev) => (
              <div key={rev.ID} className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">{rev.PUBLICATION_TITLE}</h3>
                  <p className="mt-1 text-xs text-slate-500">Deadline: {rev.DEADLINE ? new Date(rev.DEADLINE).toLocaleDateString() : 'N/A'}</p>
                  <span className={`mt-2 inline-block rounded-md px-2 py-1 text-xs font-medium ${rev.STATUS === 'Completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                    Status: {rev.STATUS || 'Pending'}
                  </span>
                </div>

                {rev.STATUS !== 'Completed' && (
                  <button 
                    onClick={() => setSelectedReview(rev)}
                    className="btn btn-sm btn-primary self-start sm:self-auto"
                  >
                    Submit Assessment
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* =====================================================
          MODAL FOR SUBMITTING REVIEW ASSESSMENT
      ====================================================== */}
      {selectedReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form onSubmit={handleGradeSubmit} className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-slate-900">Submit Assessment</h2>
            <p className="text-sm text-slate-500">Reviewing: {selectedReview.PUBLICATION_TITLE}</p>

            {formError && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">
                {formError}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label text-sm font-semibold text-slate-700">Score (1-10)</label>
                <input 
                  type="number"
                  min="1"
                  max="10"
                  step="0.01"
                  required 
                  value={score}
                  onChange={e => setScore(e.target.value)}
                  className="input input-bordered w-full" 
                />
              </div>
              <div>
                <label className="label text-sm font-semibold text-slate-700">Originality (%)</label>
                <input 
                  type="number" 
                  min="0" 
                  max="100" 
                  required 
                  value={originality}
                  onChange={e => setOriginality(e.target.value)}
                  className="input input-bordered w-full" 
                />
              </div>
            </div>

            <div>
              <label className="label text-sm font-semibold text-slate-700">Overall Recommendation</label>
              <select 
                value={recommendation}
                onChange={e => setRecommendation(e.target.value)}
                className="select select-bordered w-full"
              >
                <option value="Accept">Accept</option>
                <option value="Minor Revision">Minor Revision</option>
                <option value="Major Revision">Major Revision</option>
                <option value="Reject">Reject</option>
              </select>
            </div>

            <div>
              <label className="label text-sm font-semibold text-slate-700">Comments for Author</label>
              <textarea 
                rows="3" 
                required 
                value={authorComments}
                onChange={e => setAuthorComments(e.target.value)}
                className="textarea textarea-bordered w-full" 
                placeholder="Provide constructive feedback..."
              ></textarea>
            </div>

            <div>
              <label className="label text-sm font-semibold text-slate-700">Comments for Editor (Hidden from Author)</label>
              <textarea 
                rows="2" 
                value={editorComments}
                onChange={e => setEditorComments(e.target.value)}
                className="textarea textarea-bordered w-full" 
                placeholder="Confidential remarks for the editor..."
              ></textarea>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button type="button" className="btn btn-ghost" onClick={() => setSelectedReview(null)}>Cancel</button>
              <button type="submit" disabled={isSubmitting} className="btn btn-primary gap-2">
                <Send size={16}/> {isSubmitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  )
}

export default PeerReview