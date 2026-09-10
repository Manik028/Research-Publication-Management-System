import {
  LayoutDashboard,
  BookOpen,
  FolderKanban,
  Users,
  FileCheck2,
  UserCircle,
  Settings,
  LogOut,
  Menu,
  X,
  DollarSign,
  ShieldAlert,
  Building2,
  Award,
  Bell,
  Layers,
} from 'lucide-react'

import { NavLink } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'

function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { role, logout, user } = useAuth()


  // =====================================================
  // LOGOUT (Integrated with AuthContext)
  // =====================================================

  const handleLogout = () => {
    setMobileOpen(false)
    logout()
  }


  // =====================================================
  // NAVIGATION ITEMS (Role-Aware)
  // =====================================================

  const baseNavigationItems = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      name: 'Publications',
      path: '/dashboard/publications',
      icon: BookOpen,
    },
    {
      name: 'Projects',
      path: '/dashboard/projects',
      icon: FolderKanban,
    },
    {
      name: 'Peer Review',
      path: '/dashboard/reviews',
      icon: FileCheck2,
    },
    // These pages already existed in src/pages but had no navigation entry,
    // so they were unreachable from the running app.
    {
      name: 'Researchers',
      path: '/dashboard/researchers',
      icon: Users,
    },
    {
      name: 'Institutions',
      path: '/dashboard/institutions',
      icon: Building2,
    },
    {
      name: 'Research Areas',
      path: '/dashboard/research-areas',
      icon: Layers,
    },
    {
      name: 'Awards',
      path: '/dashboard/awards',
      icon: Award,
    },
    {
      name: 'Notifications',
      path: '/dashboard/notifications',
      icon: Bell,
    },
  ]

  const managementNavigationItems = []
  if (role === 'Admin' || role === 'Manager') {
    managementNavigationItems.push({
      name: 'Grants & Funding',
      path: '/dashboard/grants',
      icon: DollarSign,
    })
  }
  if (role === 'Admin') {
    managementNavigationItems.push({
      name: 'Moderation Queue',
      path: '/dashboard/moderation',
      icon: ShieldAlert,
      isError: true,
    })
  }


  return (
    <>
      {/* =========================================
          MOBILE MENU BUTTON
      ========================================= */}

      <button
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-4 z-40 flex h-10 w-10 items-center justify-center rounded-xl border border-base-300 bg-base-100 shadow-lg lg:hidden"
        aria-label="Open sidebar"
      >
        <Menu size={21} />
      </button>


      {/* =========================================
          MOBILE BACKDROP
      ========================================= */}

      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
        />
      )}


      {/* =========================================
          SIDEBAR
      ========================================= */}

      <aside
        className={`
          fixed
          left-0
          top-0
          z-50
          flex
          h-screen
          w-72
          flex-col
          border-r
          border-base-300
          bg-base-100
          transition-transform
          duration-300

          ${
            mobileOpen
              ? 'translate-x-0'
              : '-translate-x-full'
          }

          lg:translate-x-0
        `}
      >

        {/* =========================================
            SIDEBAR HEADER
        ========================================= */}

        <div className="flex h-20 items-center justify-between border-b border-base-300 px-5">

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-content shadow-lg shadow-primary/20">

              <BookOpen size={21} />

            </div>


            <div>

              <h1 className="text-lg font-bold tracking-tight">
                RPMS
              </h1>

              <p className="text-[10px] font-medium text-base-content/50">
                Research Management
              </p>

            </div>

          </div>


          {/* Mobile close button */}

          <button
            onClick={() => setMobileOpen(false)}
            className="btn btn-ghost btn-square lg:hidden"
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>

        </div>


        {/* =========================================
            NAVIGATION
        ========================================= */}

        <div className="flex-1 overflow-y-auto px-4 py-6">

          <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-base-content/40">
            Main Menu
          </p>


          <nav className="space-y-1">

            {baseNavigationItems.map((item) => {

              const Icon = item.icon

              return (

                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/dashboard'}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `
                    flex
                    items-center
                    gap-3
                    rounded-xl
                    px-3
                    py-3
                    text-sm
                    font-medium
                    transition-all

                    ${
                      isActive
                        ? 'bg-primary text-primary-content shadow-md shadow-primary/20'
                        : 'text-base-content/70 hover:bg-base-200 hover:text-base-content'
                    }
                    `
                  }
                >

                  <Icon size={19} />

                  <span>
                    {item.name}
                  </span>

                </NavLink>

              )

            })}

          </nav>


          {/* =========================================
              MANAGEMENT (Role-Aware)
          ========================================= */}

          {managementNavigationItems.length > 0 && (
            <>
              <p className="mb-3 mt-8 px-3 text-xs font-semibold uppercase tracking-wider text-base-content/40">
                Management
              </p>

              <nav className="space-y-1">
                {managementNavigationItems.map((item) => {
                  const Icon = item.icon

                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileOpen(false)}
                      className={({ isActive }) =>
                        `
                        flex
                        items-center
                        gap-3
                        rounded-xl
                        px-3
                        py-3
                        text-sm
                        font-medium
                        transition-all

                        ${
                          isActive
                            ? item.isError 
                              ? 'bg-error text-error-content shadow-md shadow-error/20'
                              : 'bg-primary text-primary-content shadow-md shadow-primary/20'
                            : item.isError
                              ? 'text-error hover:bg-error/10'
                              : 'text-base-content/70 hover:bg-base-200 hover:text-base-content'
                        }
                        `
                      }
                    >
                      <Icon size={19} />
                      <span>{item.name}</span>
                    </NavLink>
                  )
                })}
              </nav>
            </>
          )}


          {/* =========================================
              ACCOUNT
          ========================================= */}

          <p className="mb-3 mt-8 px-3 text-xs font-semibold uppercase tracking-wider text-base-content/40">
            Account
          </p>


          <nav className="space-y-1">

            {/* Profile */}

            <NavLink
              to="/dashboard/profile"
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `
                flex
                items-center
                gap-3
                rounded-xl
                px-3
                py-3
                text-sm
                font-medium
                transition-all

                ${
                  isActive
                    ? 'bg-primary text-primary-content shadow-md shadow-primary/20'
                    : 'text-base-content/70 hover:bg-base-200 hover:text-base-content'
                }
                `
              }
            >

              <UserCircle size={19} />

              <span>
                Profile
              </span>

            </NavLink>


            {/* Settings */}

            <NavLink
              to="/dashboard/settings"
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `
                flex
                items-center
                gap-3
                rounded-xl
                px-3
                py-3
                text-sm
                font-medium
                transition-all

                ${
                  isActive
                    ? 'bg-primary text-primary-content shadow-md shadow-primary/20'
                    : 'text-base-content/70 hover:bg-base-200 hover:text-base-content'
                }
                `
              }
            >

              <Settings size={19} />

              <span>
                Settings
              </span>

            </NavLink>

          </nav>

        </div>


        {/* =========================================
            USER INFO & LOGOUT FOOTER
        ========================================= */}

        <div className="border-t border-base-300 p-4 bg-base-200/50">
          <div className="mb-2 px-3 py-1 flex items-center justify-between">
            <div className="truncate">
              <p className="text-sm font-bold truncate">{user?.FULL_NAME || 'User'}</p>
              <p className="text-xs text-base-content/60 capitalize">Role: {role || 'Researcher'}</p>
            </div>
            <span className="badge badge-sm badge-outline font-mono">v1.0</span>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-error transition-colors hover:bg-error/10"
          >

            <LogOut size={19} />

            <span>
              Sign Out
            </span>

          </button>

        </div>

      </aside>
    </>
  )
}

export default Sidebar