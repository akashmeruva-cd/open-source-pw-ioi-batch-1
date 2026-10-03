'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { Skeleton } from '@repo/ui/skeleton'
import { Card } from '@repo/ui/card'
import { useAuth } from '@/lib/auth-context'
import type { Role } from '@repo/validation/enums'

/**
 * Team 03 (Auth & Identity).
 *
 * Protects pages or UI sections by checking if the logged-in user
 * has the required role.
 */
export function RequireRole({
  allowedRoles,
  children,
}: {
  allowedRoles: Role[]
  children: ReactNode
}) {
  const { status, user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (status === 'anonymous') router.replace('/login')
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="mx-auto max-w-5xl space-y-4 p-6" aria-busy="true">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  if (status === 'anonymous') {
    return null
  }

  if (!user || !allowedRoles.includes(user.role)) {
    return (
      <Card>
        <h1 className="text-lg font-semibold text-danger">Access Denied</h1>
        <p className="mt-2 text-sm text-fg-muted">
          You do not have the required permissions to view this page.
        </p>
      </Card>
    )
  }

  return <>{children}</>
}
