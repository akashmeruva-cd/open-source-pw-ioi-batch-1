import { MaterialsManager } from '@/features/materials/materials-manager'

/** Owner: Team 04 — Class Materials. */

export const metadata = {
  title: 'Materials Management | Admin Portal',
  description: 'Upload and manage class materials for faculty and admins.',
}

export default function MaterialsAdminPage() {
  return <MaterialsManager />
}
