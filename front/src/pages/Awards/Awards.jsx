import { useState, useEffect } from 'react';
import { Award, Plus, Building2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiGet, apiPost, asList } from '../../lib/api';

export default function Awards() {
  const [awards, setAwards] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', category: '', organization: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const { token } = useAuth();

  useEffect(() => {
    let cancelled = false;

    apiGet('/api/awards', token)
      .then((result) => {
        if (!cancelled) setAwards(asList(result));
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('Failed to fetch awards:', err);
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
      // USER_ID is taken from the JWT on the server, never sent from here.
      const result = await apiPost(
        '/api/awards',
        {
          AWARD_NAME: formData.name,
          CATEGORY: formData.category,
          AWARDING_ORGANIZATION: formData.organization,
        },
        token,
      );

      if (result.data) setAwards((prev) => [result.data, ...prev]);
      setFormData({ name: '', category: '', organization: '' });
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error creating award:', err);
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
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 shadow-inner">
              <Award size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="badge badge-warning badge-outline text-xs font-semibold">Recognitions</span>
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 mt-1">
                Awards & Recognitions
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Track academic honors, research milestones, and institutional achievements.
              </p>
            </div>
          </div>

          <button 
            onClick={() => setIsModalOpen(true)} 
            className="btn btn-warning text-white gap-2 shadow-sm"
          >
            <Plus size={18} /> Log Award
          </button>
        </div>
      </section>

      {/* =====================================================
          AWARDS GRID SECTION
      ====================================================== */}
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">
          {error}
        </div>
      )}

      <section>
        {isLoading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-16 text-center text-slate-400">
            Loading awards data...
          </div>
        ) : awards.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-16 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 mb-4">
              <Award size={30} />
            </div>
            <h3 className="text-lg font-bold text-slate-800">No awards logged yet</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
              Start building your academic portfolio by logging your received awards.
            </p>
            <button 
              onClick={() => setIsModalOpen(true)} 
              className="btn btn-warning text-white btn-sm mt-5 gap-2"
            >
              <Plus size={16} /> Log Award
            </button>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {awards.map(award => (
              <div key={award.ID} className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                      <Award size={20} />
                    </div>
                    <span className="badge badge-warning badge-soft font-semibold text-xs uppercase">
                      {award.CATEGORY}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900">{award.AWARD_NAME}</h3>
                  
                  <div className="mt-4 pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                    <p className="flex items-center gap-2 font-medium">
                      <Building2 size={14} className="text-slate-400" /> Issued by: {award.AWARDING_ORGANIZATION}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* =====================================================
          MODAL FOR LOGGING AWARD
      ====================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <form onSubmit={handleCreate} className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4">
            <h2 className="text-xl font-bold text-slate-900">Log New Award</h2>
            <p className="text-xs text-slate-500">Enter the recognition and issuing organization details.</p>

            <div>
              <label className="label text-sm font-semibold text-slate-700">Award Name</label>
              <input 
                type="text" 
                placeholder="e.g. Best Paper Award" 
                required 
                className="input input-bordered w-full"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})} 
              />
            </div>

            <div>
              <label className="label text-sm font-semibold text-slate-700">Category</label>
              <input 
                type="text" 
                placeholder="e.g., Research, Teaching, Innovation" 
                required 
                className="input input-bordered w-full"
                value={formData.category}
                onChange={e => setFormData({...formData, category: e.target.value})} 
              />
            </div>

            <div>
              <label className="label text-sm font-semibold text-slate-700">Awarding Organization</label>
              <input 
                type="text" 
                placeholder="e.g. IEEE, ACM" 
                required 
                className="input input-bordered w-full"
                value={formData.organization}
                onChange={e => setFormData({...formData, organization: e.target.value})} 
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button type="button" className="btn btn-ghost" onClick={() => setIsModalOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-warning text-white">Save Award</button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}