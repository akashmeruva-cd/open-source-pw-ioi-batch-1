'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@repo/ui/button'
import { Card } from '@repo/ui/card'
import { Input } from '@repo/ui/input'
import { ApiRequestError, api } from '@/lib/api-client'

/** Owner: Team 03 — Auth & Identity. */
function ResetPasswordForm() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const router = useRouter()

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!token) {
      setError('Invalid reset link.')
      return
    }
    setError(null)
    setSubmitting(true)

    try {
      await api.post('/api/auth/password-reset/confirm', { token, newPassword: password })
      setSuccess(true)
      setTimeout(() => router.push('/login'), 3000)
    } catch (err) {
      setError(
        err instanceof ApiRequestError ? err.message : 'Could not reset password. Please try again.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <Card>
        <h1 className="text-lg font-semibold text-fg">Password updated</h1>
        <p className="mt-2 text-sm text-fg-muted">
          Your password has been changed successfully. Redirecting to login...
        </p>
      </Card>
    )
  }

  return (
    <Card>
      <h1 className="text-lg font-semibold text-fg">Set new password</h1>
      <p className="mt-0.5 text-sm text-fg-muted">Enter your new password below.</p>

      <form onSubmit={onSubmit} className="mt-5 space-y-4">
        <Input
          label="New Password"
          type="password"
          autoComplete="new-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error ? (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        ) : null}

        <Button type="submit" loading={submitting} className="w-full">
          Reset password
        </Button>
      </form>
    </Card>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  )
}
