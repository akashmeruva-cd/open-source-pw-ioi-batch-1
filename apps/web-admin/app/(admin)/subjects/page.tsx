'use client'

import { useState } from 'react'
import { Card, CardHeader } from '@repo/ui/card'
import { Button } from '@repo/ui/button'
import { Badge } from '@repo/ui/badge'
import { Skeleton } from '@repo/ui/skeleton'
import { EmptyState } from '@repo/ui/empty-state'
import { useBatches, useSubjects, deleteSubject, type Subject } from '@/features/batches/api'
import { SubjectFormModal } from '@/features/batches/subject-form-modal'

/**
 * Owner: Team 10 — Admin Core & Batch Management.
 *
 * Full CRUD list view for subjects with create/edit modal and faculty assignment.
 */
export default function SubjectsPage() {
  const { batches, loading: batchesLoading } = useBatches()
  const { subjects, loading: subjectsLoading, error, refetch } = useSubjects()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Subject | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [filterBatch, setFilterBatch] = useState<string>('')

  const loading = batchesLoading || subjectsLoading

  const filteredSubjects = filterBatch
    ? subjects.filter((s) => s.batchId === filterBatch)
    : subjects

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure? A subject with existing enrollments, materials, sessions, or assignments cannot be deleted.')) return
    setDeleting(id)
    try {
      await deleteSubject(id)
      void refetch()
    } catch (err: any) {
      alert(err.message ?? 'Failed to delete subject')
    } finally {
      setDeleting(null)
    }
  }

  const handleEdit = (subject: Subject) => {
    setEditing(subject)
    setFormOpen(true)
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-fg">Subjects</h1>
          <p className="mt-0.5 text-sm text-fg-muted">Manage subjects and faculty assignments</p>
        </div>
        <Button size="sm" onClick={() => { setEditing(null); setFormOpen(true) }}>
          + New Subject
        </Button>
      </div>

      {/* Filter bar */}
      {batches.length > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-fg-muted">Filter by batch:</span>
          <select
            value={filterBatch}
            onChange={(e) => setFilterBatch(e.target.value)}
            className="h-8 rounded-lg border border-line bg-surface px-2.5 text-xs text-fg focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand"
          >
            <option value="">All batches</option>
            {batches.map((b) => (
              <option key={b._id} value={b._id}>{b.name} ({b.year})</option>
            ))}
          </select>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : filteredSubjects.length === 0 ? (
        <Card>
          <EmptyState
            title={filterBatch ? 'No subjects in this batch' : 'No subjects yet'}
            description={filterBatch ? 'Try selecting a different batch or create a new subject.' : 'Create your first subject to start building your curriculum.'}
            action={
              <Button size="sm" onClick={() => { setEditing(null); setFormOpen(true) }}>
                + Create Subject
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="overflow-hidden rounded-xl border border-line">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line bg-surface-2">
                <th className="px-4 py-2.5 text-left font-medium text-fg-muted">Code</th>
                <th className="px-4 py-2.5 text-left font-medium text-fg-muted">Name</th>
                <th className="px-4 py-2.5 text-left font-medium text-fg-muted hidden sm:table-cell">Batch</th>
                <th className="px-4 py-2.5 text-left font-medium text-fg-muted hidden md:table-cell">Faculty</th>
                <th className="px-4 py-2.5 text-center font-medium text-fg-muted">Credits</th>
                <th className="px-4 py-2.5 text-right font-medium text-fg-muted">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filteredSubjects.map((subject) => {
                const batch = batches.find((b) => b._id === subject.batchId)
                return (
                  <tr key={subject._id} className="group bg-surface hover:bg-surface-2 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs font-semibold text-brand">{subject.code}</span>
                    </td>
                    <td className="px-4 py-3 font-medium text-fg">{subject.name}</td>
                    <td className="px-4 py-3 text-fg-muted hidden sm:table-cell">
                      {batch?.name ?? '—'}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {subject.facultyId ? (
                        <span className="text-fg-muted">{subject.facultyId.name}</span>
                      ) : (
                        <Badge tone="warning">Unassigned</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center text-fg-muted">{subject.credits}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(subject)}>
                          Edit
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          loading={deleting === subject._id}
                          onClick={() => void handleDelete(subject._id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {formOpen && (
        <SubjectFormModal
          open={formOpen}
          onClose={() => { setFormOpen(false); setEditing(null) }}
          onSuccess={() => void refetch()}
          batches={batches}
          editing={editing}
        />
      )}
    </div>
  )
}
