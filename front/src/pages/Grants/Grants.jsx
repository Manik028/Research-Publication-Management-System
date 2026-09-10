import { useState, useEffect } from 'react';
import { DollarSign, Plus, Building, FolderGit2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiGet, apiPost, asList } from '../../lib/api';

export default function Grants() {
  const [grants, setGrants] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ amount: '', fundingBody: '', projectId: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const { token } = useAuth();

  useEffect(() => {
    let cancelled = false;

    apiGet('/api/grants', token)
      .then((result) => {
        if (!cancelled) setGrants(asList(result));
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('Failed to fetch grants:', err);
        setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');

    try {
      // The backend resolves (or creates) the FUNDING_BODY row from this name
      // and returns the fully joined grant row.
      const result = await apiPost(
        '/api/grants',
        {
          amount: Number(formData.amount),
          fundingBody: formData.fundingBody,
          projectId: Number(formData.projectId),
        },
        token,
      );

      if (result.data) setGrants((prev) => [result.data, ...prev]);
      setFormData({ amount: '', fundingBody: '', projectId: '' });
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error creating grant:', err);
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
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 shadow-inner">
              <DollarSign size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="badge badge-success badge-outline text-xs font-semibold">Financials</span>
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 mt-1">
                Funding & Grants
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Manage project funding bodies, financial awards, and research budgets.
              </p>
            </div>
          </div>

          <button 
            onClick={() => setIsModalOpen(true)} 
            className="btn btn-success text-white gap-2 shadow-sm"
          >
            <Plus size={18} /> Add Grant
          </button>
        </div>
      </section>

      {/* =====================================================
          GRANTS GRID SECTION
      ====================================================== */}
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">
          {error}
        </div>
      )}

      <section>
        {isLoading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-16 text-center text-slate-400">
            Loading grants data...
          </div>
        ) : grants.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-16 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 mb-4">
              <DollarSign size={30} />
            </div>
            <h3 className="text-lg font-bold text-slate-800">No grants logged yet</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
              Start tracking financial support by logging your first project grant.
            </p>
            <button 
              onClick={() => setIsModalOpen(true)} 
              className="btn btn-success text-white btn-sm mt-5 gap-2"
            >
              <Plus size={16} /> Log Grant
            </button>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {grants.map(grant => (
              <div key={grant.ID} className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                      <DollarSign size={20} />
                    </div>
                    <span className="badge badge-success badge-soft font-mono font-bold text-sm">
                      ${Number(grant.AMOUNT).toLocaleString()}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-slate-900">
                    {grant.PROJECT_TITLE || `Project #${grant.PROJECT_ID}`}
                  </h3>

                  <div className="mt-4 space-y-2 text-xs text-slate-600">
                    <p className="flex items-center gap-2 font-medium">
                      <Building size={14} className="text-slate-400" /> Source: {grant.FUNDING_BODY}
                    </p>
                    <p className="flex items-center gap-2 font-medium">
                      <FolderGit2 size={14} className="text-slate-400" /> Project ID: #{grant.PROJECT_ID}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* =====================================================
          MODAL FOR LOGGING GRANT
      ====================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <form onSubmit={handleCreate} className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4">
            <h2 className="text-xl font-bold text-slate-900">Log New Grant</h2>
            <p className="text-xs text-slate-500">Provide the financial allocation details for the research project.</p>

            <div>
              <label className="label text-sm font-semibold text-slate-700">Amount ($)</label>
              <input 
                type="number" 
                placeholder="e.g. 50000" 
                required 
                className="input input-bordered w-full"
                value={formData.amount}
                onChange={e => setFormData({...formData, amount: e.target.value})} 
              />
            </div>

            <div>
              <label className="label text-sm font-semibold text-slate-700">Funding Body</label>
              <input 
                type="text" 
                placeholder="e.g., NSF, NIH" 
                required 
                className="input input-bordered w-full"
                value={formData.fundingBody}
                onChange={e => setFormData({...formData, fundingBody: e.target.value})} 
              />
            </div>

            <div>
              <label className="label text-sm font-semibold text-slate-700">Project ID</label>
              <input 
                type="number" 
                placeholder="e.g. 1" 
                required 
                className="input input-bordered w-full"
                value={formData.projectId}
                onChange={e => setFormData({...formData, projectId: e.target.value})} 
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button type="button" className="btn btn-ghost" onClick={() => setIsModalOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-success text-white">Save Grant</button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}