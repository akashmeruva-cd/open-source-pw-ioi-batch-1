'use client'

import Link from 'next/link'
import {
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  Users,
} from 'lucide-react'

import type {
  Batch,
  Subject,
} from '@/features/batches/api'

type ActiveBatchesProps = {
  batches: Batch[]
  subjects: Subject[]
  loading: boolean
}

export function ActiveBatches({
  batches,
  subjects,
  loading,
}: ActiveBatchesProps) {
  const activeBatches = batches.filter(
    (batch) => batch.isActive,
  )

  return (
    <section className="overflow-hidden rounded-[20px] border border-black/[0.09] bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-black/[0.08] px-6 py-5">
        <div>
          <h2 className="text-[19px] font-semibold tracking-[-0.035em]">
            Active Batches
          </h2>

          <p className="mt-1.5 text-[12px] text-black/45">
            Currently running academic batches
          </p>
        </div>

        <Link
          href="/batches"
          className="group flex items-center gap-2 font-mono text-[9px] font-semibold uppercase tracking-[0.17em] text-black/50 transition-colors hover:text-black"
        >
          View all

          <ArrowUpRight
            className="size-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            strokeWidth={1.8}
          />
        </Link>
      </div>

      {/* Loading */}
      {loading && (
        <div className="divide-y divide-black/[0.08]">
          {[1, 2].map((item) => (
            <div
              key={item}
              className="animate-pulse px-6 py-6"
            >
              <div className="flex gap-4">
                <div className="size-[45px] rounded-[14px] bg-black/[0.07]" />

                <div className="flex-1">
                  <div className="h-4 w-32 rounded bg-black/[0.07]" />

                  <div className="mt-2 h-3 w-64 rounded bg-black/[0.05]" />

                  <div className="mt-5 h-3 w-80 rounded bg-black/[0.05]" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && activeBatches.length === 0 && (
        <div className="flex min-h-[300px] flex-col items-center justify-center px-6 text-center">
          <div className="flex size-12 items-center justify-center rounded-[14px] bg-black/[0.06]">
            <BookOpen
              className="size-5 text-black/30"
              strokeWidth={1.5}
            />
          </div>

          <h3 className="mt-4 text-[14px] font-semibold">
            No active batches
          </h3>

          <p className="mt-2 max-w-xs text-[11px] leading-5 text-black/35">
            Create a batch to start managing students
            and subjects.
          </p>

          <Link
            href="/batches"
            className="mt-5 rounded-[10px] bg-black px-4 py-2.5 text-[10px] font-semibold text-white"
          >
            Create Batch
          </Link>
        </div>
      )}

      {/* Batches */}
      {!loading && activeBatches.length > 0 && (
        <div className="divide-y divide-black/[0.08]">
          {activeBatches.slice(0, 4).map((batch) => {
            const batchSubjects = subjects.filter(
              (subject: Subject) =>
                subject.batchId === batch._id,
            )

            return (
              <div
                key={batch._id}
                className="px-6 py-5 transition-colors hover:bg-black/[0.012]"
              >
                <div className="flex items-start justify-between gap-5">
                  <div className="flex min-w-0 gap-4">
                    {/* Batch initial */}
                    <div className="flex size-[45px] shrink-0 items-center justify-center rounded-[14px] bg-black text-[18px] font-semibold text-white">
                      {batch.name
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    {/* Batch details */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-[16px] font-semibold tracking-[-0.025em]">
                          {batch.name}
                        </h3>

                        <span className="rounded-full bg-black/[0.08] px-2.5 py-1 text-[9px] font-semibold text-black/60">
                          Active
                        </span>
                      </div>

                      <p className="mt-1 text-[13px] text-black/45">
                        {batch.program} · {batch.year}–
                        {batch.year + 1}
                      </p>

                      {/* Metrics */}
                      <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2">
                        <span className="flex items-center gap-1.5 text-[11px] text-black/50">
                          <Users
                            className="size-[15px]"
                            strokeWidth={1.5}
                          />

                          40 Students
                        </span>

                        <span className="flex items-center gap-1.5 text-[11px] text-black/50">
                          <BookOpen
                            className="size-[15px]"
                            strokeWidth={1.5}
                          />

                          {batchSubjects.length} Subjects
                        </span>

                        <span className="flex items-center gap-1.5 text-[11px] text-black/50">
                          <Users
                            className="size-[15px]"
                            strokeWidth={1.5}
                          />

                          {batchSubjects.length} Faculty
                        </span>

                        <span className="flex items-center gap-1.5 text-[11px] text-black/50">
                          <CalendarDays
                            className="size-[15px]"
                            strokeWidth={1.5}
                          />

                          Today&apos;s Sessions: 4
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* View batch */}
                  <Link
                    href="/batches"
                    className="hidden shrink-0 items-center gap-2 rounded-[11px] border border-black/[0.15] px-4 py-2.5 text-[11px] font-medium transition-colors hover:bg-black hover:text-white sm:flex"
                  >
                    View batch

                    <ArrowUpRight
                      className="size-3.5"
                      strokeWidth={1.8}
                    />
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-black/[0.08] bg-[#fafaf8] px-6 py-3.5">
        <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-black/30">
          {activeBatches.length} active
        </span>

        <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-black/30">
          {subjects.length} subjects
        </span>
      </div>
    </section>
  )
}