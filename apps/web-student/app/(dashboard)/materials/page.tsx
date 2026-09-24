import { MaterialList } from '@/features/materials/components/material-list'

export const metadata = {
  title: 'Class Materials | Student Portal',
  description: 'View and download course slides, notes, PDFs, and resources for your enrolled subjects.',
}

export default function MaterialsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-fg tracking-tight">Class Materials</h1>
        <p className="text-sm text-fg-muted">
          Access lecture slides, notes, reference documents, and links for your enrolled subjects.
        </p>
      </div>

      <MaterialList />
    </div>
  )
}
