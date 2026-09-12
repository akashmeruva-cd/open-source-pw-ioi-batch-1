import { cn } from '@repo/ui/cn'
import type { AttendanceBucket } from '@repo/validation/analytics'

interface DistributionChartProps {
  buckets: AttendanceBucket[]
}

/**
 * Owner: Team 12 — Admin Analytics & Reports.
 *
 * A CSS-only bar chart for the attendance distribution buckets.
 * No external chart library needed — the chart library agreement with Team 09
 * is for more complex charts on the student portal side.
 *
 * Each bucket shows its label, bar (proportional to count), and count.
 * Accessible: bars have role="img" with aria-label describing the value.
 */
export function DistributionChart({ buckets }: DistributionChartProps) {
  const maxCount = Math.max(...buckets.map((b) => b.count), 1)
  const total = buckets.reduce((sum, b) => sum + b.count, 0)

  const bucketColors = ['bg-danger', 'bg-warning', 'bg-warning/70', 'bg-success']

  return (
    <div className="space-y-3" role="img" aria-label="Attendance distribution chart">
      {buckets.map((bucket, i) => {
        const pct = total > 0 ? Math.round((bucket.count / total) * 100) : 0
        const barWidth = maxCount > 0 ? (bucket.count / maxCount) * 100 : 0

        return (
          <div key={bucket.label} className="flex items-center gap-3">
            <span className="w-16 shrink-0 text-xs text-fg-muted">{bucket.label}</span>
            <div className="flex-1">
              <div className="h-5 overflow-hidden rounded-sm bg-surface-3">
                <div
                  className={cn('h-full rounded-sm transition-all duration-300', bucketColors[i])}
                  style={{ width: `${barWidth}%` }}
                  aria-label={`${bucket.count} students (${pct}%)`}
                />
              </div>
            </div>
            <span className="w-16 shrink-0 text-right text-xs tabular-nums text-fg-muted">
              {bucket.count} <span className="text-fg-subtle">({pct}%)</span>
            </span>
          </div>
        )
      })}
    </div>
  )
}
