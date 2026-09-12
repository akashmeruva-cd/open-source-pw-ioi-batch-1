import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { ActivityItem } from './activity-item'
import { mockActivities } from './mock-data'

export function RecentActivity() {
  return (
    <section className="overflow-hidden rounded-[20px] border border-black/[0.09] bg-white">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-black/[0.08] px-6 py-5">
        <div>
          <h2 className="text-[19px] font-semibold tracking-[-0.035em]">
            Recent Activity
          </h2>

          <p className="mt-1.5 text-[12px] text-black/45">
            A quiet trail of what changed
          </p>
        </div>

        <Link
          href="#"
          className="group mt-1 flex items-center gap-1.5 font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-black/45"
        >
          Open activity
          <ArrowRight
            className="size-3 transition-transform group-hover:translate-x-0.5"
            strokeWidth={1.7}
          />
        </Link>
      </div>

      {/* Activity list */}
      <div className="divide-y divide-black/[0.08]">
        {mockActivities.map((activity) => (
          <ActivityItem
            key={activity.id}
            activity={activity}
          />
        ))}
      </div>
    </section>
  )
}