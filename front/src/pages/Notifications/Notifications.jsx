import { useState, useEffect } from 'react';
import { Bell, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiGet, apiPut, asList } from '../../lib/api';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const { token } = useAuth();

  useEffect(() => {
    let cancelled = false;

    apiGet('/api/notifications', token)
      .then((result) => {
        if (!cancelled) setNotifications(asList(result));
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('Failed to fetch notifications:', err);
        setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  const markAsRead = async (id) => {
    try {
      await apiPut(`/api/notifications/${id}/read`, undefined, token);
      // Only update the UI once the server has confirmed the write.
      setNotifications((prev) =>
        prev.map((n) => (n.ID === id ? { ...n, IS_READ: 1 } : n)),
      );
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
      setError(err.message);
    }
  };

  return (
    <div className="mx-auto max-w-4xl p-8">
      <h1 className="mb-6 text-3xl font-bold flex items-center gap-3">
        <Bell size={28} className="text-primary"/> Notifications
      </h1>

      {error && (
        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-3">
        {notifications.map(notif => (
          <div key={notif.ID} className={`flex items-start justify-between rounded-xl border p-4 ${notif.IS_READ ? 'border-base-200 bg-base-50 opacity-70' : 'border-primary/20 bg-base-100 shadow-sm'}`}>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-primary">{notif.CATEGORY}</p>
              <p className="mt-1 text-sm text-slate-800">{notif.MESSAGE}</p>
            </div>
            {!notif.IS_READ && (
              <button onClick={() => markAsRead(notif.ID)} className="btn btn-ghost btn-sm text-success">
                <CheckCircle2 size={16}/> Mark Read
              </button>
            )}
          </div>
        ))}
        {isLoading && <p className="text-base-content/50">Loading notifications...</p>}
        {!isLoading && notifications.length === 0 && (
          <p className="text-base-content/50">No notifications.</p>
        )}
      </div>
    </div>
  );
}