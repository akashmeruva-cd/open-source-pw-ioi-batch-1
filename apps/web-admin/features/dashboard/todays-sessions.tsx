import Link from 'next/link'
import { ArrowRight, Clock3 } from 'lucide-react'
import { SessionItem } from './session-item'
import { mockSessions } from './mock-data'

export function TodaysSessions() {
  return (
    <section className="overflow-hidden rounded-[20px] border border-black/[0.09] bg-white">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-black/[0.08] px-5 py-5">
        <div>
          <div className="flex items-center gap-3">
            <Clock3
              className="size-[18px] text-black/55"
              strokeWidth={1.6}
            />

            <h2 className="text-[19px] font-semibold tracking-[-0.035em]">
              Today&apos;s Sessions
            </h2>
          </div>

          <p className="mt-2 text-[12px] text-black/45">
            Tuesday, 14 May
          </p>
        </div>

        <Link
          href="#"
          className="group mt-1 flex items-center gap-1.5 font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-black/45"
        >
          View schedule
          <ArrowRight
            className="size-3 transition-transform group-hover:translate-x-0.5"
            strokeWidth={1.7}
          />
        </Link>
      </div>

      {/* Sessions */}
      <div className="divide-y divide-black/[0.08]">
        {mockSessions.map((session) => (
          <SessionItem
            key={session.id}
            session={session}
          />
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-black/[0.08] bg-[#fafaf8] px-5 py-3.5">
        <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-black/30">
          {mockSessions.length} sessions scheduled
        </span>

        <span className="flex items-center gap-2 font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-black/40">
          <span className="size-1.5 rounded-full bg-emerald-500" />
          Live schedule
        </span>
      </div>
    </section>
  )
}