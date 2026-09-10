import { useState, useEffect } from 'react';
import { ShieldAlert, Check, X, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiGet, apiPut, asList } from '../../lib/api';

export default function ModerationQueue() {
  const [queue, setQueue] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const { token } = useAuth();

  useEffect(() => {
    let cancelled = false;

    apiGet('/api/moderation', token)
      .then((result) => {
        if (!cancelled) setQueue(asList(result));
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('Failed to fetch moderation queue:', err);
        setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleAction = async (id, action) => {
    setError('');

    try {
      await apiPut(
        `/api/moderation/${id}`,
        { ACTION_TAKEN: action, STATUS: 'Resolved' },
        token,
      );
      setQueue((prev) => prev.filter((item) => item.ID !== id));
    } catch (err) {
      console.error('Error updating moderation item:', err);
      setError(err.message);
    }
  };

  return (
    <div className="space-y-6 p-8 max-w-7xl mx-auto">
      
      {/* =====================================================
          PAGE HEADER
      ====================================================== */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 shadow-inner">
              <ShieldAlert size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="badge badge-error badge-outline text-xs font-semibold">Admin Restriction</span>
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 mt-1">
                Moderation Queue
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Review and resolve flagged items across the research platform.
              </p>
            </div>
          </div>

          <div className="inline-flex w-fit items-center rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-600">
            {queue.length} pending items
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">
          {error}
        </div>
      )}

      {/* =====================================================
          QUEUE TABLE SECTION
      ====================================================== */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead className="bg-slate-50 text-slate-700 uppercase text-xs tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-4 px-6">Item Type</th>
                <th className="py-4 px-6">Reference ID</th>
                <th className="py-4 px-6">Flag Reason</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-slate-400">
                    Loading moderation queue...
                  </td>
                </tr>
              ) : queue.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-500 mb-3">
                        <Check size={28} />
                      </div>
                      <h3 className="text-base font-bold text-slate-800">Queue is empty</h3>
                      <p className="text-xs text-slate-400 mt-1">No flagged items currently require review.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                queue.map(item => (
                  <tr key={item.ID} className="hover:bg-slate-50/60 transition">
                    <td className="py-4 px-6 font-semibold uppercase text-indigo-600">
                      {item.ITEM_TYPE}
                    </td>
                    <td className="py-4 px-6 font-mono text-slate-600">
                      #{item.REFERENCE_ID}
                    </td>
                    <td className="py-4 px-6 max-w-xs text-rose-600 font-medium">
                      <span className="flex items-center gap-1.5">
                        <AlertTriangle size={14} className="shrink-0" />
                        <span className="truncate">{item.FLAG_REASON}</span>
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="badge badge-warning badge-sm gap-1 font-semibold">{item.STATUS}</span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => handleAction(item.ID, 'Approved')} 
                          className="btn btn-success btn-xs btn-outline gap-1"
                        >
                          <Check size={13}/> Approve
                        </button>
                        <button 
                          onClick={() => handleAction(item.ID, 'Deleted')} 
                          className="btn btn-error btn-xs btn-outline gap-1"
                        >
                          <X size={13}/> Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

    </div>
  );
}