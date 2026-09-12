import { cn } from '@repo/ui/cn'
import { Skeleton } from '@repo/ui/skeleton'

interface StatCardProps {
  label: string
  value: string | number | null
  unit?: string
  tone?: 'default' | 'success' | 'warning' | 'danger'
  loading?: boolean
}

/**
 * Owner: Team 12 — Admin Analytics & Reports.
 * A single KPI card: label + big number + optional unit.
 */
export function StatCard({ label, value, unit, tone = 'default', loading }: StatCardProps) {
  const valueClass = cn('text-2xl font-bold', {
    'text-fg': tone === 'default',
    'text-success': tone === 'success',
    'text-warning': tone === 'warning',
    'text-danger': tone === 'danger',
  })

  return (
    <div className="rounded-xl border border-line bg-surface p-5 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-fg-subtle">{label}</p>
      {loading ? (
        <Skeleton className="mt-2 h-8 w-24" />
      ) : (
        <p className={cn('mt-2', valueClass)}>
          {value ?? '—'}
          {unit && value !== null ? (
            <span className="ml-0.5 text-sm font-normal text-fg-muted">{unit}</span>
          ) : null}
        </p>
      )}
    </div>
  )
}
