'use client'

import Link from 'next/link'
import { Plus } from 'lucide-react'

export function DashboardHeader() {
  return (
    <header className="flex items-end justify-between pb-2">
      <div>
        <div className="mb-3 flex items-center gap-2 font-mono text-[9px] font-bold uppercase tracking-[0.22em] text-black/45">
          <span>OrbitEdu</span>
          <span className="text-black/20">/</span>
          <span>Dashboard</span>
        </div>

        <h1 className="text-[42px] font-semibold leading-[1.02] tracking-[-0.06em] sm:text-[48px]">
          Good morning, Admin
        </h1>

        <p className="mt-3 text-[16px] text-black/50">
          Here&apos;s what&apos;s happening across your academic batches.
        </p>
      </div>

      <Link
        href="/batches"
        className="mb-1 flex h-[42px] items-center gap-2 rounded-[12px] bg-black px-5 text-[13px] font-semibold text-white shadow-[0_5px_14px_rgba(0,0,0,0.14)] transition-transform hover:-translate-y-0.5"
      >
        <Plus
          className="size-[17px]"
          strokeWidth={2}
        />
        Create Batch
      </Link>
    </header>
  )
}