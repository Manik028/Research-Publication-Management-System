import {
  BookOpen,
  LayoutDashboard,
  LogOut,
  Menu,
  X,
} from 'lucide-react'

import { useState } from 'react'

import {
  Link,
  NavLink,
} from 'react-router-dom'

import { useAuth } from '../../context/AuthContext'


function Navbar() {

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // The navbar used to always show "Log In / Register", even for a signed-in
  // user, with no way to reach the dashboard or sign out from a public page.
  const { isAuthenticated, user, logout } = useAuth()

  const handleLogout = () => {
    setMobileMenuOpen(false)
    logout()
  }


  return (

    <header className="sticky top-0 z-50 border-b border-base-300 bg-base-100/95 backdrop-blur">

      {/* =========================================
          MAIN NAVBAR
      ========================================== */}

      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 lg:px-8">


        {/* =========================================
            LOGO
        ========================================== */}

        <Link
          to="/"
          className="flex items-center gap-3"
          onClick={() => setMobileMenuOpen(false)}
        >

          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-content shadow-lg shadow-primary/20">

            <BookOpen size={21} />

          </div>


          <div>

            <h1 className="text-lg font-bold tracking-tight">
              RPMS
            </h1>

            <p className="hidden text-[10px] font-medium text-base-content/50 sm:block">
              Research & Publication Management
            </p>

          </div>

        </Link>


        {/* =========================================
            DESKTOP NAVIGATION
        ========================================== */}

        <nav className="hidden items-center gap-1 lg:flex">


          {/* Publications */}

          <NavLink
            to="/publications"
            className={({ isActive }) =>
              `btn btn-ghost btn-sm ${
                isActive
                  ? 'bg-primary/10 text-primary'
                  : ''
              }`
            }
          >
            Browse Publications
          </NavLink>


          {/* Conferences */}

          <NavLink
            to="/conferences"
            className={({ isActive }) =>
              `btn btn-ghost btn-sm ${
                isActive
                  ? 'bg-primary/10 text-primary'
                  : ''
              }`
            }
          >
            Conferences
          </NavLink>


          {/* Journals */}

          <NavLink
            to="/journals"
            className={({ isActive }) =>
              `btn btn-ghost btn-sm ${
                isActive
                  ? 'bg-primary/10 text-primary'
                  : ''
              }`
            }
          >
            Journals
          </NavLink>


          {/* About */}

          <NavLink
            to="/about"
            className={({ isActive }) =>
              `btn btn-ghost btn-sm ${
                isActive
                  ? 'bg-primary/10 text-primary'
                  : ''
              }`
            }
          >
            About
          </NavLink>

        </nav>


        {/* =========================================
            DESKTOP AUTH BUTTONS
        ========================================== */}

        <div className="hidden items-center gap-2 lg:flex">

          {isAuthenticated ? (
            <>
              <span className="mr-1 hidden text-sm font-medium text-base-content/60 xl:inline">
                {user?.FULL_NAME}
              </span>

              <Link
                to="/dashboard"
                className="btn btn-primary btn-sm gap-2 px-4"
              >
                <LayoutDashboard size={16} />
                Dashboard
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="btn btn-ghost btn-sm gap-2 text-error"
              >
                <LogOut size={16} />
                Sign Out
              </button>
            </>
          ) : (
            <>
              {/* Login */}

              <Link
                to="/login"
                className="btn btn-ghost btn-sm"
              >
                Log In
              </Link>


              {/* Register */}

              <Link
                to="/register"
                className="btn btn-primary btn-sm px-5"
              >
                Register
              </Link>
            </>
          )}

        </div>


        {/* =========================================
            MOBILE MENU BUTTON
        ========================================== */}

        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="btn btn-ghost btn-square lg:hidden"
          aria-label="Toggle navigation menu"
          aria-expanded={mobileMenuOpen}
        >

          {mobileMenuOpen ? (
            <X size={22} />
          ) : (
            <Menu size={22} />
          )}

        </button>

      </div>


      {/* =========================================
          MOBILE NAVIGATION
      ========================================== */}

      {mobileMenuOpen && (

        <div className="border-t border-base-300 bg-base-100 lg:hidden">

          <nav className="mx-auto flex max-w-7xl flex-col gap-1 px-5 py-4">


            {/* Publications */}

            <NavLink
              to="/publications"
              className={({ isActive }) =>
                `btn btn-ghost justify-start ${
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : ''
                }`
              }
              onClick={() => setMobileMenuOpen(false)}
            >
              Browse Publications
            </NavLink>


            {/* Conferences */}

            <NavLink
              to="/conferences"
              className={({ isActive }) =>
                `btn btn-ghost justify-start ${
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : ''
                }`
              }
              onClick={() => setMobileMenuOpen(false)}
            >
              Conferences
            </NavLink>


            {/* Journals */}

            <NavLink
              to="/journals"
              className={({ isActive }) =>
                `btn btn-ghost justify-start ${
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : ''
                }`
              }
              onClick={() => setMobileMenuOpen(false)}
            >
              Journals
            </NavLink>


            {/* About */}

            <NavLink
              to="/about"
              className={({ isActive }) =>
                `btn btn-ghost justify-start ${
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : ''
                }`
              }
              onClick={() => setMobileMenuOpen(false)}
            >
              About
            </NavLink>


            {/* Divider */}

            <div className="my-2 border-t border-base-300" />


            {isAuthenticated ? (
              <>
                <Link
                  to="/dashboard"
                  className="btn btn-primary justify-start gap-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <LayoutDashboard size={17} />
                  Dashboard
                </Link>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="btn btn-ghost justify-start gap-2 text-error"
                >
                  <LogOut size={17} />
                  Sign Out
                </button>
              </>
            ) : (
              <>
                {/* Login */}

                <Link
                  to="/login"
                  className="btn btn-ghost justify-start"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Log In
                </Link>


                {/* Register */}

                <Link
                  to="/register"
                  className="btn btn-primary"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Register
                </Link>
              </>
            )}

          </nav>

        </div>

      )}

    </header>

  )

}


export default Navbar