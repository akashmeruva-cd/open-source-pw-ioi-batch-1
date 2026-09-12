import {
  Check,
  GraduationCap,
  Plus,
  Upload,
} from 'lucide-react'

import type { DashboardActivity } from './mock-data'

type ActivityItemProps = {
  activity: DashboardActivity
}

export function ActivityItem({
  activity,
}: ActivityItemProps) {
  const icon = {
    import: Upload,
    subject: Plus,
    enrollment: GraduationCap,
    faculty: GraduationCap,
  }[activity.type]

  const Icon = icon

  return (
    <div className="flex items-center gap-4 px-6 py-4">
      <div className="flex size-[38px] shrink-0 items-center justify-center rounded-full bg-black/[0.06]">
        {activity.type === 'import' ? (
          <Icon
            className="size-[16px] text-black/45"
            strokeWidth={1.6}
          />
        ) : activity.type === 'subject' ? (
          <Icon
            className="size-[16px] text-black/45"
            strokeWidth={1.6}
          />
        ) : activity.type === 'enrollment' ? (
          <Check
            className="size-[16px] text-black/45"
            strokeWidth={1.8}
          />
        ) : (
          <Icon
            className="size-[16px] text-black/45"
            strokeWidth={1.6}
          />
        )}
      </div>

      <div className="min-w-0">
        <p className="text-[13px] leading-5 text-black/85">
          <span className="font-medium">
            {activity.title}
          </span>

          <span className="mx-1.5 text-black/25">
            —
          </span>

          <span className="text-black/55">
            {activity.description}
          </span>
        </p>

        <p className="mt-0.5 text-[10px] text-black/40">
          {activity.time}
        </p>
      </div>
    </div>
  )
}