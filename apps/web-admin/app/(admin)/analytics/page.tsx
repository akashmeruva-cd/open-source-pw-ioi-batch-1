'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { Card, CardHeader } from '@repo/ui/card'
import { Skeleton } from '@repo/ui/skeleton'
import { EmptyState } from '@repo/ui/empty-state'
import { Button } from '@repo/ui/button'
import { useAuth } from '@/lib/auth-context'
import { useBatchAnalytics } from '@/features/analytics/hooks/use-batch-analytics'
import { StatCard } from '@/features/analytics/components/stat-card'
import { DistributionChart } from '@/features/analytics/components/distribution-chart'
import { SubjectTable } from '@/features/analytics/components/subject-table'
import { ExportButton } from '@/features/analytics/components/export-button'

/**
 * Owner: Team 12 — Admin Analytics & Reports.
 *
 * Batch dashboard — the analytics home screen. Shows:
 *   - KPI row: avg attendance, submission rate, avg marks, student count
 *   - Attendance distribution chart
 *   - Per-subject breakdown table
 *   - CSV export buttons
 *   - Link to at-risk report
 *
 * batchId comes from the URL query string (?batchId=...) so the page can be
 * bookmarked and shared. Defaults to the user's own batchId if present.
 */
export default function AnalyticsPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-5">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-32 w-full" />
        </div>
      }
    >
      <AnalyticsDashboard />
    </Suspense>
  )
}

function AnalyticsDashboard() {
  const { user } = useAuth()
  const params = useSearchParams()
  const batchId = params.get('batchId') ?? user?.batchId ?? null

  const { data, loading, error } = useBatchAnalytics(batchId)

  if (!batchId) {
    return (
      <div className="space-y-5">
        <PageHeader />
        <Card>
          <EmptyState
            title="No batch selected"
            description="Append ?batchId=<id> to the URL to load analytics for a specific batch."
          />
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-5">
        <PageHeader batchId={batchId} />
        <Card>
          <EmptyState
            title="Could not load analytics"
            description={error}
            action={
              <Button variant="secondary" size="sm" onClick={() => window.location.reload()}>
                Retry
              </Button>
            }
          />
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-fg">
            {loading ? <Skeleton className="inline-block h-6 w-48" /> : (data?.batchName ?? 'Analytics')}
          </h1>
          <p className="mt-0.5 text-sm text-fg-muted">Batch dashboard</p>
        </div>
        <Link
          href={`/analytics/at-risk${batchId ? `?batchId=${batchId}` : ''}`}
          className="flex-shrink-0"
        >
          <Button variant="primary" size="sm">
            At-risk report
          </Button>
        </Link>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          label="Avg attendance"
          value={data ? data.averageAttendancePercent.toFixed(1) : null}
          unit="%"
          tone={
            data
              ? data.averageAttendancePercent >= 75
                ? 'success'
                : data.averageAttendancePercent >= 50
                  ? 'warning'
                  : 'danger'
              : 'default'
          }
          loading={loading}
        />
        <StatCard
          label="Submission rate"
          value={data ? data.submissionRate.toFixed(1) : null}
          unit="%"
          tone={
            data
              ? data.submissionRate >= 75
                ? 'success'
                : data.submissionRate >= 50
                  ? 'warning'
                  : 'danger'
              : 'default'
          }
          loading={loading}
        />
        <StatCard
          label="Avg marks"
          value={data?.averageMarks !== null && data?.averageMarks !== undefined ? data.averageMarks.toFixed(1) : null}
          loading={loading}
        />
        <StatCard
          label="Students"
          value={data?.totalStudents ?? null}
          loading={loading}
        />
      </div>

      {/* Attendance distribution */}
      <Card>
        <CardHeader
          title="Attendance distribution"
          description="How students are spread across attendance bands"
        />
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        ) : data ? (
          <DistributionChart buckets={data.attendanceDistribution} />
        ) : null}
      </Card>

      {/* Subject breakdown */}
      <Card>
        <CardHeader
          title="Per-subject breakdown"
          description="Attendance, submission rate, and average marks by subject"
        />
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : data ? (
          <SubjectTable subjects={data.subjectBreakdown} />
        ) : null}
      </Card>

      {/* CSV exports */}
      <Card>
        <CardHeader
          title="Export data"
          description="Download CSV files that open correctly in Excel and Google Sheets"
        />
        <div className="flex flex-wrap gap-3">
          <ExportButton
            href={`/api/analytics/export/attendance.csv?batchId=${batchId}`}
            label="Attendance CSV"
            filename={`attendance-${batchId}.csv`}
          />
          <ExportButton
            href={`/api/analytics/export/grades.csv?batchId=${batchId}`}
            label="Grades CSV"
            filename={`grades-${batchId}.csv`}
          />
        </div>
      </Card>
    </div>
  )
}

function PageHeader({ batchId }: { batchId?: string | null }) {
  return (
    <div>
      <h1 className="text-xl font-semibold text-fg">Analytics</h1>
      {batchId && <p className="mt-0.5 text-sm text-fg-muted">Batch {batchId}</p>}
    </div>
  )
}
