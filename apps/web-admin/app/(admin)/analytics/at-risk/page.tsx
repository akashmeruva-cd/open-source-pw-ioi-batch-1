'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'
import { Card, CardHeader } from '@repo/ui/card'
import { Skeleton } from '@repo/ui/skeleton'
import { Badge } from '@repo/ui/badge'
import { Button } from '@repo/ui/button'
import { EmptyState } from '@repo/ui/empty-state'
import { useAuth } from '@/lib/auth-context'
import { useAtRisk } from '@/features/analytics/hooks/use-at-risk'
import { AtRiskTable } from '@/features/analytics/components/at-risk-table'
import { ExportButton } from '@/features/analytics/components/export-button'

/**
 * Owner: Team 12 — Admin Analytics & Reports.
 *
 * At-risk report — the most important screen in the admin portal.
 * Faculty need to know which students need a conversation this week.
 *
 * Features:
 *   - Threshold slider (default 75%)
 *   - Sortable, filterable at-risk table (see AtRiskTable component)
 *   - CSV export of the at-risk list
 *   - Link back to batch dashboard
 */
export default function AtRiskPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-5">
          <Skeleton className="h-7 w-64" />
          <Skeleton className="h-64 w-full" />
        </div>
      }
    >
      <AtRiskReport />
    </Suspense>
  )
}

function AtRiskReport() {
  const { user } = useAuth()
  const params = useSearchParams()
  const batchId = params.get('batchId') ?? user?.batchId ?? null

  const [threshold, setThreshold] = useState(75)

  const { data, loading, error } = useAtRisk(batchId, threshold)

  const atRiskCount = data?.students.length ?? 0

  if (!batchId) {
    return (
      <div className="space-y-5">
        <BackLink />
        <h1 className="text-xl font-semibold text-fg">At-risk students</h1>
        <Card>
          <EmptyState
            title="No batch selected"
            description="Append ?batchId=<id> to the URL, or navigate from the batch dashboard."
          />
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <BackLink batchId={batchId} />
        <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-fg">At-risk students</h1>
            <p className="mt-0.5 text-sm text-fg-muted">
              Students below the {threshold}% attendance threshold
            </p>
          </div>
          {!loading && data && atRiskCount > 0 && (
            <ExportButton
              href={`/api/analytics/at-risk?batchId=${batchId}&threshold=${threshold}`}
              label="Export list (CSV)"
              filename={`at-risk-${batchId}-t${threshold}.csv`}
            />
          )}
        </div>
      </div>

      {/* Threshold control */}
      <Card>
        <div className="flex flex-wrap items-center gap-4">
          <label htmlFor="threshold" className="text-sm font-medium text-fg">
            Attendance threshold
          </label>
          <div className="flex items-center gap-3">
            <input
              id="threshold"
              type="range"
              min={0}
              max={100}
              step={5}
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              className="h-2 w-40 cursor-pointer accent-brand"
              aria-label={`Threshold: ${threshold}%`}
            />
            <span className="w-12 text-right text-sm font-semibold tabular-nums text-fg">
              {threshold}%
            </span>
          </div>
          {!loading && data && (
            <Badge tone={atRiskCount > 0 ? 'danger' : 'success'}>
              {atRiskCount} student{atRiskCount !== 1 ? 's' : ''} at risk
            </Badge>
          )}
        </div>
      </Card>

      {/* At-risk table */}
      <Card>
        <CardHeader
          title="Students needing attention"
          description={`Sorted by attendance percentage (lowest first). Generated ${data ? new Date(data.generatedAt).toLocaleString() : '—'}`}
        />

        {loading ? (
          <LoadingSkeleton />
        ) : error ? (
          <EmptyState
            title="Could not load at-risk data"
            description={error}
            action={
              <Button variant="secondary" size="sm" onClick={() => window.location.reload()}>
                Retry
              </Button>
            }
          />
        ) : data ? (
          <AtRiskTable students={data.students} threshold={threshold} />
        ) : null}
      </Card>
    </div>
  )
}

function BackLink({ batchId }: { batchId?: string | null }) {
  return (
    <Link
      href={`/analytics${batchId ? `?batchId=${batchId}` : ''}`}
      className="text-sm text-brand hover:underline"
    >
      ← Batch dashboard
    </Link>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-9 w-72" />
      {[1, 2, 3, 4, 5].map((i) => (
        <Skeleton key={i} className="h-14 w-full" />
      ))}
    </div>
  )
}
