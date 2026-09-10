import { createContext, useContext, useState, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

const AuthContext = createContext(null)

const TOKEN_KEY = 'rpmsToken'
const ROLE_KEY = 'rpmsRole'
const USER_KEY = 'rpmsUser'

/**
 * Session state is read synchronously in the useState initialiser rather than
 * in an effect. Loading it in an effect meant `token` was still null during the
 * first render, so ProtectedRoute bounced the user to /login on every page
 * refresh even when they had a valid session.
 */
function readStoredSession() {
  try {
    const token = localStorage.getItem(TOKEN_KEY)
    const rawUser = localStorage.getItem(USER_KEY)

    if (!token || !rawUser) return { token: null, user: null, role: null }

    return {
      token,
      user: JSON.parse(rawUser),
      role: localStorage.getItem(ROLE_KEY) || null,
    }
  } catch {
    // Corrupted storage should not brick the app.
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(ROLE_KEY)
    localStorage.removeItem(USER_KEY)
    return { token: null, user: null, role: null }
  }
}

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(readStoredSession)
  const navigate = useNavigate()

  const login = useCallback((userData, userRole, jwtToken) => {
    const role = userRole || userData?.ROLE || 'Researcher'

    localStorage.setItem(TOKEN_KEY, jwtToken)
    localStorage.setItem(ROLE_KEY, role)
    localStorage.setItem(USER_KEY, JSON.stringify(userData))

    setSession({ token: jwtToken, role, user: userData })
    navigate('/dashboard')
  }, [navigate])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(ROLE_KEY)
    localStorage.removeItem(USER_KEY)

    setSession({ token: null, role: null, user: null })
    navigate('/login')
  }, [navigate])

  /** Keeps the cached user in sync after a profile/settings save. */
  const updateUser = useCallback((partial) => {
    setSession((prev) => {
      if (!prev.user) return prev
      const user = { ...prev.user, ...partial }
      localStorage.setItem(USER_KEY, JSON.stringify(user))
      return { ...prev, user }
    })
  }, [])

  const value = useMemo(
    () => ({
      user: session.user,
      role: session.role,
      token: session.token,
      isAuthenticated: Boolean(session.token),
      login,
      logout,
      updateUser,
    }),
    [session, login, logout, updateUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// The provider and its hook deliberately live together; splitting them would
// churn every import for no functional gain.
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used inside an <AuthProvider>')
  }
  return context
}
