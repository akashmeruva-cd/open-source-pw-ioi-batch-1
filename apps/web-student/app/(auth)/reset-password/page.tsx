'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import { Button } from '@repo/ui/button'
import { Card } from '@repo/ui/card'
import { Input } from '@repo/ui/input'
import { supabase } from '@/lib/supabase'

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)
  const [hasValidSession, setHasValidSession] = useState(false)

  useEffect(() => {
    let mounted = true

    async function initRecoverySession() {
      // 1. Check if Supabase passed an error in the URL hash
      if (typeof window !== 'undefined' && window.location.hash) {
        const hash = window.location.hash.substring(1)
        const hashParams = new URLSearchParams(hash)
        const errorCode = hashParams.get('error_code')
        const errorDesc = hashParams.get('error_description')

        if (errorCode || errorDesc) {
          if (mounted) {
            const description = errorDesc
              ? decodeURIComponent(errorDesc.replace(/\+/g, ' '))
              : 'The reset link is invalid or has expired.'
            setError(description)
            setHasValidSession(false)
            setCheckingSession(false)
          }
          return
        }

        // Check if access_token is in hash
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')
        if (accessToken) {
          const { error: sessionErr } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || '',
          })
          if (!sessionErr && mounted) {
            setHasValidSession(true)
            setCheckingSession(false)
            return
          }
        }
      }

      // 2. Check for PKCE code in search params
      const code = searchParams.get('code')
      if (code) {
        const { error: exchangeErr } = await supabase.auth.exchangeCodeForSession(code)
        if (!exchangeErr && mounted) {
          setHasValidSession(true)
          setCheckingSession(false)
          return
        }
      }

      // 3. Check existing active session
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (mounted) {
        if (session) {
          setHasValidSession(true)
        } else {
          setHasValidSession(false)
        }
        setCheckingSession(false)
      }
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || (session && event === 'SIGNED_IN')) {
        if (mounted) {
          setHasValidSession(true)
          setCheckingSession(false)
          setError(null)
        }
      }
    })

    void initRecoverySession()

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [searchParams])

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.')
      return
    }

    if (confirmPassword && password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setSubmitting(true)

    try {
      const { error: updateError } = await supabase.auth.updateUser({ password })

      if (updateError) {
        setError(updateError.message)
        return
      }

      setSuccess(true)
      await supabase.auth.signOut()
      setTimeout(() => router.push('/login'), 2500)
    } catch {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <Card>
        <h1 className="text-lg font-semibold text-fg">Password updated</h1>
        <p className="mt-2 text-sm text-fg-muted">
          Your password has been changed successfully. Redirecting you to sign in...
        </p>
        <div className="mt-5">
          <Link href="/login" className="text-sm font-medium text-brand hover:underline">
            Go to sign in now
          </Link>
        </div>
      </Card>
    )
  }

  if (checkingSession) {
    return (
      <Card>
        <h1 className="text-lg font-semibold text-fg">Verifying reset link</h1>
        <p className="mt-2 text-sm text-fg-muted">Please wait while we verify your request...</p>
      </Card>
    )
  }

  if (!hasValidSession) {
    return (
      <Card>
        <h1 className="text-lg font-semibold text-fg">Invalid or Expired Link</h1>
        <p className="mt-2 text-sm text-danger">
          {error || 'The password reset link is invalid or has expired.'}
        </p>
        <p className="mt-2 text-sm text-fg-muted">
          Password reset links can only be used once and expire after a short time.
        </p>
        <div className="mt-5">
          <Link
            href="/forgot-password"
            className="inline-flex w-full items-center justify-center rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand/90"
          >
            Request a new reset link
          </Link>
        </div>
        <div className="mt-3 text-center">
          <Link href="/login" className="text-sm text-fg-muted hover:underline">
            Return to sign in
          </Link>
        </div>
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
          placeholder="At least 8 characters"
        />

        <Input
          label="Confirm Password"
          type="password"
          autoComplete="new-password"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Re-enter your password"
        />

        {error ? (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        ) : null}

        <Button type="submit" loading={submitting} className="w-full">
          Update password
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
