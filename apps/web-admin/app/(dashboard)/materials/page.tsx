import { MaterialAdminView } from '@/features/materials/components/material-admin-view'

export const metadata = {
  title: 'Class Materials Management | Admin Portal',
  description: 'Upload, manage, and distribute course materials for subjects.',
}

export default function AdminMaterialsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-fg tracking-tight">Class Materials</h1>
        <p className="text-sm text-fg-muted">
          Manage lecture slides, notes, and study resources for all courses.
        </p>
      </div>

      <MaterialAdminView />
    </div>
  )
}
