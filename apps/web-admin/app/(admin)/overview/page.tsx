'use client'

import { Card, CardHeader } from '@repo/ui/card'
import { Badge } from '@repo/ui/badge'
import { Skeleton } from '@repo/ui/skeleton'
import { useAuth } from '@/lib/auth-context'
import { useBatches, useSubjects } from '@/features/batches/api'
import Link from 'next/link'

/**
 * Owner: Team 10 — Admin Core & Batch Management.
 *
 * Dashboard overview showing batch count, subject count, student count
 * and quick links into each management screen.
 */
export default function OverviewPage() {
  const { user } = useAuth()
  const { batches, loading: batchesLoading } = useBatches()
  const { subjects, loading: subjectsLoading } = useSubjects()

  const loading = batchesLoading || subjectsLoading

  const activeBatches = batches.filter((b) => b.isActive)
  const totalSubjects = subjects.length

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-semibold text-fg">Overview</h1>
        <p className="mt-0.5 text-sm text-fg-muted">
          Welcome back, {user?.name ?? user?.email}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          loading={loading}
          glyph="▤"
          label="Active Batches"
          value={activeBatches.length}
          href="/batches"
          tone="info"
        />
        <StatCard
          loading={loading}
          glyph="▦"
          label="Subjects"
          value={totalSubjects}
          href="/subjects"
          tone="success"
        />
        <StatCard
          loading={loading}
          glyph="▧"
          label="Total Batches"
          value={batches.length}
          href="/batches"
          tone="neutral"
        />
      </div>

      {/* Batch overview list */}
      <Card>
        <CardHeader
          title="Batch Summary"
          description="Active batches and their subject counts"
          action={
            <Link
              href="/batches"
              className="text-sm font-medium text-brand hover:text-brand-strong transition-colors"
            >
              View all →
            </Link>
          }
        />
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : activeBatches.length === 0 ? (
          <p className="py-8 text-center text-sm text-fg-muted">
            No active batches yet.{' '}
            <Link href="/batches" className="text-brand hover:underline">Create one →</Link>
          </p>
        ) : (
          <div className="divide-y divide-line rounded-lg border border-line overflow-hidden">
            {activeBatches.map((batch) => {
              const batchSubjects = subjects.filter((s) => s.batchId === batch._id)
              return (
                <div
                  key={batch._id}
                  className="flex items-center justify-between gap-4 px-4 py-3 bg-surface hover:bg-surface-2 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-fg truncate">{batch.name}</p>
                    <p className="text-xs text-fg-muted">
                      {batch.program} · {batch.year}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge tone="info">{batchSubjects.length} subjects</Badge>
                    <Badge tone={batch.isActive ? 'success' : 'neutral'}>
                      {batch.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {/* Recent subjects */}
      <Card>
        <CardHeader
          title="Recent Subjects"
          description="Last added subjects across all batches"
          action={
            <Link
              href="/subjects"
              className="text-sm font-medium text-brand hover:text-brand-strong transition-colors"
            >
              View all →
            </Link>
          }
        />
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : subjects.length === 0 ? (
          <p className="py-8 text-center text-sm text-fg-muted">
            No subjects yet.{' '}
            <Link href="/subjects" className="text-brand hover:underline">Create one →</Link>
          </p>
        ) : (
          <div className="divide-y divide-line rounded-lg border border-line overflow-hidden">
            {subjects.slice(0, 5).map((subject) => {
              const batch = batches.find((b) => b._id === subject.batchId)
              return (
                <div
                  key={subject._id}
                  className="flex items-center justify-between gap-4 px-4 py-3 bg-surface hover:bg-surface-2 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-fg truncate">
                      {subject.name}
                      <span className="ml-2 font-mono text-xs text-fg-subtle">{subject.code}</span>
                    </p>
                    <p className="text-xs text-fg-muted">
                      {batch?.name ?? 'Unknown batch'} · {subject.credits} credits
                    </p>
                  </div>
                  <div className="shrink-0">
                    {subject.facultyId ? (
                      <span className="text-xs text-fg-muted">{subject.facultyId.name}</span>
                    ) : (
                      <Badge tone="warning">Unassigned</Badge>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}

function StatCard({
  loading,
  glyph,
  label,
  value,
  href,
  tone,
}: {
  loading: boolean
  glyph: string
  label: string
  value: number
  href: string
  tone: 'info' | 'success' | 'neutral'
}) {
  const bgMap = {
    info: 'bg-brand/8',
    success: 'bg-success/8',
    neutral: 'bg-surface-3',
  }

  return (
    <Link href={href} className="group">
      <Card className="flex items-center gap-4 transition-shadow group-hover:shadow-md">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-lg ${bgMap[tone]}`}>
          {glyph}
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-fg-muted">{label}</p>
          {loading ? (
            <Skeleton className="mt-1 h-6 w-12" />
          ) : (
            <p className="text-2xl font-bold text-fg">{value}</p>
          )}
        </div>
      </Card>
    </Link>
  )
}
