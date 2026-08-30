import { cn } from './cn'

/** Loading placeholder. Match the shape of the content it stands in for. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn('animate-pulse rounded-md bg-surface-3', className)} aria-hidden="true" />
  )
}
