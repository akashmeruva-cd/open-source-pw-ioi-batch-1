import { MapPin } from 'lucide-react'
import type { DashboardSession } from './mock-data'

type SessionItemProps = {
  session: DashboardSession
}

export function SessionItem({
  session,
}: SessionItemProps) {
  return (
    <div className="px-5 py-5">
      <div className="flex items-start gap-3">
        {/* Time */}
        <div className="flex size-[40px] shrink-0 items-center justify-center rounded-[12px] bg-black/[0.065] font-mono text-[9px] font-semibold text-black/55">
          {session.timeLabel}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-[14px] font-semibold tracking-[-0.02em]">
                {session.title}
              </h3>

              <p className="mt-1.5 text-[11px] text-black/50">
                {session.startTime} – {session.endTime} ·{' '}
                {session.location}
              </p>

              <p className="mt-1.5 text-[11px] text-black/45">
                {session.faculty}
              </p>
            </div>

            <span className="shrink-0 rounded-full bg-black/[0.075] px-2.5 py-1 text-[9px] font-medium text-black/60">
              {session.type}
            </span>
          </div>

          {session.isNow && (
            <div className="mt-2 flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-emerald-600">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              Live
            </div>
          )}

          {!session.isNow && (
            <div className="mt-2 flex items-center gap-1.5 text-[10px] text-black/30">
              <MapPin
                className="size-3"
                strokeWidth={1.5}
              />
              {session.location}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}