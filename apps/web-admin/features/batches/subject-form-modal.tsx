'use client'

import { useState } from 'react'
import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
import { Modal } from './modal'
import { createSubject, updateSubject, type Subject, type Batch } from './api'

export function SubjectFormModal({
  open,
  onClose,
  onSuccess,
  batches,
  editing,
}: {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  batches: Batch[]
  editing?: Subject | null
}) {
  const [name, setName] = useState(editing?.name ?? '')
  const [code, setCode] = useState(editing?.code ?? '')
  const [batchId, setBatchId] = useState(editing?.batchId ?? batches[0]?._id ?? '')
  const [credits, setCredits] = useState(editing?.credits?.toString() ?? '3')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isEditing = !!editing

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const payload = {
        name,
        code: code.toUpperCase(),
        batchId,
        credits: Number(credits),
      }

      if (isEditing) {
        await updateSubject(editing._id, payload)
      } else {
        await createSubject(payload)
      }

      onSuccess()
      onClose()
    } catch (err: unknown) {
  setError(
    err instanceof Error
      ? err.message
      : 'Something went wrong',
  )
} finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={isEditing ? 'Edit Subject' : 'Create Subject'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Subject Name" value={name} onChange={(e) => setName(e.target.value)} required />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Subject Code" value={code} onChange={(e) => setCode(e.target.value)} required placeholder="e.g. CS101" />
          <Input label="Credits" type="number" value={credits} onChange={(e) => setCredits(e.target.value)} min={0} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-fg">Batch</label>
          <select
            value={batchId}
            onChange={(e) => setBatchId(e.target.value)}
            required
            className="h-10 rounded-lg border border-line bg-surface px-3 text-sm text-fg focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand"
          >
            <option value="">Select a batch…</option>
            {batches.map((b) => (
              <option key={b._id} value={b._id}>
                {b.name} ({b.year})
              </option>
            ))}
          </select>
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={loading}>{isEditing ? 'Save Changes' : 'Create Subject'}</Button>
        </div>
      </form>
    </Modal>
  )
}
