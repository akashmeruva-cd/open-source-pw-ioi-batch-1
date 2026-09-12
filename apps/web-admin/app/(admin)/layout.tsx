import type { ReactNode } from 'react'
import { Sidebar } from '@/components/nav/sidebar'

export default function AdminLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <div className="min-h-dvh bg-[#f7f7f5] text-[#171717]">
      <div className="flex min-h-dvh">
        <Sidebar />

        <main className="admin-grid min-w-0 flex-1 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  )
}