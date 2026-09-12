import { cn } from '@repo/ui/cn'
import type { SubjectSummary } from '@repo/validation/analytics'
import { AttendanceBar } from './attendance-bar'

interface SubjectTableProps {
  subjects: SubjectSummary[]
}

/**
 * Owner: Team 12 — Admin Analytics & Reports.
 * Per-subject breakdown table for the batch dashboard.
 */
export function SubjectTable({ subjects }: SubjectTableProps) {
  if (subjects.length === 0) {
    return <p className="text-sm text-fg-muted">No subject data available.</p>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-line text-left text-xs font-medium uppercase tracking-wide text-fg-subtle">
            <th className="py-2 pr-4">Subject</th>
            <th className="py-2 pr-4">Attendance</th>
            <th className="py-2 pr-4">Submission rate</th>
            <th className="py-2 pr-4 text-right">Avg marks</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {subjects.map((s) => (
            <tr key={s.subjectId} className="group">
              <td className="py-3 pr-4">
                <span className="font-medium text-fg">{s.subjectName}</span>
                <span className="ml-2 text-xs text-fg-subtle">{s.subjectCode}</span>
              </td>
              <td className="py-3 pr-4 min-w-[160px]">
                <AttendanceBar percent={s.averageAttendancePercent} />
              </td>
              <td className="py-3 pr-4">
                <span
                  className={cn('tabular-nums', {
                    'text-success': s.submissionRate >= 75,
                    'text-warning': s.submissionRate >= 50 && s.submissionRate < 75,
                    'text-danger': s.submissionRate < 50,
                  })}
                >
                  {s.submissionRate.toFixed(1)}%
                </span>
              </td>
              <td className="py-3 text-right tabular-nums text-fg-muted">
                {s.averageMarks !== null ? s.averageMarks.toFixed(1) : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
