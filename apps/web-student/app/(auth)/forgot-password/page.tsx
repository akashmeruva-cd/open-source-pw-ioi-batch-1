'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Button } from '@repo/ui/button'
import { Card } from '@repo/ui/card'
import { Input } from '@repo/ui/input'
import { ApiRequestError, api } from '@/lib/api-client'

/** Owner: Team 03 — Auth & Identity. */
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    setSuccess(false)
    setSubmitting(true)

    try {
      await api.post('/api/auth/password-reset/request', { email })
      setSuccess(true)
    } catch (err) {
      setError(
        err instanceof ApiRequestError ? err.message : 'Could not request password reset. Please try again.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <Card>
        <h1 className="text-lg font-semibold text-fg">Check your email</h1>
        <p className="mt-2 text-sm text-fg-muted">
          If an account exists, you&apos;ll get an email with instructions to reset your password.
        </p>
        <div className="mt-5">
          <Link href="/login" className="font-medium text-brand hover:underline text-sm">
            Return to sign in
          </Link>
        </div>
      </Card>
    )
  }

  return (
    <Card>
      <h1 className="text-lg font-semibold text-fg">Reset password</h1>
      <p className="mt-0.5 text-sm text-fg-muted">Enter your email to receive a reset link.</p>

      <form onSubmit={onSubmit} className="mt-5 space-y-4">
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        {error ? (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        ) : null}

        <Button type="submit" loading={submitting} className="w-full">
          Send reset link
        </Button>
      </form>

      <p className="mt-4 text-sm text-fg-muted">
        Remembered your password?{' '}
        <Link href="/login" className="font-medium text-brand hover:underline">
          Sign in
        </Link>
      </p>
    </Card>
  )
}
