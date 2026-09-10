/**
 * Single place where the frontend talks to the backend.
 *
 * Every page used to build its own fetch call, and several of them hardcoded
 * `http://localhost:5000`, which bypassed the Vite dev proxy and broke as soon
 * as the app was served from anywhere other than the developer's machine.
 * Requests now go to a relative `/api/...` path by default (proxied to the
 * backend by vite.config.js), and can be pointed at an absolute origin with
 * VITE_API_BASE_URL when the frontend and API are deployed separately.
 */

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '')

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

export async function apiRequest(path, { method = 'GET', body, token, signal } = {}) {
  const headers = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`

  let response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    })
  } catch (networkError) {
    if (networkError.name === 'AbortError') throw networkError
    throw new ApiError(
      'Cannot reach the server. Is the backend running on port 5000?',
      0,
      null,
    )
  }

  // The backend always answers with JSON, but a proxy error or a crash can
  // still return HTML - parsing defensively keeps the UI from throwing
  // "Unexpected token <" at the user.
  const raw = await response.text()
  let payload = null
  if (raw) {
    try {
      payload = JSON.parse(raw)
    } catch {
      throw new ApiError(`Unexpected response from server (${response.status})`, response.status, null)
    }
  }

  if (!response.ok || (payload && payload.success === false)) {
    throw new ApiError(
      (payload && payload.message) || `Request failed with status ${response.status}`,
      response.status,
      payload,
    )
  }

  return payload || { success: true, data: null }
}

export const apiGet = (path, token, options) => apiRequest(path, { ...options, method: 'GET', token })
export const apiPost = (path, body, token) => apiRequest(path, { method: 'POST', body, token })
export const apiPut = (path, body, token) => apiRequest(path, { method: 'PUT', body, token })
export const apiDelete = (path, token) => apiRequest(path, { method: 'DELETE', token })

/** Convenience: always hands back an array, never undefined. */
export const asList = (result) => (result && Array.isArray(result.data) ? result.data : [])
