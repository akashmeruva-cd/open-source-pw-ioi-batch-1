'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@repo/ui/cn'
import type { Role } from '@repo/validation/enums'
import { navItems } from './items/registry'

/** LOCKED FILE — Team 02 (Design System). Add nav entries via `items/registry.ts`. */
export function Sidebar({ role }: { role: Role }) {
  const pathname = usePathname()
  const visible = navItems.filter((item) => !item.roles || item.roles.includes(role))

  return (
    <nav aria-label="Main" className="flex gap-1 overflow-x-auto md:flex-col md:overflow-visible">
      {visible.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
        return (
          <Link
            key={item.id}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              active ? 'bg-brand/10 text-brand' : 'text-fg-muted hover:bg-surface-2 hover:text-fg',
            )}
          >
            <span aria-hidden="true" className="text-xs">
              {item.glyph}
            </span>
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
