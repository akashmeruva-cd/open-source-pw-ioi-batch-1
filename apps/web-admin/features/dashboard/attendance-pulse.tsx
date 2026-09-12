import { ArrowUpRight } from 'lucide-react'
import { mockAttendance } from './mock-data'

export function AttendancePulse() {
  const average = 92

  return (
    <section className="overflow-hidden rounded-[20px] border border-black/[0.09] bg-white">
      {/* Header */}
      <div className="border-b border-black/[0.08] px-5 py-5">
        <h2 className="text-[19px] font-semibold tracking-[-0.035em]">
          Attendance pulse
        </h2>

        <p className="mt-1.5 text-[12px] text-black/45">
          Across today&apos;s sessions
        </p>
      </div>

      {/* Main */}
      <div className="px-5 py-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="text-[52px] font-semibold leading-none tracking-[-0.065em]">
              {average}%
            </div>

            <p className="mt-2 text-[12px] text-black/45">
              average attendance
            </p>
          </div>

          <div className="flex items-center gap-1.5 rounded-full bg-black/[0.055] px-3 py-2 font-mono text-[10px] font-semibold text-black/55">
            <ArrowUpRight
              className="size-3"
              strokeWidth={1.8}
            />
            +4.8% this week
          </div>
        </div>

        {/* Chart */}
        <div className="mt-9 flex h-[145px] items-end gap-2">
          {mockAttendance.map((item) => {
            const isToday = item.day === 'Today'

            return (
              <div
                key={item.day}
                className="flex h-full flex-1 flex-col justify-end"
              >
                <div
                  className={[
                    'w-full rounded-t-[10px]',
                    isToday
                      ? 'bg-black'
                      : 'bg-black/[0.12]',
                  ].join(' ')}
                  style={{
                    height: `${Math.max(
                      25,
                      item.percentage * 0.72,
                    )}%`,
                  }}
                  title={`${item.percentage}% attendance`}
                />

                <span className="mt-3 text-center font-mono text-[9px] text-black/40">
                  {item.day}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}