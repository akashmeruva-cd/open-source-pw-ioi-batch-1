'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { cn } from '@repo/ui/cn'
import { Badge } from '@repo/ui/badge'
import { EmptyState } from '@repo/ui/empty-state'
import type { AtRiskStudent } from '@repo/validation/analytics'
import { AttendanceBar } from './attendance-bar'

type SortKey = 'attendancePercent' | 'missedSubmissions' | 'trend' | 'name'
type SortDir = 'asc' | 'desc'

interface AtRiskTableProps {
  students: AtRiskStudent[]
  threshold: number
}

/**
 * Owner: Team 12 — Admin Analytics & Reports.
 *
 * Sortable, filterable at-risk student table.
 * Columns: Student, Attendance, Missed submissions, Trend, Avg marks
 * Row click → links to /students/:id (when Team 11's user screen ships)
 */
export function AtRiskTable({ students, threshold }: AtRiskTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('attendancePercent')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [search, setSearch] = useState('')

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir(key === 'attendancePercent' ? 'asc' : 'desc')
    }
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return students.filter(
      (s) => s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q),
    )
  }, [students, search])

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let diff = 0
      if (sortKey === 'attendancePercent') diff = a.attendancePercent - b.attendancePercent
      else if (sortKey === 'missedSubmissions') diff = a.missedSubmissions - b.missedSubmissions
      else if (sortKey === 'trend') diff = (a.trend ?? 0) - (b.trend ?? 0)
      else if (sortKey === 'name') diff = a.name.localeCompare(b.name)
      return sortDir === 'asc' ? diff : -diff
    })
  }, [filtered, sortKey, sortDir])

  if (students.length === 0) {
    return (
      <EmptyState
        title="No at-risk students"
        description={`All students are above the ${threshold}% attendance threshold.`}
      />
    )
  }

  return (
    <div className="space-y-3">
      {/* Search filter */}
      <div className="flex items-center gap-2">
        <input
          type="search"
          placeholder="Filter by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={cn(
            'h-9 w-full max-w-xs rounded-lg border border-line bg-surface px-3 text-sm',
            'placeholder:text-fg-subtle focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand',
          )}
          aria-label="Filter students"
        />
        <span className="text-sm text-fg-muted">
          {sorted.length} of {students.length} students
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-line">
        <table className="w-full text-sm">
          <thead className="border-b border-line bg-surface-2">
            <tr>
              <SortHeader label="Student" sortKey="name" current={sortKey} dir={sortDir} onSort={handleSort} />
              <SortHeader
                label="Attendance"
                sortKey="attendancePercent"
                current={sortKey}
                dir={sortDir}
                onSort={handleSort}
              />
              <SortHeader
                label="Missed"
                sortKey="missedSubmissions"
                current={sortKey}
                dir={sortDir}
                onSort={handleSort}
              />
              <SortHeader
                label="Trend"
                sortKey="trend"
                current={sortKey}
                dir={sortDir}
                onSort={handleSort}
              />
              <th className="px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wide text-fg-subtle">
                Avg marks
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line bg-surface">
            {sorted.map((student) => (
              <tr
                key={student.studentId}
                className="group transition-colors hover:bg-surface-2"
              >
                {/* Student info */}
                <td className="px-4 py-3">
                  <Link
                    href={`/students/${student.studentId}`}
                    className="group-hover:underline"
                    aria-label={`View ${student.name}'s profile`}
                  >
                    <p className="font-medium text-fg">{student.name}</p>
                    <p className="text-xs text-fg-subtle">{student.email}</p>
                  </Link>
                </td>

                {/* Attendance */}
                <td className="px-4 py-3 min-w-[180px]">
                  <AttendanceBar percent={student.attendancePercent} />
                  <p className="mt-0.5 text-xs text-fg-subtle">
                    {student.presentCount} / {student.totalSessions} sessions
                  </p>
                </td>

                {/* Missed submissions */}
                <td className="px-4 py-3 text-center">
                  {student.missedSubmissions > 0 ? (
                    <Badge tone="danger" className="tabular-nums">
                      {student.missedSubmissions}/{student.totalAssignments}
                    </Badge>
                  ) : (
                    <Badge tone="success">0/{student.totalAssignments}</Badge>
                  )}
                </td>

                {/* Trend */}
                <td className="px-4 py-3 text-center">
                  <TrendIndicator trend={student.trend} />
                </td>

                {/* Avg marks */}
                <td className="px-4 py-3 text-right tabular-nums text-fg-muted">
                  {student.averageMarks !== null ? student.averageMarks.toFixed(1) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SortHeader({
  label,
  sortKey,
  current,
  dir,
  onSort,
}: {
  label: string
  sortKey: SortKey
  current: SortKey
  dir: SortDir
  onSort: (key: SortKey) => void
}) {
  const active = current === sortKey
  const ariaSort = active ? (dir === 'asc' ? 'ascending' : 'descending') : 'none'
  return (
    <th
      className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-fg-subtle"
      aria-sort={ariaSort}
    >
      <button
        onClick={() => onSort(sortKey)}
        className={cn(
          'flex items-center gap-1 hover:text-fg',
          active && 'text-fg',
        )}
      >
        {label}
        <span aria-hidden="true" className="text-[10px]">
          {active ? (dir === 'asc' ? '↑' : '↓') : '↕'}
        </span>
      </button>
    </th>
  )
}

function TrendIndicator({ trend }: { trend: number | null }) {
  if (trend === null) {
    return <span className="text-xs text-fg-subtle" title="Insufficient data">—</span>
  }
  if (trend > 5) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-success" title={`+${trend}% trend`}>
        ↑ <span className="tabular-nums">+{trend.toFixed(1)}%</span>
      </span>
    )
  }
  if (trend < -5) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-danger" title={`${trend}% trend`}>
        ↓ <span className="tabular-nums">{trend.toFixed(1)}%</span>
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs text-fg-muted" title="Stable">
      → <span className="tabular-nums">{trend > 0 ? '+' : ''}{trend.toFixed(1)}%</span>
    </span>
  )
}
