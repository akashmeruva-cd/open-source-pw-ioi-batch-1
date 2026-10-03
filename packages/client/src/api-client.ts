import type { ApiError } from '@repo/validation/common'

/**
 * LOCKED FILE — Team 01 (Core Platform).
 *
 * The single way either frontend talks to its API. Feature teams import the
 * instance their app creates in `lib/api-client.ts`; they never call `fetch`
 * directly, because this is where the access token, the 401-refresh dance and
 * error normalisation live.
 *
 * ## Where the tokens live
 *
 * The access token is kept **in memory only**. It is deliberately not in
 * localStorage: anything readable by JavaScript is readable by an XSS payload.
 * The refresh token is an httpOnly cookie set by the API, so this code never
 * sees it — `credentials: 'include'` sends it automatically.
 *
 * The cost is that a hard refresh starts with no access token, which is why the
 * auth provider calls `/auth/refresh` on mount.
 */

export class ApiRequestError extends Error {
  readonly status: number
  readonly code: string
  readonly details?: unknown

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message)
    this.name = 'ApiRequestError'
    this.status = status
    this.code = code
    this.details = details
  }
}

async function toError(res: Response) {
  let body: ApiError | null = null
  try {
    body = (await res.json()) as ApiError
  } catch {
    // Non-JSON response (a proxy error page, usually).
  }
  return new ApiRequestError(
    res.status,
    body?.error?.code ?? 'UNKNOWN',
    body?.error?.message ?? res.statusText,
    body?.error?.details,
  )
}

export function createApiClient(baseUrl: string) {
  let accessToken: string | null = null

  function rawFetch(path: string, init: RequestInit) {
    return fetch(`${baseUrl}${path}`, {
      ...init,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...init.headers,
      },
    })
  }

  /** Attempts a silent token refresh. Returns true if a new token was obtained. */
  async function refreshAccessToken(): Promise<boolean> {
    try {
      const res = await fetch(`${baseUrl}/api/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      })
      if (!res.ok) {
        accessToken = null
        return false
      }
      const data = (await res.json()) as { accessToken: string }
      accessToken = data.accessToken
      return true
    } catch {
      accessToken = null
      return false
    }
  }

  async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
    let res = await rawFetch(path, init)

    // Access tokens last 15 minutes, so an open tab hits this constantly. Retry
    // once with a fresh token before giving up and bouncing the user to /login.
    if (res.status === 401 && !path.startsWith('/api/auth/')) {
      if (await refreshAccessToken()) {
        res = await rawFetch(path, init)
      }
    }

    if (!res.ok) throw await toError(res)
    if (res.status === 204) return undefined as T

    return (await res.json()) as T
  }

  return {
    refreshAccessToken,
    apiFetch,
    setAccessToken: (token: string | null) => {
      accessToken = token
    },
    getAccessToken: () => accessToken,
    get: <T>(path: string) => apiFetch<T>(path, { method: 'GET' }),
    post: <T>(path: string, body?: unknown) =>
      apiFetch<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
    patch: <T>(path: string, body?: unknown) =>
      apiFetch<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
    delete: <T>(path: string) => apiFetch<T>(path, { method: 'DELETE' }),
  }
}

export type ApiClient = ReturnType<typeof createApiClient>
