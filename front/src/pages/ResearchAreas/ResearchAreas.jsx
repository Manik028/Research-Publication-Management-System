import { useState, useEffect } from 'react';
import { BookOpen, Plus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiGet, apiPost, asList } from '../../lib/api';

export default function ResearchAreas() {
  const [areas, setAreas] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const { token, role } = useAuth();

  useEffect(() => {
    let cancelled = false;

    apiGet('/api/research-areas', token)
      .then((result) => {
        if (!cancelled) setAreas(asList(result));
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('Failed to fetch research areas:', err);
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
        '/api/research-areas',
        { AREA_NAME: formData.name, DESCRIPTION: formData.description },
        token,
      );

      if (result.data) setAreas((prev) => [...prev, result.data]);
      setFormData({ name: '', description: '' });
      setIsModalOpen(false);
    } catch (err) {
      console.error('Failed to create research area:', err);
      setError(err.message);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-3"><BookOpen className="text-secondary"/> Research Areas</h1>
        {(role === 'Admin' || role === 'Manager') && (
          <button onClick={() => setIsModalOpen(true)} className="btn btn-secondary text-white"><Plus size={18}/> Add Area</button>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">
          {error}
        </div>
      )}

      {isLoading && <p className="text-base-content/50">Loading research areas...</p>}

      {!isLoading && areas.length === 0 && !error && (
        <p className="text-base-content/50">No research areas have been added yet.</p>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {areas.map(area => (
          <div key={area.ID} className="rounded-xl border border-base-300 bg-base-100 p-5 shadow-sm">
            <h3 className="font-bold text-lg text-secondary">{area.AREA_NAME}</h3>
            <p className="mt-2 text-sm text-base-content/70">{area.DESCRIPTION}</p>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <form onSubmit={handleCreate} className="w-full max-w-md rounded-2xl bg-base-100 p-6">
            <h2 className="mb-4 text-xl font-bold">Add Research Area</h2>
            <input type="text" placeholder="Area Name (e.g., Quantum Physics)" required className="input input-bordered mb-3 w-full"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})} />
            <textarea placeholder="Description" required className="textarea textarea-bordered mb-5 w-full" rows="3"
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}></textarea>
            <div className="flex justify-end gap-3">
              <button type="button" className="btn btn-ghost" onClick={() => setIsModalOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-secondary text-white">Save</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}