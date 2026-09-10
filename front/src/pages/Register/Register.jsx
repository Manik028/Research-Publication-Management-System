import { useState } from 'react'

import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Sparkles,
  User,
  Building,
  Briefcase,
} from 'lucide-react'

import {
  Link,
  useNavigate,
} from 'react-router-dom'

import { apiPost } from '../../lib/api'


function Register() {

  // =========================================
  // NAVIGATION
  // =========================================

  const navigate = useNavigate()


  // =========================================
  // FORM STATES
  // =========================================

  const [showPassword, setShowPassword] = useState(false)

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false)

  const [name, setName] = useState('')

  const [email, setEmail] = useState('')

  const [department, setDepartment] = useState('')

  const [role, setRole] = useState('Researcher') // Default to Researcher

  const [password, setPassword] = useState('')

  const [confirmPassword, setConfirmPassword] =
    useState('')


  // =========================================
  // UI STATES
  // =========================================

  const [error, setError] = useState('')

  const [success, setSuccess] = useState('')

  const [isLoading, setIsLoading] = useState(false)


  // =========================================
  // REGISTER FUNCTION (Connected to Node.js Backend)
  // =========================================

  const handleSubmit = async (event) => {

    event.preventDefault()

    // Clear previous messages
    setError('')
    setSuccess('')

    setIsLoading(true)


    // =========================================
    // BASIC VALIDATION
    // =========================================

    if (!name.trim()) {

      setError('Please enter your full name.')

      setIsLoading(false)

      return
    }


    if (!email.trim()) {

      setError('Please enter your email address.')

      setIsLoading(false)

      return
    }


    if (!password) {

      setError('Please create a password.')

      setIsLoading(false)

      return
    }


    // =========================================
    // PASSWORD LENGTH
    // =========================================

    if (password.length < 6) {

      setError(
        'Password must contain at least 6 characters.'
      )

      setIsLoading(false)

      return
    }


    // =========================================
    // CONFIRM PASSWORD
    // =========================================

    if (password !== confirmPassword) {

      setError(
        'Password and confirm password do not match.'
      )

      setIsLoading(false)

      return
    }


    try {
      // =========================================
      // SEND DATA TO BACKEND API
      // =========================================

      await apiPost('/api/auth/register', {
        FULL_NAME: name.trim(),
        EMAIL: email.trim().toLowerCase(),
        PASSWORD: password,
        DEPARTMENT: department.trim(),
        ROLE: role.trim(),
      })

      {
        // =========================================
        // CLEAR FORM
        // =========================================

        setName('')

        setEmail('')
        
        setDepartment('')
        
        setRole('Researcher')

        setPassword('')

        setConfirmPassword('')


        // =========================================
        // SUCCESS MESSAGE
        // =========================================

        setSuccess(
          'Account created successfully! Redirecting to login...'
        )


        // =========================================
        // GO TO LOGIN
        // =========================================

        setTimeout(() => {

          navigate('/login')

        }, 1200)
      }
    } catch (err) {
      console.error('Registration request failed:', err)
      setError(err.message || 'Registration failed.')
    } finally {
      setIsLoading(false)
    }
  }


  return (

    <main className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-50 via-white to-indigo-50">

      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl items-center px-5 py-10 lg:px-8">


        <div className="grid w-full overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-indigo-100/60 lg:grid-cols-2">


          {/* =====================================================
              LEFT BRANDING PANEL
          ====================================================== */}

          <section className="relative hidden overflow-hidden bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 p-10 text-white lg:flex lg:min-h-[680px] lg:flex-col lg:justify-between xl:p-14">


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

                Build your

                <br />

                <span className="text-indigo-100">
                  research profile.
                </span>

              </h2>


              <p className="mt-6 max-w-md text-base leading-7 text-white/75">

                Join a centralized platform designed to
                help researchers organize publications,
                collaborate with co-authors, and manage
                academic projects.

              </p>


              {/* Benefits */}

              <div className="mt-8 space-y-3">

                <div className="flex items-center gap-3 text-sm text-white/80">

                  <CheckCircle2 size={18} />

                  Discover academic publications

                </div>


                <div className="flex items-center gap-3 text-sm text-white/80">

                  <CheckCircle2 size={18} />

                  Collaborate with researchers

                </div>


                <div className="flex items-center gap-3 text-sm text-white/80">

                  <CheckCircle2 size={18} />

                  Manage your research projects

                </div>

              </div>

            </div>


            {/* Bottom */}

            <div className="relative z-10">

              <div className="h-px w-full bg-white/15" />

              <p className="mt-5 text-sm text-white/60">
                Start building your academic research journey.
              </p>

            </div>

          </section>


          {/* =====================================================
              RIGHT REGISTER PANEL
          ====================================================== */}

          <section className="flex items-center justify-center px-6 py-10 sm:px-10 lg:px-14 xl:px-20">

            <div className="w-full max-w-md">


              {/* Mobile logo */}

              <div className="mb-7 flex items-center gap-3 lg:hidden">

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

              <div className="mb-7">

                <p className="mb-3 text-sm font-semibold text-indigo-600">
                  Get started
                </p>

                <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                  Create your account
                </h2>

                <p className="mt-3 text-sm leading-6 text-slate-500">
                  Join RPMS and start managing your academic
                  research in one place.
                </p>

              </div>


              {/* =========================================
                  ERROR MESSAGE
              ========================================= */}

              {error && (

                <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">

                  {error}

                </div>

              )}


              {/* =========================================
                  SUCCESS MESSAGE
              ========================================= */}

              {success && (

                <div className="mb-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-600">

                  {success}

                </div>

              )}


              {/* =========================================
                  FORM
              ========================================= */}

              <form
                onSubmit={handleSubmit}
                className="space-y-4"
              >


                {/* =========================================
                    FULL NAME
                ========================================= */}

                <div>

                  <label
                    htmlFor="name"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Full name
                  </label>


                  <div className="relative">

                    <User
                      size={19}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />


                    <input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(event) => {
                        setName(event.target.value)
                        setError('')
                      }}
                      placeholder="Enter your full name"
                      required
                      className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                    />

                  </div>

                </div>


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
                    DEPARTMENT
                ========================================= */}

                <div>

                  <label
                    htmlFor="department"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Department
                  </label>


                  <div className="relative">

                    <Building
                      size={19}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />


                    <input
                      id="department"
                      type="text"
                      value={department}
                      onChange={(event) => {
                        setDepartment(event.target.value)
                        setError('')
                      }}
                      placeholder="e.g. Computer Science"
                      required
                      className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                    />

                  </div>

                </div>


                {/* =========================================
                    ROLE (Updated to select valid database roles)
                ========================================= */}

                <div>

                  <label
                    htmlFor="role"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Role
                  </label>


                  <div className="relative">

                    <Briefcase
                      size={19}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />


                    <select
                      id="role"
                      value={role}
                      onChange={(event) => {
                        setRole(event.target.value)
                        setError('')
                      }}
                      required
                      className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                    >
                      <option value="Researcher">Researcher</option>
                      <option value="Manager">Manager</option>
                      <option value="Admin">Admin</option>
                    </select>

                  </div>

                </div>


                {/* =========================================
                    PASSWORD
                ========================================= */}

                <div>

                  <label
                    htmlFor="password"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Password
                  </label>


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
                      placeholder="Create a password"
                      required
                      className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                    />


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
                    CONFIRM PASSWORD
                ========================================= */}

                <div>

                  <label
                    htmlFor="confirmPassword"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Confirm password
                  </label>


                  <div className="relative">

                    <LockKeyhole
                      size={19}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />


                    <input
                      id="confirmPassword"
                      type={
                        showConfirmPassword
                          ? 'text'
                          : 'password'
                      }
                      value={confirmPassword}
                      onChange={(event) => {
                        setConfirmPassword(event.target.value)
                        setError('')
                      }}
                      placeholder="Repeat your password"
                      required
                      className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                    />


                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(
                          !showConfirmPassword
                        )
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                      aria-label={
                        showConfirmPassword
                          ? 'Hide confirm password'
                          : 'Show confirm password'
                      }
                    >

                      {showConfirmPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}

                    </button>

                  </div>

                </div>


                {/* =========================================
                    SUBMIT BUTTON
                ========================================= */}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="group mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition duration-200 hover:bg-indigo-700 hover:shadow-xl hover:shadow-indigo-200 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
                >

                  {isLoading ? (

                    <>
                      <span className="loading loading-spinner loading-sm" />

                      Creating account...
                    </>

                  ) : (

                    <>
                      Create Account

                      <ArrowRight
                        size={18}
                        className="transition-transform duration-200 group-hover:translate-x-1"
                      />
                    </>

                  )}

                </button>

              </form>


              {/* =========================================
                  LOGIN LINK
              ========================================= */}

              <p className="mt-7 text-center text-sm text-slate-500">

                Already have an account?

                <Link
                  to="/login"
                  className="ml-1 font-semibold text-indigo-600 hover:text-indigo-700"
                >
                  Sign in
                </Link>

              </p>


              {/* =========================================
                  FOOTER
              ========================================= */}

              <p className="mt-7 text-center text-xs leading-5 text-slate-400">
                RPMS • Research & Publication Management System
              </p>

            </div>

          </section>

        </div>

      </div>

    </main>

  )
}


export default Register