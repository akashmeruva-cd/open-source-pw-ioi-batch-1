'use client'

import {
  ActiveBatches,
  AttendancePulse,
  DashboardHeader,
  DashboardStats,
  RecentActivity,
  TodaysSessions,
} from '@/features/dashboard'
import { useBatches, useSubjects } from '@/features/batches/api'

export default function OverviewPage() {
  const {
    batches,
    loading: batchesLoading,
  } = useBatches()

  const {
    subjects,
    loading: subjectsLoading,
  } = useSubjects()

  const loading = batchesLoading || subjectsLoading

  return (
    <main className="admin-grid min-h-full">
      <div className="mx-auto max-w-[1600px] space-y-6 px-4 py-7 sm:px-6 lg:px-10 lg:py-10">
        <DashboardHeader />

        <DashboardStats
          batches={batches}
          subjects={subjects}
          loading={loading}
        />

        <div className="grid gap-5 xl:grid-cols-[1.6fr_1fr]">
          <ActiveBatches
            batches={batches}
            subjects={subjects}
            loading={loading}
          />

          <TodaysSessions />
        </div>

        <div className="grid gap-5 xl:grid-cols-[1.6fr_1fr]">
          <RecentActivity />
          <AttendancePulse />
        </div>

        <footer className="flex flex-col gap-2 border-t border-line pt-5 text-xs text-fg-muted sm:flex-row sm:items-center sm:justify-between">
          <span className="font-mono uppercase tracking-[0.16em]">
            OrbitEdu LMS · Academic Operations
          </span>

          <span className="inline-flex items-center gap-2 font-mono uppercase tracking-[0.12em]">
            <span className="size-1.5 rounded-full bg-fg" />
            All systems operational ↗
          </span>
        </footer>
      </div>
    </main>
  )
}