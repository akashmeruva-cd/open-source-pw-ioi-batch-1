'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Activity,
  BookOpen,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Settings,
  SlidersHorizontal,
  Users,
} from 'lucide-react'
import { useState } from 'react'

type NavItem = {
  label: string
  href: string
  icon: React.ComponentType<{
    className?: string
    strokeWidth?: number
  }>
  disabled?: boolean
  count?: string
}

const primaryNavigation: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/overview',
    icon: LayoutDashboard,
  },
  {
    label: 'Batches',
    href: '/batches',
    icon: GraduationCap,
  },
  {
    label: 'Enrollments',
    href: '#',
    icon: Users,
  },
  {
    label: 'Sessions',
    href: '#',
    icon: CalendarDays,
    count: '4',
  },
  {
    label: 'Attendance',
    href: '#',
    icon: Activity,
  },
  {
    label: 'Materials',
    href: '#',
    icon: BookOpen,
  },
  {
    label: 'Assignments',
    href: '#',
    icon: SlidersHorizontal,
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(true)

  return (
    <aside
      className={[
        'sticky top-0 z-40 flex h-dvh shrink-0 flex-col',
        'border-r border-black/[0.08] bg-[#e9e9e7]',
        'transition-[width] duration-200',
        collapsed ? 'w-[78px]' : 'w-[310px]',
      ].join(' ')}
    >
      {/* Brand */}
      <div
        className={[
          'flex h-[92px] shrink-0 items-center',
          collapsed
            ? 'justify-center'
            : 'justify-between px-8',
        ].join(' ')}
      >
        <Link
          href="/overview"
          className="flex items-center gap-3"
          aria-label="OrbitEdu"
        >
          <div className="flex size-[45px] shrink-0 items-center justify-center rounded-[15px] bg-black text-white shadow-[0_4px_12px_rgba(0,0,0,0.12)]">
            <span className="text-[18px] font-semibold tracking-[-0.08em]">
              O
            </span>
          </div>

          {!collapsed && (
            <div>
              <div className="text-[17px] font-semibold tracking-[-0.04em]">
                OrbitEdu
              </div>

              <div className="mt-0.5 text-[11px] text-black/45">
                Admin Console
              </div>
            </div>
          )}
        </Link>

        {!collapsed && (
          <button
            type="button"
            onClick={() => setCollapsed(true)}
            className="flex size-8 items-center justify-center rounded-lg text-black/35 hover:bg-black/[0.06] hover:text-black"
            aria-label="Collapse sidebar"
          >
            <ChevronLeft className="size-[17px]" />
          </button>
        )}
      </div>

      {/* Expand button when collapsed */}
      {collapsed && (
        <div className="flex justify-center pb-7">
          <button
            type="button"
            onClick={() => setCollapsed(false)}
            className="flex size-8 items-center justify-center rounded-lg text-black/35 transition-colors hover:bg-black/[0.06] hover:text-black"
            aria-label="Open sidebar"
            title="Open sidebar"
          >
            <ChevronRight
              className="size-[17px]"
              strokeWidth={1.7}
            />
          </button>
        </div>
      )}

      {/* Primary */}
      <div className="px-5">
        {!collapsed && (
          <div className="mb-3 px-2">
            <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.2em] text-black/45">
              Primary
            </span>
          </div>
        )}

        <nav className="space-y-1">
          {primaryNavigation.map((item) => {
            const Icon = item.icon

            const active =
              pathname === item.href ||
              pathname.startsWith(`${item.href}/`)

            return (
              <Link
                key={item.label}
                href={item.disabled ? '#' : item.href}
                onClick={(event) => {
                  if (item.disabled) {
                    event.preventDefault()
                  }
                }}
                className={[
                  'group flex h-[44px] items-center rounded-[13px] transition-all',
                  collapsed
                    ? 'justify-center px-3'
                    : 'gap-4 px-4',
                  item.disabled
                    ? 'cursor-not-allowed text-black/30'
                    : active
                      ? 'bg-black text-white shadow-[0_4px_12px_rgba(0,0,0,0.12)]'
                      : 'text-black/50 hover:bg-black/[0.055] hover:text-black',
                ].join(' ')}
                title={collapsed ? item.label : undefined}
              >
                <Icon
                  className="size-[18px] shrink-0"
                  strokeWidth={active ? 1.9 : 1.6}
                />

                {!collapsed && (
                  <>
                    <span className="text-[14px] font-medium">
                      {item.label}
                    </span>

                    {item.count && (
                      <span className="ml-auto font-mono text-[10px] text-black/35">
                        {item.count}
                      </span>
                    )}
                  </>
                )}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Workspace */}
      {!collapsed && (
        <>
          <div className="mx-5 my-6 h-px bg-black/[0.1]" />

          <div className="px-5">
            <div className="mb-3 px-2">
              <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.2em] text-black/45">
                Workspace
              </span>
            </div>

            <nav className="space-y-1">
              <button
                type="button"
                className="flex h-[44px] w-full items-center gap-4 rounded-[13px] px-4 text-black/45 hover:bg-black/[0.055] hover:text-black"
              >
                <Settings
                  className="size-[18px]"
                  strokeWidth={1.6}
                />

                <span className="text-[13px] font-medium">
                  Settings
                </span>
              </button>

              <button
                type="button"
                className="flex h-[44px] w-full items-center gap-4 rounded-[13px] px-4 text-black/45 hover:bg-black/[0.055] hover:text-black"
              >
                <LogOut
                  className="size-[18px]"
                  strokeWidth={1.6}
                />

                <span className="text-[13px] font-medium">
                  Logout
                </span>
              </button>
            </nav>
          </div>
        </>
      )}

      {/* Bottom */}
      <div className="mt-auto border-t border-black/[0.08] p-5">
        {!collapsed ? (
          <div className="flex items-center gap-3">
            <div className="flex size-[34px] items-center justify-center rounded-full bg-black/[0.08]">
              <span className="text-[10px] font-semibold">
                A
              </span>
            </div>

            <div>
              <p className="text-[11px] font-semibold">
                Admin
              </p>

              <p className="mt-0.5 text-[9px] text-black/35">
                Administrator
              </p>
            </div>

            <CircleHelp
              className="ml-auto size-[16px] text-black/30"
              strokeWidth={1.6}
            />
          </div>
        ) : (
          <div className="flex justify-center">
            <CircleHelp
              className="size-[18px] text-black/35"
              strokeWidth={1.6}
            />
          </div>
        )}
      </div>
    </aside>
  )
}