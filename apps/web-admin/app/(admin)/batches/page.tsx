'use client'

import { useState } from 'react'
import { Card, CardHeader } from '@repo/ui/card'
import { Button } from '@repo/ui/button'
import { Badge } from '@repo/ui/badge'
import { Skeleton } from '@repo/ui/skeleton'
import { EmptyState } from '@repo/ui/empty-state'
import { useBatches, deleteBatch, type Batch } from '@/features/batches/api'
import { BatchFormModal } from '@/features/batches/batch-form-modal'
import { CsvImportModal } from '@/features/batches/csv-import'

/**
 * Owner: Team 10 — Admin Core & Batch Management.
 *
 * Full CRUD list view for batches with create/edit modal and CSV import.
 */
export default function BatchesPage() {
  const { batches, loading, error, refetch } = useBatches()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Batch | null>(null)
  const [csvOpen, setCsvOpen] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this batch? This action cannot be undone.')) return
    setDeleting(id)
    try {
      await deleteBatch(id)
      void refetch()
    } catch (err: any) {
      alert(err.message ?? 'Failed to delete batch')
    } finally {
      setDeleting(null)
    }
  }

  const handleEdit = (batch: Batch) => {
    setEditing(batch)
    setFormOpen(true)
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-fg">Batches</h1>
          <p className="mt-0.5 text-sm text-fg-muted">Manage student batches and import students</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => setCsvOpen(true)}>
            Import CSV
          </Button>
          <Button size="sm" onClick={() => { setEditing(null); setFormOpen(true) }}>
            + New Batch
          </Button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : batches.length === 0 ? (
        <Card>
          <EmptyState
            title="No batches yet"
            description="Create your first batch to start managing students and subjects."
            action={
              <Button size="sm" onClick={() => { setEditing(null); setFormOpen(true) }}>
                + Create Batch
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {batches.map((batch) => (
            <Card key={batch._id} className="group transition-shadow hover:shadow-md">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-fg">{batch.name}</h3>
                    <Badge tone={batch.isActive ? 'success' : 'neutral'}>
                      {batch.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-fg-muted">
                    {batch.program} · {batch.year}
                  </p>
                  <div className="mt-2 flex gap-4 text-xs text-fg-subtle">
                    <span>
                      Start: {new Date(batch.startDate).toLocaleDateString()}
                    </span>
                    {batch.endDate && (
                      <span>
                        End: {new Date(batch.endDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(batch)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    loading={deleting === batch._id}
                    onClick={() => void handleDelete(batch._id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modals */}
      {formOpen && (
        <BatchFormModal
          open={formOpen}
          onClose={() => { setFormOpen(false); setEditing(null) }}
          onSuccess={() => void refetch()}
          editing={editing}
        />
      )}

      {csvOpen && (
        <CsvImportModal
          open={csvOpen}
          onClose={() => setCsvOpen(false)}
          onSuccess={() => void refetch()}
          batches={batches}
        />
      )}
    </div>
  )
}
