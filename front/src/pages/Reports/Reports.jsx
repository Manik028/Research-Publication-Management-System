import { useState, useEffect } from 'react'
import { BarChart3, Users, FolderKanban, Building2, Layers, FileCheck2, BookOpen } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { apiGet } from '../../lib/api'

const TABS = [
  { key: 'researchers', label: 'Researchers', icon: Users, view: 'V_RESEARCHER_STATISTICS' },
  { key: 'projects', label: 'Project Funding', icon: FolderKanban, view: 'V_PROJECT_FUNDING' },
  { key: 'institutions', label: 'Institutions', icon: Building2, view: 'V_INSTITUTION_STATISTICS' },
  { key: 'research-areas', label: 'Research Areas', icon: Layers, view: 'V_RESEARCH_AREA_STATISTICS' },
  { key: 'reviewers', label: 'Reviewer Workload', icon: FileCheck2, view: 'V_REVIEW_STATISTICS' },
  { key: 'publications', label: 'Publications', icon: BookOpen, view: 'V_PUBLICATION_DETAILS' },
]

/** Turns "PUBLICATION_COUNT" into "Publication Count" for table headers. */
function prettifyKey(key) {
  return key.replace(/_/g, ' ').replace(/\w\S*/g, (w) => w.charAt(0) + w.slice(1).toLowerCase())
}

function formatCell(value) {
  if (value === null || value === undefined) return '—'
  if (typeof value === 'number') return value.toLocaleString()
  return String(value)
}

/**
 * Admin/Manager only. Every tab is ONE database view (see database/views.sql)
 * read straight through /api/reports — no calculation happens in this
 * component, it only renders whatever Oracle already computed.
 */
function Reports() {
  const { token } = useAuth()
  const [activeTab, setActiveTab] = useState(TABS[0].key)
  const [rows, setRows] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setIsLoading(true)
    setError('')
    apiGet(`/api/reports/${activeTab}`, token)
      .then((res) => setRows(res.data || []))
      .catch((err) => {
        console.error(`Failed to load report "${activeTab}":`, err)
        setError(err.message)
      })
      .finally(() => setIsLoading(false))
  }, [activeTab, token])

  const columns = rows.length > 0 ? Object.keys(rows[0]) : []
  const activeTabInfo = TABS.find((t) => t.key === activeTab)

  return (
    <div className="mx-auto max-w-7xl space-y-6">

      {/* HEADER */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
            <BarChart3 size={19} />
          </div>
          <span className="text-sm font-semibold text-indigo-600">Database-Driven Analytics</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Reports</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          Every tab below is a single Oracle view — the aggregation, joins and
          ranking all happen in the database, this page just displays the result.
        </p>
      </section>

      {/* TABS */}
      <section className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
        <div className="flex flex-wrap gap-1">
          {TABS.map((tab) => {
            const Icon = tab.icon
            const active = tab.key === activeTab
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                  active ? 'bg-indigo-600 text-white shadow' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Icon size={16} /> {tab.label}
              </button>
            )
          })}
        </div>
      </section>

      {/* TABLE */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-sm font-semibold text-slate-700">
            Source: <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-indigo-600">{activeTabInfo.view}</code>
          </h2>
          <span className="text-xs text-slate-400">{rows.length} rows</span>
        </div>

        {error && (
          <div className="m-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex min-h-[300px] items-center justify-center text-slate-500">Loading...</div>
        ) : rows.length === 0 ? (
          <div className="flex min-h-[300px] items-center justify-center text-slate-500">No data yet for this report.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  {columns.map((col) => (
                    <th key={col} className="whitespace-nowrap px-4 py-3">{prettifyKey(col)}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row, i) => (
                  <tr key={i}>
                    {columns.map((col) => (
                      <td key={col} className="max-w-xs truncate whitespace-nowrap px-4 py-3 text-slate-700" title={formatCell(row[col])}>
                        {formatCell(row[col])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

    </div>
  )
}

export default Reports
