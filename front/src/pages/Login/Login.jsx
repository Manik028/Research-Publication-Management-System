import { useState } from 'react'

import {
  ArrowRight,
  BookOpen,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Sparkles,
} from 'lucide-react'

import { Link } from 'react-router-dom'

import { useAuth } from '../../context/AuthContext'
import { apiPost } from '../../lib/api'


function Login() {

  // =========================================
  // NAVIGATION & AUTH
  // =========================================

  const { login } = useAuth()


  // =========================================
  // FORM STATES
  // =========================================

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [showPassword, setShowPassword] = useState(false)

  const [error, setError] = useState('')

  const [isLoading, setIsLoading] = useState(false)


  // =========================================
  // LOGIN FUNCTION (Integrated with AuthContext & Backend)
  // =========================================

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const result = await apiPost('/api/auth/login', {
        email: email.trim().toLowerCase(),
        password,
      })

      const userData = result.data || {}
      const userRole = userData.ROLE || userData.role || 'Researcher'

      // login() persists the session and navigates to /dashboard.
      login(userData, userRole, result.token)
    } catch (err) {
      console.error('Login request failed:', err)
      setError(err.message || 'Invalid email or password.')
    } finally {
      setIsLoading(false)
    }
  }


  return (

    <main className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-50 via-white to-indigo-50">

      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl items-center px-5 py-10 lg:px-8">


        <div className="grid w-full overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-indigo-100/60 lg:grid-cols-2">


          {/* =========================================
              LEFT BRANDING PANEL
          ========================================== */}

          <section className="relative hidden overflow-hidden bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 p-10 text-white lg:flex lg:min-h-[620px] lg:flex-col lg:justify-between xl:p-14">


            {/* Decorative circles */}

            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10" />

            <div className="absolute -bottom-24 -left-20 h-72 w-72 rounded-full bg-white/10" />

            <div className="absolute right-20 top-1/2 h-32 w-32 rounded-full bg-white/5" />


            {/* Logo */}

            <div className="relative z-10 flex items-center gap-3">

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20 backdrop-blur">

                <BookOpen size={25} />

              </div>


              <div>

                <h1 className="text-xl font-bold tracking-tight">
                  RPMS
                </h1>

                <p className="text-xs text-white/70">
                  Research & Publication Management
                </p>

              </div>

            </div>


            {/* Main message */}

            <div className="relative z-10 max-w-lg">

              <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20">

                <Sparkles size={21} />

              </div>


              <h2 className="text-4xl font-bold leading-tight xl:text-5xl">

                Manage your
                <br />

                <span className="text-indigo-100">
                  research journey.
                </span>

              </h2>


              <p className="mt-6 max-w-md text-base leading-7 text-white/75">

                Discover publications, submit research,
                collaborate with researchers, manage projects,
                and participate in peer review — all in one place.

              </p>

            </div>


            {/* Bottom text */}

            <div className="relative z-10">

              <div className="h-px w-full bg-white/15" />

              <p className="mt-5 text-sm text-white/60">
                Your centralized academic research platform.
              </p>

            </div>

          </section>


          {/* =========================================
              RIGHT LOGIN PANEL
          ========================================== */}

          <section className="flex items-center justify-center px-6 py-12 sm:px-10 lg:px-14 xl:px-20">

            <div className="w-full max-w-md">


              {/* Mobile logo */}

              <div className="mb-8 flex items-center gap-3 lg:hidden">

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-200">

                  <BookOpen size={22} />

                </div>


                <div>

                  <h1 className="font-bold text-slate-900">
                    RPMS
                  </h1>

                  <p className="text-xs text-slate-500">
                    Research & Publication Management
                  </p>

                </div>

              </div>


              {/* Heading */}

              <div className="mb-8">

                <p className="mb-3 text-sm font-semibold text-indigo-600">
                  Welcome back
                </p>

                <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                  Sign in to RPMS
                </h2>

                <p className="mt-3 text-sm leading-6 text-slate-500">
                  Access your research workspace and continue
                  where you left off.
                </p>

              </div>


              {/* =========================================
                  LOGIN FORM
              ========================================== */}

              <form
                onSubmit={handleSubmit}
                className="space-y-5"
              >


                {/* =========================================
                    EMAIL
                ========================================= */}

                <div>

                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Email address
                  </label>


                  <div className="relative">

                    <Mail
                      size={19}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />


                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(event) => {
                        setEmail(event.target.value)
                        setError('')
                      }}
                      placeholder="you@example.com"
                      required
                      className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                    />

                  </div>

                </div>


                {/* =========================================
                    PASSWORD
                ========================================= */}

                <div>

                  <div className="mb-2 flex items-center justify-between">

                    <label
                      htmlFor="password"
                      className="block text-sm font-semibold text-slate-700"
                    >
                      Password
                    </label>


                    <button
                      type="button"
                      className="text-xs font-semibold text-indigo-600 transition hover:text-indigo-700"
                      onClick={() => {
                        setError(
                          'Password recovery will be connected later.'
                        )
                      }}
                    >
                      Forgot password?
                    </button>

                  </div>


                  <div className="relative">

                    <LockKeyhole
                      size={19}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />


                    <input
                      id="password"
                      type={
                        showPassword
                          ? 'text'
                          : 'password'
                      }
                      value={password}
                      onChange={(event) => {
                        setPassword(event.target.value)
                        setError('')
                      }}
                      placeholder="Enter your password"
                      required
                      className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                    />


                    {/* Show / Hide password */}

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword(!showPassword)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                      aria-label={
                        showPassword
                          ? 'Hide password'
                          : 'Show password'
                      }
                    >

                      {showPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}

                    </button>

                  </div>

                </div>


                {/* =========================================
                    ERROR MESSAGE
                ========================================= */}

                {error && (

                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">

                    {error}

                  </div>

                )}


                {/* =========================================
                    SUBMIT BUTTON
                ========================================= */}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition duration-200 hover:bg-indigo-700 hover:shadow-xl hover:shadow-indigo-200 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
                >

                  {isLoading ? (
                    <>
                      <span className="loading loading-spinner loading-sm" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign In

                      <ArrowRight
                        size={18}
                        className="transition-transform duration-200 group-hover:translate-x-1"
                      />
                    </>
                  )}

                </button>

              </form>


              {/* =========================================
                  REGISTER LINK
              ========================================== */}

              <p className="mt-8 text-center text-sm text-slate-500">

                Don't have an account?

                <Link
                  to="/register"
                  className="ml-1 font-semibold text-indigo-600 hover:text-indigo-700"
                >
                  Create one
                </Link>

              </p>


              {/* =========================================
                  FOOTER
              ========================================== */}

              <p className="mt-10 text-center text-xs text-slate-400">
                RPMS • Research & Publication Management System
              </p>

            </div>

          </section>

        </div>

      </div>

    </main>

  )
}


export default Login