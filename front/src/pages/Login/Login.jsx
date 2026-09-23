import { useState } from 'react'

import {
  ArrowRight,
  BookOpen,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'

import { Link } from 'react-router-dom'

import { useAuth } from '../../context/AuthContext'
import { apiPost } from '../../lib/api'


function Login() {

  const { login } = useAuth()

  // =========================================
  // LOGIN FORM STATE
  // =========================================

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // =========================================
  // 2FA STATE — set when login() reports twoFactorRequired
  // =========================================

  const [twoFactorUserId, setTwoFactorUserId] = useState(null)
  const [otpCode, setOtpCode] = useState('')
  const [otpError, setOtpError] = useState('')
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false)

  // =========================================
  // FORGOT PASSWORD MODAL STATE
  // =========================================

  const [showForgotModal, setShowForgotModal] = useState(false)
  const [forgotStep, setForgotStep] = useState('email') // 'email' | 'reset' | 'done'
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotOtp, setForgotOtp] = useState('')
  const [forgotNewPassword, setForgotNewPassword] = useState('')
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('')
  const [forgotError, setForgotError] = useState('')
  const [forgotMessage, setForgotMessage] = useState('')
  const [isForgotSubmitting, setIsForgotSubmitting] = useState(false)

  const resetForgotState = () => {
    setShowForgotModal(false)
    setForgotStep('email')
    setForgotEmail('')
    setForgotOtp('')
    setForgotNewPassword('')
    setForgotConfirmPassword('')
    setForgotError('')
    setForgotMessage('')
  }

  // =========================================
  // LOGIN SUBMIT
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

      if (result.twoFactorRequired) {
        setTwoFactorUserId(result.userId)
        setIsLoading(false)
        return
      }

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

  // =========================================
  // 2FA SUBMIT
  // =========================================

  const handleVerifyOtp = async (event) => {
    event.preventDefault()
    setOtpError('')
    setIsVerifyingOtp(true)

    try {
      const result = await apiPost('/api/auth/verify-2fa', {
        userId: twoFactorUserId,
        otp: otpCode,
      })

      const userData = result.data || {}
      const userRole = userData.ROLE || userData.role || 'Researcher'
      login(userData, userRole, result.token)
    } catch (err) {
      console.error('2FA verification failed:', err)
      setOtpError(err.message || 'Verification failed.')
    } finally {
      setIsVerifyingOtp(false)
    }
  }

  // =========================================
  // FORGOT PASSWORD SUBMIT HANDLERS
  // =========================================

  const handleRequestReset = async (event) => {
    event.preventDefault()
    setForgotError('')
    setIsForgotSubmitting(true)

    try {
      const result = await apiPost('/api/auth/forgot-password', {
        email: forgotEmail.trim().toLowerCase(),
      })
      setForgotMessage(result.message)
      setForgotStep('reset')
    } catch (err) {
      console.error('Forgot-password request failed:', err)
      setForgotError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setIsForgotSubmitting(false)
    }
  }

  const handleSubmitReset = async (event) => {
    event.preventDefault()
    setForgotError('')

    if (forgotNewPassword !== forgotConfirmPassword) {
      setForgotError('New password and confirmation do not match.')
      return
    }

    setIsForgotSubmitting(true)

    try {
      await apiPost('/api/auth/reset-password', {
        email: forgotEmail.trim().toLowerCase(),
        otp: forgotOtp.trim(),
        newPassword: forgotNewPassword,
      })
      setForgotStep('done')
    } catch (err) {
      console.error('Reset-password failed:', err)
      setForgotError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setIsForgotSubmitting(false)
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

            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10" />
            <div className="absolute -bottom-24 -left-20 h-72 w-72 rounded-full bg-white/10" />
            <div className="absolute right-20 top-1/2 h-32 w-32 rounded-full bg-white/5" />

            <div className="relative z-10 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20 backdrop-blur">
                <BookOpen size={25} />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">RPMS</h1>
                <p className="text-xs text-white/70">Research & Publication Management</p>
              </div>
            </div>

            <div className="relative z-10 max-w-lg">
              <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20">
                <Sparkles size={21} />
              </div>
              <h2 className="text-4xl font-bold leading-tight xl:text-5xl">
                Manage your
                <br />
                <span className="text-indigo-100">research journey.</span>
              </h2>
              <p className="mt-6 max-w-md text-base leading-7 text-white/75">
                Discover publications, submit research,
                collaborate with researchers, manage projects,
                and participate in peer review — all in one place.
              </p>
            </div>

            <div className="relative z-10">
              <div className="h-px w-full bg-white/15" />
              <p className="mt-5 text-sm text-white/60">
                Your centralized academic research platform.
              </p>
            </div>

          </section>


          {/* =========================================
              RIGHT PANEL
          ========================================== */}

          <section className="flex items-center justify-center px-6 py-12 sm:px-10 lg:px-14 xl:px-20">

            <div className="w-full max-w-md">

              <div className="mb-8 flex items-center gap-3 lg:hidden">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-200">
                  <BookOpen size={22} />
                </div>
                <div>
                  <h1 className="font-bold text-slate-900">RPMS</h1>
                  <p className="text-xs text-slate-500">Research & Publication Management</p>
                </div>
              </div>

              {twoFactorUserId ? (

                /* =========================================
                    2FA VERIFICATION STEP
                ========================================== */
                <>
                  <div className="mb-8">
                    <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                      <ShieldCheck size={22} />
                    </div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                      Verify it's you
                    </h2>
                    <p className="mt-3 text-sm leading-6 text-slate-500">
                      We emailed a 6-digit code to your address. Enter it below to finish signing in.
                    </p>
                  </div>

                  <form onSubmit={handleVerifyOtp} className="space-y-5">
                    <div>
                      <label htmlFor="otp" className="mb-2 block text-sm font-semibold text-slate-700">
                        Verification code
                      </label>
                      <input
                        id="otp"
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={otpCode}
                        onChange={(e) => { setOtpCode(e.target.value.replace(/\D/g, '')); setOtpError('') }}
                        placeholder="123456"
                        required
                        className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-center text-lg tracking-[0.5em] text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                      />
                    </div>

                    {otpError && (
                      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                        {otpError}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isVerifyingOtp || otpCode.length !== 6}
                      className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {isVerifyingOtp ? 'Verifying...' : 'Verify & Sign In'}
                    </button>

                    <button
                      type="button"
                      onClick={() => { setTwoFactorUserId(null); setOtpCode(''); setOtpError('') }}
                      className="w-full text-center text-sm font-semibold text-slate-500 hover:text-slate-700"
                    >
                      Back to sign in
                    </button>
                  </form>
                </>

              ) : (

                /* =========================================
                    NORMAL LOGIN FORM
                ========================================== */
                <>
                  <div className="mb-8">
                    <p className="mb-3 text-sm font-semibold text-indigo-600">Welcome back</p>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                      Sign in to RPMS
                    </h2>
                    <p className="mt-3 text-sm leading-6 text-slate-500">
                      Access your research workspace and continue where you left off.
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-5">

                    <div>
                      <label htmlFor="email" className="mb-2 block text-sm font-semibold text-slate-700">
                        Email address
                      </label>
                      <div className="relative">
                        <Mail size={19} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(event) => { setEmail(event.target.value); setError('') }}
                          placeholder="you@example.com"
                          required
                          className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="mb-2 flex items-center justify-between">
                        <label htmlFor="password" className="block text-sm font-semibold text-slate-700">
                          Password
                        </label>
                        <button
                          type="button"
                          className="text-xs font-semibold text-indigo-600 transition hover:text-indigo-700"
                          onClick={() => { setForgotEmail(email); setShowForgotModal(true) }}
                        >
                          Forgot password?
                        </button>
                      </div>

                      <div className="relative">
                        <LockKeyhole size={19} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(event) => { setPassword(event.target.value); setError('') }}
                          placeholder="Enter your password"
                          required
                          className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>

                    {error && (
                      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                        {error}
                      </div>
                    )}

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
                          <ArrowRight size={18} className="transition-transform duration-200 group-hover:translate-x-1" />
                        </>
                      )}
                    </button>
                  </form>

                  <p className="mt-8 text-center text-sm text-slate-500">
                    Don't have an account?
                    <Link to="/register" className="ml-1 font-semibold text-indigo-600 hover:text-indigo-700">
                      Create one
                    </Link>
                  </p>

                  <p className="mt-10 text-center text-xs text-slate-400">
                    RPMS • Research & Publication Management System
                  </p>
                </>
              )}

            </div>

          </section>

        </div>

      </div>


      {/* =========================================
          FORGOT PASSWORD MODAL
      ========================================== */}

      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">

            {forgotStep === 'email' && (
              <form onSubmit={handleRequestReset} className="space-y-4">
                <h2 className="text-xl font-bold text-slate-900">Reset your password</h2>
                <p className="text-sm text-slate-500">
                  Enter your account email and we'll send a 6-digit code to reset your password.
                </p>

                <div>
                  <label htmlFor="forgot-email" className="label text-sm font-semibold text-slate-700">
                    Email address
                  </label>
                  <input
                    id="forgot-email"
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="input input-bordered w-full"
                  />
                </div>

                {forgotError && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                    {forgotError}
                  </div>
                )}

                <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                  <button type="button" onClick={resetForgotState} className="btn btn-ghost">Cancel</button>
                  <button type="submit" disabled={isForgotSubmitting} className="btn btn-primary">
                    {isForgotSubmitting ? 'Sending...' : 'Send code'}
                  </button>
                </div>
              </form>
            )}

            {forgotStep === 'reset' && (
              <form onSubmit={handleSubmitReset} className="space-y-4">
                <h2 className="text-xl font-bold text-slate-900">Enter code & new password</h2>
                {forgotMessage && <p className="text-sm text-slate-500">{forgotMessage}</p>}

                <div>
                  <label htmlFor="forgot-otp" className="label text-sm font-semibold text-slate-700">
                    6-digit code
                  </label>
                  <input
                    id="forgot-otp"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    required
                    value={forgotOtp}
                    onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, ''))}
                    className="input input-bordered w-full text-center tracking-[0.5em]"
                  />
                </div>

                <div>
                  <label htmlFor="forgot-new-password" className="label text-sm font-semibold text-slate-700">
                    New password
                  </label>
                  <input
                    id="forgot-new-password"
                    type="password"
                    required
                    value={forgotNewPassword}
                    onChange={(e) => setForgotNewPassword(e.target.value)}
                    className="input input-bordered w-full"
                  />
                  <p className="mt-1 text-xs text-slate-400">
                    At least 8 characters, with uppercase, lowercase, a number and a special character.
                  </p>
                </div>

                <div>
                  <label htmlFor="forgot-confirm-password" className="label text-sm font-semibold text-slate-700">
                    Confirm new password
                  </label>
                  <input
                    id="forgot-confirm-password"
                    type="password"
                    required
                    value={forgotConfirmPassword}
                    onChange={(e) => setForgotConfirmPassword(e.target.value)}
                    className="input input-bordered w-full"
                  />
                </div>

                {forgotError && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                    {forgotError}
                  </div>
                )}

                <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                  <button type="button" onClick={resetForgotState} className="btn btn-ghost">Cancel</button>
                  <button type="submit" disabled={isForgotSubmitting} className="btn btn-primary">
                    {isForgotSubmitting ? 'Resetting...' : 'Reset password'}
                  </button>
                </div>
              </form>
            )}

            {forgotStep === 'done' && (
              <div className="space-y-4 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                  <ShieldCheck size={26} />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Password reset</h2>
                <p className="text-sm text-slate-500">
                  Your password has been changed. Any other signed-in devices have been logged out automatically.
                </p>
                <button onClick={resetForgotState} className="btn btn-primary w-full">
                  Back to sign in
                </button>
              </div>
            )}

          </div>
        </div>
      )}

    </main>

  )
}


export default Login