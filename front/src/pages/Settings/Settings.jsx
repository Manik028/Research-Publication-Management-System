import {
  Bell,
  Check,
  ChevronRight,
  Globe,
  KeyRound,
  Lock,
  Mail,
  Monitor,
  Moon,
  Palette,
  Save,
  ShieldCheck,
  Sun,
  User,
} from 'lucide-react'

import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { apiPut } from '../../lib/api'

const PREFERENCES_KEY = 'rpmsPreferences'

// Notification/theme/language choices are UI-only: there is no column for them
// in the ERD, so they persist locally instead of being silently dropped by the
// server (the old code posted them to /api/users, which ignored them).
function readPreferences() {
  try {
    return JSON.parse(localStorage.getItem(PREFERENCES_KEY) || '{}')
  } catch {
    return {}
  }
}

function Settings() {

  // =====================================================
  // ACCOUNT SETTINGS & AUTH CONTEXT
  // =====================================================

  const { user, token, updateUser, logout } = useAuth()
  const storedPreferences = readPreferences()

  // Initialised straight from the session so there is no flash of placeholder
  // data and no setState-inside-an-effect cascade.
  const [fullName, setFullName] = useState(user?.FULL_NAME || '')
  const [email, setEmail] = useState(user?.EMAIL || '')
  // Read-only, derived straight from the session - no local copy needed.
  const department = user?.DEPARTMENT || ''
  const orcid = user?.ORCID || ''
  const researcherId = user?.ID
    ? `RPMS-${String(user.ID).padStart(5, '0')}`
    : 'RPMS-00000'
  const role = user?.ROLE || 'Researcher'

  const [emailNotifications, setEmailNotifications] = useState(
    storedPreferences.emailNotifications ?? true,
  )
  const [reviewNotifications, setReviewNotifications] = useState(
    storedPreferences.reviewNotifications ?? true,
  )
  const [publicationNotifications, setPublicationNotifications] = useState(
    storedPreferences.publicationNotifications ?? true,
  )

  const [theme, setTheme] = useState(storedPreferences.theme || 'light')

  const [language, setLanguage] = useState(storedPreferences.language || 'English')

  // =====================================================
  // CHANGE PASSWORD (Phase 9 — real implementation, replaces the old
  // "coming soon" alert)
  // =====================================================
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [changePwdError, setChangePwdError] = useState('')
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  // =====================================================
  // TWO-FACTOR AUTHENTICATION TOGGLE
  // =====================================================
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(Boolean(user?.TWO_FACTOR_ENABLED))
  const [isTogglingTwoFactor, setIsTogglingTwoFactor] = useState(false)

  const handleToggleTwoFactor = async () => {
    const next = !twoFactorEnabled
    setIsTogglingTwoFactor(true)
    try {
      await apiPut('/api/auth/two-factor', { enabled: next }, token)
      setTwoFactorEnabled(next)
      updateUser({ TWO_FACTOR_ENABLED: next ? 1 : 0 })
    } catch (err) {
      console.error('Failed to update two-factor setting:', err)
      setMessage(err.message || 'Failed to update two-factor authentication.')
      setIsError(true)
    } finally {
      setIsTogglingTwoFactor(false)
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    setChangePwdError('')

    if (newPassword !== confirmNewPassword) {
      setChangePwdError('New password and confirmation do not match.')
      return
    }

    setIsChangingPassword(true)
    try {
      await apiPut('/api/auth/change-password', { currentPassword, newPassword }, token)
      // The token this session is using is now invalid (RESET_PASSWORD
      // bumped PASSWORD_CHANGED_AT), so the only correct move is to log
      // the user out and have them sign back in with the new password.
      logout()
    } catch (err) {
      console.error('Failed to change password:', err)
      setChangePwdError(err.message || 'Failed to change password.')
    } finally {
      setIsChangingPassword(false)
    }
  }

  const [saved, setSaved] = useState(false)
  const userId = user?.ID ?? user?.id ?? null
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)
  const [isSaving, setIsSaving] = useState(false)


  // Apply the selected daisyUI theme to the document.
  //
  // RPMS currently only ships ONE fully-designed theme (light) — every page
  // was built and tested against it. DaisyUI's built-in "dark" theme uses
  // different color tokens (base-100/base-content/etc.) that several pages
  // rely on, and switching to it produced illegible dark-text-on-dark-
  // background UI throughout the app. Rather than leave that trap in place,
  // this always applies "light" no matter what the user picks here or what
  // their OS prefers — the theme picker below is left in place for when a
  // real dark theme gets built, but it doesn't do anything destructive yet.
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'light')
  }, [theme])


  // =====================================================
  // SAVE SETTINGS (Connected to Node.js Backend & ERD Mapping)
  // =====================================================

  const handleSave = async () => {
    setMessage('')
    setIsError(false)

    // Preferences are local-only; store them regardless of the API call.
    localStorage.setItem(
      PREFERENCES_KEY,
      JSON.stringify({
        emailNotifications,
        reviewNotifications,
        publicationNotifications,
        theme,
        language,
      }),
    )

    if (!userId) {
      setIsError(true)
      setMessage('Preferences saved locally, but your account id is missing so the profile was not updated.')
      return
    }

    setIsSaving(true)

    try {
      // DEPARTMENT and ORCID are included so the backend does not treat them
      // as omitted; previously this request blanked both columns.
      const result = await apiPut(
        `/api/users/${userId}`,
        {
          FULL_NAME: fullName,
          EMAIL: email,
          DEPARTMENT: department,
          ORCID: orcid,
        },
        token,
      )

      if (result.data) updateUser(result.data)

      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (err) {
      console.error('Failed to save settings:', err)
      setIsError(true)
      setMessage(err.message)
    } finally {
      setIsSaving(false)
    }
  }


  return (

    <div className="mx-auto max-w-7xl space-y-6">


      {/* =====================================================
          PAGE HEADER
      ====================================================== */}

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">

        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">

          <div>

            <div className="mb-3 flex items-center gap-3">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">

                <Palette size={21} />

              </div>

              <p className="text-sm font-semibold text-indigo-600">
                Preferences
              </p>

            </div>


            <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Settings
            </h1>


            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">

              Manage your account preferences, notifications,
              security, and application settings.

            </p>

          </div>


          {/* Save button */}

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="flex h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700 hover:shadow-xl active:scale-[0.99] disabled:opacity-60"
          >

            {saved ? (
              <>
                <Check size={18} />
                Saved
              </>
            ) : (
              <>
                <Save size={18} />
                Save Changes
              </>
            )}

          </button>

        </div>

        {message && (
          <div
            className={`mt-4 rounded-xl px-4 py-2 text-sm font-medium ${
              isError
                ? 'border border-rose-200 bg-rose-50 text-rose-600'
                : 'bg-indigo-50 text-indigo-700'
            }`}
          >
            {message}
          </div>
        )}

      </section>



      {/* =====================================================
          SETTINGS GRID
      ====================================================== */}

      <div className="grid gap-6 lg:grid-cols-3">


        {/* ===================================================
            LEFT SETTINGS NAVIGATION
        ==================================================== */}

        <section className="h-fit rounded-3xl border border-slate-200 bg-white p-3 shadow-sm">

          <div className="p-3">

            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Settings
            </p>

          </div>


          <div className="space-y-1">

            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-xl bg-indigo-50 px-4 py-3 text-left text-sm font-semibold text-indigo-700"
            >

              <User size={18} />

              <span className="flex-1">
                Account
              </span>

              <ChevronRight size={17} />

            </button>


            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
            >

              <Bell size={18} />

              <span className="flex-1">
                Notifications
              </span>

              <ChevronRight size={17} />

            </button>


            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
            >

              <ShieldCheck size={18} />

              <span className="flex-1">
                Security
              </span>

              <ChevronRight size={17} />

            </button>


            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
            >

              <Palette size={18} />

              <span className="flex-1">
                Appearance
              </span>

              <ChevronRight size={17} />

            </button>

          </div>

        </section>



        {/* ===================================================
            RIGHT SETTINGS CONTENT
        ==================================================== */}

        <div className="space-y-6 lg:col-span-2">


          {/* =================================================
              ACCOUNT INFORMATION
          ================================================== */}

          <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">

            <div className="border-b border-slate-100 p-6">

              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">

                  <User size={19} />

                </div>


                <div>

                  <h2 className="font-bold text-slate-900">
                    Account Information
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Manage your basic account information.
                  </p>

                </div>

              </div>

            </div>


            <div className="grid gap-5 p-6 sm:grid-cols-2">


              {/* Full Name */}

              <div>

                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Full Name
                </label>

                <div className="relative">

                  <User
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                  />

                </div>

              </div>


              {/* Email */}

              <div>

                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Email Address
                </label>

                <div className="relative">

                  <Mail
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                  />

                </div>

              </div>


              {/* Researcher ID */}

              <div>

                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Researcher ID
                </label>

                <input
                  type="text"
                  value={researcherId}
                  disabled
                  className="h-12 w-full rounded-xl border border-slate-200 bg-slate-100 px-4 text-sm text-slate-500"
                />

              </div>


              {/* Role */}

              <div>

                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Account Role
                </label>

                <input
                  type="text"
                  value={role}
                  disabled
                  className="h-12 w-full rounded-xl border border-slate-200 bg-slate-100 px-4 text-sm text-slate-500"
                />

              </div>

            </div>

          </section>



          {/* =================================================
              NOTIFICATIONS
          ================================================== */}

          <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">

            <div className="border-b border-slate-100 p-6">

              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">

                  <Bell size={19} />

                </div>


                <div>

                  <h2 className="font-bold text-slate-900">
                    Notifications
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Choose what notifications you want to receive.
                  </p>

                </div>

              </div>

            </div>


            <div className="divide-y divide-slate-100">


              {/* Email notifications */}

              <div className="flex items-center justify-between gap-5 p-6">

                <div className="flex items-start gap-4">

                  <div className="mt-0.5 text-slate-400">

                    <Mail size={19} />

                  </div>


                  <div>

                    <h3 className="text-sm font-semibold text-slate-800">
                      Email Notifications
                    </h3>

                    <p className="mt-1 text-sm leading-5 text-slate-500">
                      Receive important updates and account notifications.
                    </p>

                  </div>

                </div>


                <input
                  type="checkbox"
                  checked={emailNotifications}
                  onChange={(event) =>
                    setEmailNotifications(event.target.checked)
                  }
                  className="toggle toggle-primary"
                />

              </div>



              {/* Review notifications */}

              <div className="flex items-center justify-between gap-5 p-6">

                <div className="flex items-start gap-4">

                  <div className="mt-0.5 text-slate-400">

                    <ShieldCheck size={19} />

                  </div>


                  <div>

                    <h3 className="text-sm font-semibold text-slate-800">
                      Peer Review Updates
                    </h3>

                    <p className="mt-1 text-sm leading-5 text-slate-500">
                      Get notified about review assignments and deadlines.
                    </p>

                  </div>

                </div>


                <input
                  type="checkbox"
                  checked={reviewNotifications}
                  onChange={(event) =>
                    setReviewNotifications(event.target.checked)
                  }
                  className="toggle toggle-primary"
                />

              </div>



              {/* Publication notifications */}

              <div className="flex items-center justify-between gap-5 p-6">

                <div className="flex items-start gap-4">

                  <div className="mt-0.5 text-slate-400">

                    <Mail size={19} />

                  </div>


                  <div>

                    <h3 className="text-sm font-semibold text-slate-800">
                      Publication Updates
                    </h3>

                    <p className="mt-1 text-sm leading-5 text-slate-500">
                      Receive updates related to your publications.
                    </p>

                  </div>

                </div>


                <input
                  type="checkbox"
                  checked={publicationNotifications}
                  onChange={(event) =>
                    setPublicationNotifications(event.target.checked)
                  }
                  className="toggle toggle-primary"
                />

              </div>

            </div>

          </section>



          {/* =================================================
              SECURITY
          ================================================== */}

          <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">

            <div className="border-b border-slate-100 p-6">

              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600">

                  <Lock size={19} />

                </div>


                <div>

                  <h2 className="font-bold text-slate-900">
                    Security
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Manage your password and account security.
                  </p>

                </div>

              </div>

            </div>


            <div className="space-y-3 p-6">


              <button
                type="button"
                onClick={() => setShowChangePassword(true)}
                className="flex w-full items-center gap-4 rounded-2xl border border-slate-200 p-4 text-left transition hover:border-indigo-200 hover:bg-indigo-50/40"
              >

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">

                  <KeyRound size={18} />

                </div>


                <div className="flex-1">

                  <h3 className="text-sm font-semibold text-slate-800">
                    Change Password
                  </h3>

                  <p className="mt-1 text-xs text-slate-500">
                    Update your account password.
                  </p>

                </div>


                <ChevronRight
                  size={18}
                  className="text-slate-400"
                />

              </button>


              <button
                type="button"
                onClick={handleToggleTwoFactor}
                disabled={isTogglingTwoFactor}
                className="flex w-full items-center gap-4 rounded-2xl border border-slate-200 p-4 text-left transition hover:border-indigo-200 hover:bg-indigo-50/40 disabled:opacity-60"
              >

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">

                  <ShieldCheck size={18} />

                </div>


                <div className="flex-1">

                  <h3 className="text-sm font-semibold text-slate-800">
                    Two-Factor Authentication
                  </h3>

                  <p className="mt-1 text-xs text-slate-500">
                    {twoFactorEnabled
                      ? 'Enabled — a code is emailed to you at every sign-in.'
                      : 'Disabled — get an email code as a second step at login.'}
                  </p>

                </div>

                <div className={`badge ${twoFactorEnabled ? 'badge-success' : 'badge-ghost'} gap-1`}>
                  {isTogglingTwoFactor ? '...' : twoFactorEnabled ? 'On' : 'Off'}
                </div>

              </button>


              <button
                type="button"
                onClick={() => alert("Security review dashboard coming soon")}
                className="flex w-full items-center gap-4 rounded-2xl border border-slate-200 p-4 text-left transition hover:border-indigo-200 hover:bg-indigo-50/40"
              >

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">

                  <ShieldCheck size={18} />

                </div>


                <div className="flex-1">

                  <h3 className="text-sm font-semibold text-slate-800">
                    Login & Security
                  </h3>

                  <p className="mt-1 text-xs text-slate-500">
                    Review your account security settings.
                  </p>

                </div>


                <ChevronRight
                  size={18}
                  className="text-slate-400"
                />

              </button>

            </div>

          </section>



          {/* =================================================
              APPEARANCE
          ================================================== */}

          <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">

            <div className="border-b border-slate-100 p-6">

              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">

                  <Monitor size={19} />

                </div>


                <div>

                  <h2 className="font-bold text-slate-900">
                    Appearance
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Customize how RPMS looks for you.
                  </p>

                </div>

              </div>

            </div>


            <div className="p-6">


              <p className="mb-4 text-sm font-semibold text-slate-700">
                Theme
              </p>


              <div className="grid gap-3 sm:grid-cols-3">


                {/* Light */}

                <button
                  type="button"
                  onClick={() => setTheme('light')}
                  className={`rounded-2xl border p-4 text-left transition ${
                    theme === 'light'
                      ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-100'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >

                  <Sun
                    size={20}
                    className="mb-3 text-amber-500"
                  />

                  <p className="text-sm font-semibold text-slate-800">
                    Light
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Bright interface
                  </p>

                </button>



                {/* Dark */}

                <button
                  type="button"
                  onClick={() => setTheme('dark')}
                  className={`rounded-2xl border p-4 text-left transition ${
                    theme === 'dark'
                      ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-100'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >

                  <Moon
                    size={20}
                    className="mb-3 text-indigo-600"
                  />

                  <p className="text-sm font-semibold text-slate-800">
                    Dark
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Dark interface
                  </p>

                </button>



                {/* System */}

                <button
                  type="button"
                  onClick={() => setTheme('system')}
                  className={`rounded-2xl border p-4 text-left transition ${
                    theme === 'system'
                      ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-100'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >

                  <Monitor
                    size={20}
                    className="mb-3 text-slate-600"
                  />

                  <p className="text-sm font-semibold text-slate-800">
                    System
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Use system preference
                  </p>

                </button>

              </div>

            </div>

          </section>



          {/* =================================================
              LANGUAGE
          ================================================== */}

          <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">

            <div className="flex items-center gap-4 p-6">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">

                <Globe size={19} />

              </div>


              <div className="flex-1">

                <h2 className="font-bold text-slate-900">
                  Language
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Select your preferred application language.
                </p>

              </div>


              <select
                value={language}
                onChange={(event) => setLanguage(event.target.value)}
                className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-700 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
              >

                <option>
                  English
                </option>

                <option>
                  বাংলা
                </option>

              </select>

            </div>

          </section>


        </div>

      </div>


      {/* =====================================================
          BOTTOM NOTE
      ====================================================== */}

      <div className="rounded-2xl border border-indigo-100 bg-indigo-50 px-5 py-4">

        <div className="flex items-start gap-3">

          <ShieldCheck
            size={19}
            className="mt-0.5 shrink-0 text-indigo-600"
          />

          <div>

            <p className="text-sm font-semibold text-indigo-900">
              Your settings are private
            </p>

            <p className="mt-1 text-xs leading-5 text-indigo-700/70">
              Your preferences are securely stored and associated
              with your RPMS account via the Oracle database.

            </p>

          </div>

        </div>

      </div>


      {/* =====================================================
          CHANGE PASSWORD MODAL
      ===================================================== */}
      {showChangePassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form
            onSubmit={handleChangePassword}
            className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6 shadow-xl"
          >
            <h2 className="text-xl font-bold text-slate-900">Change Password</h2>
            <p className="text-sm text-slate-500">
              You'll be signed out after this and need to log in again with your new password.
            </p>

            <div>
              <label htmlFor="current-password" className="label text-sm font-semibold text-slate-700">
                Current password
              </label>
              <input
                id="current-password"
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="input input-bordered w-full"
              />
            </div>

            <div>
              <label htmlFor="new-password" className="label text-sm font-semibold text-slate-700">
                New password
              </label>
              <input
                id="new-password"
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="input input-bordered w-full"
              />
              <p className="mt-1 text-xs text-slate-400">
                At least 8 characters, with uppercase, lowercase, a number and a special character.
              </p>
            </div>

            <div>
              <label htmlFor="confirm-new-password" className="label text-sm font-semibold text-slate-700">
                Confirm new password
              </label>
              <input
                id="confirm-new-password"
                type="password"
                required
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                className="input input-bordered w-full"
              />
            </div>

            {changePwdError && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                {changePwdError}
              </div>
            )}

            <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => { setShowChangePassword(false); setChangePwdError(''); setCurrentPassword(''); setNewPassword(''); setConfirmNewPassword('') }}
                className="btn btn-ghost"
              >
                Cancel
              </button>
              <button type="submit" disabled={isChangingPassword} className="btn btn-primary">
                {isChangingPassword ? 'Changing...' : 'Change Password'}
              </button>
            </div>
          </form>
        </div>
      )}


    </div>

  )
}

export default Settings