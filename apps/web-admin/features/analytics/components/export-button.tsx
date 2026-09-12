'use client'

import { useState } from 'react'
import { Button } from '@repo/ui/button'

interface ExportButtonProps {
  /** The API path, e.g. /api/analytics/export/attendance.csv?batchId=... */
  href: string
  label: string
  filename: string
}

/**
 * Owner: Team 12 — Admin Analytics & Reports.
 *
 * Triggers a CSV download by fetching the export endpoint with the current
 * session token (via the api-client credentials). Uses a hidden <a> element
 * to trigger the browser's native "save file" dialog.
 *
 * Content-Disposition is set server-side — the filename prop here is a fallback.
 */
export function ExportButton({ href, label, filename }: ExportButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleDownload() {
    setLoading(true)
    setError(null)

    try {
      // Use native fetch with credentials so the httpOnly refresh cookie is sent.
      // The access token is passed via the Authorization header. Because we cannot
      // access the token from the locked api-client directly from here, we use the
      // standard credentials: 'include' path — on a 401 the user refreshes manually.
      const apiBase =
        process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4001'

      const res = await fetch(`${apiBase}${href}`, {
        credentials: 'include',
        headers: {
          // Next.js CSR can read the in-memory token only from the api-client
          // singleton. We expose a helper for this.
          ...getAuthHeader(),
        },
      })

      if (!res.ok) {
        const json = (await res.json().catch(() => null)) as { error?: { message?: string } } | null
        throw new Error(json?.error?.message ?? `Export failed (${res.status})`)
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <Button
        variant="secondary"
        size="sm"
        loading={loading}
        onClick={() => void handleDownload()}
      >
        ↓ {label}
      </Button>
      {error ? <p className="text-xs text-danger">{error}</p> : null}
    </div>
  )
}

/**
 * Reads the in-memory access token from the singleton api-client.
 * Returns an empty object if no token is set (e.g. during SSR or before refresh).
 */
function getAuthHeader(): Record<string, string> {
  // Import the api singleton — already initialised on the client at this point.
  // We use a dynamic approach to avoid a circular import at module load time.
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mod = (typeof window !== 'undefined' && (window as any).__apiClient) as
      | { getAccessToken: () => string | null }
      | undefined
    if (mod) {
      const token = mod.getAccessToken()
      if (token) return { Authorization: `Bearer ${token}` }
    }
  } catch {
    // Silently ignore — the request will still go through with the cookie.
  }
  return {}
}
