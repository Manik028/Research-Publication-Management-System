import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from 'react-router-dom'

import Navbar from './components/navbar/Navbar'

import Home from './pages/Home/Home'
import Publications from './pages/Publications/Publications'
import PublicationDetail from './pages/PublicationDetail/PublicationDetail'
import Conferences from './pages/Conferences/Conferences'
import Journals from './pages/Journals/Journals'
import About from './pages/About/About'
import Login from './pages/Login/Login'
import Register from './pages/Register/Register'
import NotFound from './pages/NotFound/NotFound'

import DashboardLayout from './layouts/DashboardLayout'
import Dashboard from './pages/Dashboard/Dashboard'
import DashboardPublications from './pages/DashboardPublications/DashboardPublications'
import Projects from './pages/Projects/Projects'
import Researchers from './pages/Researchers/Researchers'
import PeerReview from './pages/PeerReview/PeerReview'
import Profile from './pages/Profile/Profile'
import Settings from './pages/Settings/Settings'
import Grants from './pages/Grants/Grants'
import Awards from './pages/Awards/Awards'
import Notifications from './pages/Notifications/Notifications'
import Institutions from './pages/Institutions/Institution'
import ResearchAreas from './pages/ResearchAreas/ResearchAreas'
import ModerationQueue from './pages/Moderation/ModerationQueue'
import AuditLog from './pages/AuditLog/AuditLog'
import Reports from './pages/Reports/Reports'

import ProtectedRoute from './components/auth/ProtectedRoute'
import RoleGuard from './components/auth/RoleGuard'
import { AuthProvider } from './context/AuthContext'

/**
 * The public marketing navbar is hidden inside the dashboard, which has its own
 * sidebar navigation. Previously both rendered at once and the fixed navbar
 * overlapped the dashboard content.
 */
function PublicNavbar() {
  const { pathname } = useLocation()
  if (pathname.startsWith('/dashboard')) return null
  return <Navbar />
}

/** Small helper so every dashboard route isn't three levels of nesting. */
function DashboardPage({ children, roles }) {
  const content = roles ? <RoleGuard allowedRoles={roles}>{children}</RoleGuard> : children

  return (
    <ProtectedRoute>
      <DashboardLayout>{content}</DashboardLayout>
    </ProtectedRoute>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <PublicNavbar />

        <Routes>
          {/* ===================================================
              PUBLIC PAGES
          =================================================== */}
          <Route path="/" element={<Home />} />
          <Route path="/publications" element={<Publications />} />
          <Route path="/publications/:id" element={<PublicationDetail />} />
          <Route path="/conferences" element={<Conferences />} />
          <Route path="/journals" element={<Journals />} />
          <Route path="/about" element={<About />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* ===================================================
              DASHBOARD
          =================================================== */}
          <Route path="/dashboard" element={<DashboardPage><Dashboard /></DashboardPage>} />
          <Route path="/dashboard/publications" element={<DashboardPage><DashboardPublications /></DashboardPage>} />
          <Route path="/dashboard/projects" element={<DashboardPage><Projects /></DashboardPage>} />
          <Route path="/dashboard/researchers" element={<DashboardPage><Researchers /></DashboardPage>} />
          <Route path="/dashboard/reviews" element={<DashboardPage><PeerReview /></DashboardPage>} />
          <Route path="/dashboard/institutions" element={<DashboardPage><Institutions /></DashboardPage>} />
          <Route path="/dashboard/research-areas" element={<DashboardPage><ResearchAreas /></DashboardPage>} />
          <Route path="/dashboard/awards" element={<DashboardPage><Awards /></DashboardPage>} />
          <Route path="/dashboard/notifications" element={<DashboardPage><Notifications /></DashboardPage>} />
          <Route path="/dashboard/profile" element={<DashboardPage><Profile /></DashboardPage>} />
          <Route path="/dashboard/settings" element={<DashboardPage><Settings /></DashboardPage>} />

          {/* ===================================================
              DASHBOARD - ROLE RESTRICTED
              These mirror the backend's authorizeRole middleware.
          =================================================== */}
          <Route
            path="/dashboard/grants"
            element={
              <DashboardPage roles={['Admin', 'Manager']}>
                <Grants />
              </DashboardPage>
            }
          />
          <Route
            path="/dashboard/moderation"
            element={
              <DashboardPage roles={['Admin']}>
                <ModerationQueue />
              </DashboardPage>
            }
          />
          <Route
            path="/dashboard/audit-log"
            element={
              <DashboardPage roles={['Admin']}>
                <AuditLog />
              </DashboardPage>
            }
          />
          <Route
            path="/dashboard/reports"
            element={
              <DashboardPage roles={['Admin', 'Manager']}>
                <Reports />
              </DashboardPage>
            }
          />

          {/* ===================================================
              LEGACY / CONVENIENCE REDIRECTS
              The Dashboard quick actions used to link to these
              top-level paths, which had no route and rendered blank.
          =================================================== */}
          <Route path="/projects" element={<Navigate to="/dashboard/projects" replace />} />
          <Route path="/peer-review" element={<Navigate to="/dashboard/reviews" replace />} />
          <Route path="/grants" element={<Navigate to="/dashboard/grants" replace />} />
          <Route path="/researchers" element={<Navigate to="/dashboard/researchers" replace />} />
          <Route path="/profile" element={<Navigate to="/dashboard/profile" replace />} />
          <Route path="/settings" element={<Navigate to="/dashboard/settings" replace />} />

          {/* ===================================================
              404
          =================================================== */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App