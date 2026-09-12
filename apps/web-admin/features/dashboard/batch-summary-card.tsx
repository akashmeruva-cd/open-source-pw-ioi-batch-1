import Link from 'next/link'
import { ArrowUpRight, BookOpen, CalendarDays, Users } from 'lucide-react'
import { Badge } from '@repo/ui/badge'
import type { Batch, Subject } from '@/features/batches/api'

type BatchSummaryCardProps = {
  batch: Batch
  subjects: Subject[]
  studentCount?: number
  facultyCount?: number
  todaysSessions?: number
}

export function BatchSummaryCard({
  batch,
  subjects,
  studentCount = 40,
  facultyCount = 6,
  todaysSessions = 4,
}: BatchSummaryCardProps) {
  const batchSubjects = subjects.filter(
    (subject) => subject.batchId === batch._id,
  )

  return (
    <div className="group border-t border-line px-5 py-5 first:border-t-0 sm:px-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-black text-lg font-semibold text-white">
            {batch.name.charAt(0).toUpperCase()}
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-semibold text-fg">
                {batch.name}
              </h3>

              <Badge tone={batch.isActive ? 'success' : 'neutral'}>
                {batch.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>

            <p className="mt-1 text-sm text-fg-muted">
              {batch.program} · {batch.year}
              {batch.endDate ? `–${batch.endDate.slice(0, 4)}` : ''}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-fg-muted">
              <span className="inline-flex items-center gap-1.5">
                <Users className="size-4" />
                {studentCount} Students
              </span>

              <span className="inline-flex items-center gap-1.5">
                <BookOpen className="size-4" />
                {batchSubjects.length} Subjects
              </span>

              <span className="inline-flex items-center gap-1.5">
                <Users className="size-4" />
                {facultyCount} Faculty
              </span>

              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="size-4" />
                Today&apos;s Sessions: {todaysSessions}
              </span>
            </div>
          </div>
        </div>

        <Link
          href={`/batches/${batch._id}`}
          className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-line px-4 text-sm font-medium text-fg transition-colors hover:bg-surface-2"
        >
          View batch
          <ArrowUpRight className="size-4" />
        </Link>
      </div>
    </div>
  )
}