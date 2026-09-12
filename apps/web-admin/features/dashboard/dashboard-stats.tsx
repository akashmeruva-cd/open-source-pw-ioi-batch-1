'use client'

import {
  BookOpen,
  CalendarDays,
  Layers3,
  Users,
} from 'lucide-react'

import type {
  Batch,
  Subject,
} from '@/features/batches/api'

import { StatCard } from './stat-card'

type DashboardStatsProps = {
  batches: Batch[]
  subjects: Subject[]
  loading: boolean
}

export function DashboardStats({
  batches,
  subjects,
  loading,
}: DashboardStatsProps) {
  const activeBatches = batches.filter(
    (batch) => batch.isActive,
  )

  /*
   * Student count and today's sessions will come from
   * their respective APIs later.
   *
   * Keeping the temporary values here lets the dashboard
   * match the reference UI without breaking the real
   * batches/subjects API integration.
   */
  const totalStudents = 40
  const todaysSessions = 4

  const cards = [
    {
      label: 'Total Students',
      value: totalStudents,
      description:
        activeBatches[0]?.name
          ? `in ${activeBatches[0].name}`
          : 'Across active batches',
      icon: (
        <Users
          className="size-[20px]"
          strokeWidth={1.6}
        />
      ),
    },
    {
      label: 'Active Batches',
      value: activeBatches.length,
      description:
        activeBatches[0]
          ? `${activeBatches[0].year}–${
              activeBatches[0].year + 1
            } academic year`
          : 'Currently running',
      icon: (
        <Layers3
          className="size-[20px]"
          strokeWidth={1.6}
        />
      ),
    },
    {
      label: 'Subjects',
      value: subjects.length,
      description:
        activeBatches[0]?.name
          ? `${activeBatches[0].name} curriculum`
          : 'Across all batches',
      icon: (
        <BookOpen
          className="size-[20px]"
          strokeWidth={1.6}
        />
      ),
    },
    {
      label: "Today's Sessions",
      value: todaysSessions,
      description: 'scheduled for today',
      icon: (
        <CalendarDays
          className="size-[20px]"
          strokeWidth={1.6}
        />
      ),
    },
  ]

  return (
    <section className="grid gap-4 xl:grid-cols-4">
      {cards.map((card) => (
        <StatCard
          key={card.label}
          label={card.label}
          value={card.value}
          description={card.description}
          icon={card.icon}
          loading={loading}
        />
      ))}
    </section>
  )
}