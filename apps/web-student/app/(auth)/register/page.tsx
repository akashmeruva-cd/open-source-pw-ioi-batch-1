'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@repo/ui/button'
import { Card } from '@repo/ui/card'
import { Input } from '@repo/ui/input'
import { registerSchema } from '@repo/validation/auth'
import { ApiRequestError } from '@/lib/api-client'
import { useAuth } from '@/lib/auth-context'

/** Owner: Team 03 — Auth & Identity. */
export default function RegisterPage() {
  const { register } = useAuth()
  const router = useRouter()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [fieldErrors, setFieldErrors] = useState<Record<string, string | undefined>>({})
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function update(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }))
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)

    // The same schema the API validates against — catching it here saves a
    // round trip and gives the student the error next to the field.
    const parsed = registerSchema.safeParse(form)
    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors
      setFieldErrors({
        name: flat.name?.[0],
        email: flat.email?.[0],
        password: flat.password?.[0],
      })
      return
    }

    setFieldErrors({})
    setSubmitting(true)
    try {
      await register(parsed.data.name, parsed.data.email, parsed.data.password)
      router.replace('/dashboard')
    } catch (err) {
      setError(
        err instanceof ApiRequestError ? err.message : 'Could not create the account. Try again.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card>
      <h1 className="text-lg font-semibold text-fg">Create your account</h1>
      <p className="mt-0.5 text-sm text-fg-muted">Your batch admin will assign your subjects.</p>

      <form onSubmit={onSubmit} className="mt-5 space-y-4" noValidate>
        <Input
          label="Full name"
          required
          value={form.name}
          onChange={update('name')}
          error={fieldErrors.name}
        />
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          required
          value={form.email}
          onChange={update('email')}
          error={fieldErrors.email}
        />
        <Input
          label="Password"
          type="password"
          autoComplete="new-password"
          required
          value={form.password}
          onChange={update('password')}
          error={fieldErrors.password}
          hint="At least 8 characters."
        />

        {error ? (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        ) : null}

        <Button type="submit" loading={submitting} className="w-full">
          Create account
        </Button>
      </form>

      <p className="mt-4 text-sm text-fg-muted">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-brand hover:underline">
          Sign in
        </Link>
      </p>
    </Card>
  )
}
