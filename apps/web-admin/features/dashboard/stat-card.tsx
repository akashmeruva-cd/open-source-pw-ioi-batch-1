'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'

type StatCardProps = {
  label: string
  value: number | string
  description: string
  icon: ReactNode
  href?: string
  loading?: boolean
}

export function StatCard({
  label,
  value,
  description,
  icon,
  href,
  loading = false,
}: StatCardProps) {
  const card = (
    <div
      className={[
        'relative h-[160px] overflow-hidden rounded-[20px]',
        'border border-black/[0.09] bg-white',
        'px-6 py-6',
        'transition-all duration-200',
        href
          ? 'hover:-translate-y-0.5 hover:border-black/[0.15] hover:shadow-[0_10px_25px_rgba(0,0,0,0.06)]'
          : '',
      ].join(' ')}
    >
      <div className="flex items-start justify-between">
        <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-black/50">
          {label}
        </p>

        <div className="flex size-[44px] items-center justify-center rounded-[15px] bg-black/[0.07] text-black/65">
          {icon}
        </div>
      </div>

      {loading ? (
        <div className="mt-7">
          <div className="h-10 w-20 animate-pulse rounded-lg bg-black/[0.06]" />
          <div className="mt-2 h-3 w-28 animate-pulse rounded bg-black/[0.045]" />
        </div>
      ) : (
        <div className="absolute bottom-6 left-6">
          <div className="text-[52px] font-semibold leading-none tracking-[-0.065em]">
            {value}
          </div>

          <p className="mt-3 text-[12px] text-black/45">
            {description}
          </p>
        </div>
      )}
    </div>
  )

  if (!href) {
    return card
  }

  return (
    <Link
      href={href}
      className="block outline-none focus-visible:ring-2 focus-visible:ring-black/30 focus-visible:ring-offset-2"
    >
      {card}
    </Link>
  )
}