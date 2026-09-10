import { Navigate, useLocation } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

/**
 * Route-level role check. Mirrors the backend's authorizeRole middleware so the
 * UI does not offer pages the API would reject with a 403.
 */
export default function RoleGuard({ allowedRoles, children }) {
  const { role, token } = useAuth()
  const location = useLocation()

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-10 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
          <ShieldAlert size={28} />
        </div>
        <h1 className="text-3xl font-bold text-rose-600">403 Forbidden</h1>
        <p className="mt-3 max-w-md text-sm text-slate-500">
          Your current role ({role || 'None'}) does not have permission to view this page.
          This area is limited to: {allowedRoles.join(', ')}.
        </p>
      </div>
    )
  }

  return children
}
