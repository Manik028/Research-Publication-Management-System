import { useState, useEffect } from 'react';
import { Building2, Plus, Globe } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiGet, apiPost, asList } from '../../lib/api';

export default function Institutions() {
  const [institutions, setInstitutions] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', country: '', website: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const { token, role } = useAuth();

  useEffect(() => {
    let cancelled = false;

    apiGet('/api/institutions', token)
      .then((result) => {
        if (!cancelled) setInstitutions(asList(result));
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('Failed to fetch institutions:', err);
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
      const result = await apiPost(
        '/api/institutions',
        { NAME: formData.name, COUNTRY: formData.country, WEBSITE: formData.website },
        token,
      );

      // The backend returns the created row, so the list stays consistent
      // without a full refetch.
      if (result.data) setInstitutions((prev) => [...prev, result.data]);
      setFormData({ name: '', country: '', website: '' });
      setIsModalOpen(false);
    } catch (err) {
      console.error('Failed to create institution:', err);
      setError(err.message);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-3"><Building2 className="text-indigo-600"/> Institutions</h1>
        {(role === 'Admin' || role === 'Manager') && (
          <button onClick={() => setIsModalOpen(true)} className="btn btn-primary"><Plus size={18}/> Add Institution</button>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">
          {error}
        </div>
      )}

      {isLoading && <p className="text-slate-400">Loading institutions...</p>}

      {!isLoading && institutions.length === 0 && !error && (
        <p className="text-slate-400">No institutions have been added yet.</p>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {institutions.map(inst => (
          <div key={inst.ID} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="font-bold text-lg">{inst.NAME}</h3>
            <p className="mt-1 text-sm text-slate-500">Country: {inst.COUNTRY}</p>
            {inst.WEBSITE && (
              <a href={inst.WEBSITE} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-sm text-indigo-600 hover:underline">
                <Globe size={14}/> Visit Website
              </a>
            )}
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <form onSubmit={handleCreate} className="w-full max-w-md rounded-2xl bg-white p-6">
            <h2 className="mb-4 text-xl font-bold">Add Institution</h2>
            <input type="text" placeholder="Institution Name" required className="input input-bordered mb-3 w-full"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})} />
            <input type="text" placeholder="Country" required className="input input-bordered mb-3 w-full"
              value={formData.country}
              onChange={e => setFormData({...formData, country: e.target.value})} />
            <input type="url" placeholder="Website URL (Optional)" className="input input-bordered mb-5 w-full"
              value={formData.website}
              onChange={e => setFormData({...formData, website: e.target.value})} />
            <div className="flex justify-end gap-3">
              <button type="button" className="btn btn-ghost" onClick={() => setIsModalOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Save</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}