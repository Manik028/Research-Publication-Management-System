import { useState, useEffect, useCallback } from 'react'
import { History, Filter, ChevronLeft, ChevronRight, Plus, Pencil, Trash2 } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { apiGet } from '../../lib/api'

const ACTION_STYLES = {
  INSERT: { icon: Plus, className: 'bg-emerald-50 text-emerald-600' },
  UPDATE: { icon: Pencil, className: 'bg-amber-50 text-amber-600' },
  DELETE: { icon: Trash2, className: 'bg-rose-50 text-rose-600' },
}

/**
 * Admin-only. Reads AUDIT_LOG (database/audit_log.sql) — every row here
 * was written automatically by a trigger, this page never writes
 * anything, it's a pure viewer.
 */
function AuditLog() {
  const { token } = useAuth()

  const [rows, setRows] = useState([])
  const [tables, setTables] = useState([])
  const [tableFilter, setTableFilter] = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const pageSize = 25
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  useEffect(() => {
    apiGet('/api/audit-log/tables', token)
      .then((res) => setTables(res.data || []))
      .catch((err) => console.error('Failed to load audit log tables:', err))
  }, [token])

  const loadPage = useCallback(() => {
    setIsLoading(true)
    setError('')

    const params = new URLSearchParams({ page: String(page) })
    if (tableFilter) params.set('table', tableFilter)
    if (actionFilter) params.set('action', actionFilter)

    apiGet(`/api/audit-log?${params.toString()}`, token)
      .then((res) => {
        setRows(res.data.rows)
        setTotal(res.data.total)
      })
      .catch((err) => {
        console.error('Failed to load audit log:', err)
        setError(err.message)
      })
      .finally(() => setIsLoading(false))
  }, [token, page, tableFilter, actionFilter])

  useEffect(() => {
    loadPage()
  }, [loadPage])

  const handleFilterChange = (setter) => (e) => {
    setter(e.target.value)
    setPage(1)
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">

      {/* HEADER */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
            <History size={19} />
          </div>
          <span className="text-sm font-semibold text-indigo-600">System Security</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Audit Log</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          Every INSERT, UPDATE and DELETE on PUBLICATION, USER, REVIEW, PROJECT and
          GRANT_FUNDING, captured automatically by database triggers. Passwords are
          never recorded here, even when a USER row changes.
        </p>
      </section>

      {/* FILTERS */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <Filter size={16} className="text-slate-400" />

          <select
            value={tableFilter}
            onChange={handleFilterChange(setTableFilter)}
            className="select select-bordered select-sm"
          >
            <option value="">All tables</option>
            {tables.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          <select
            value={actionFilter}
            onChange={handleFilterChange(setActionFilter)}
            className="select select-bordered select-sm"
          >
            <option value="">All actions</option>
            <option value="INSERT">INSERT</option>
            <option value="UPDATE">UPDATE</option>
            <option value="DELETE">DELETE</option>
          </select>

          <span className="ml-auto text-xs text-slate-400">{total} total entries</span>
        </div>
      </section>

      {/* TABLE */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {error && (
          <div className="m-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex min-h-[300px] items-center justify-center text-slate-500">Loading...</div>
        ) : rows.length === 0 ? (
          <div className="flex min-h-[300px] items-center justify-center text-slate-500">No audit entries match these filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">When</th>
                  <th className="px-4 py-3">Table</th>
                  <th className="px-4 py-3">Record</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Changed By</th>
                  <th className="px-4 py-3">Old Value</th>
                  <th className="px-4 py-3">New Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((r) => {
                  const style = ACTION_STYLES[r.ACTION_TYPE] || ACTION_STYLES.UPDATE
                  const Icon = style.icon
                  return (
                    <tr key={r.AUDIT_ID} className="align-top">
                      <td className="whitespace-nowrap px-4 py-3 text-slate-500">
                        {new Date(r.ACTION_TIMESTAMP).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-900">{r.TABLE_NAME}</td>
                      <td className="px-4 py-3 text-slate-500">#{r.RECORD_ID}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${style.className}`}>
                          <Icon size={12} /> {r.ACTION_TYPE}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500">{r.CHANGED_BY}</td>
                      <td className="max-w-xs truncate px-4 py-3 text-slate-500" title={r.OLD_VALUE}>{r.OLD_VALUE || '—'}</td>
                      <td className="max-w-xs truncate px-4 py-3 text-slate-500" title={r.NEW_VALUE}>{r.NEW_VALUE || '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* PAGINATION */}
        <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4">
          <span className="text-xs text-slate-400">Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="btn btn-ghost btn-sm gap-1 disabled:opacity-40"
            >
              <ChevronLeft size={16} /> Prev
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="btn btn-ghost btn-sm gap-1 disabled:opacity-40"
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </section>

    </div>
  )
}

export default AuditLog
