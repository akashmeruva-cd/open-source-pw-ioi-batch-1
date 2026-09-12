import { cn } from '@repo/ui/cn'

interface AttendanceBarProps {
  percent: number
  /** Show label alongside the bar. Default true. */
  showLabel?: boolean
  className?: string
}

/**
 * Owner: Team 12 — Admin Analytics & Reports.
 * A simple horizontal progress bar for attendance percentage.
 * Colour changes based on threshold:
 *   ≥75% → success, 50–74% → warning, <50% → danger
 */
export function AttendanceBar({ percent, showLabel = true, className }: AttendanceBarProps) {
  const clamped = Math.min(100, Math.max(0, percent))

  const barClass = cn({
    'bg-success': clamped >= 75,
    'bg-warning': clamped >= 50 && clamped < 75,
    'bg-danger': clamped < 50,
  })

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-3" aria-hidden="true">
        <div className={cn('h-full rounded-full transition-all', barClass)} style={{ width: `${clamped}%` }} />
      </div>
      {showLabel ? (
        <span className="w-12 text-right text-xs tabular-nums text-fg-muted">
          {clamped.toFixed(1)}%
        </span>
      ) : null}
    </div>
  )
}
