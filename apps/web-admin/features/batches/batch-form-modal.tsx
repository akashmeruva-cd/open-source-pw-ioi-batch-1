'use client'

import { useState } from 'react'
import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
import { Modal } from './modal'
import { createBatch, updateBatch, type Batch } from './api'

export function BatchFormModal({
  open,
  onClose,
  onSuccess,
  editing,
}: {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  editing?: Batch | null
}) {
  const [name, setName] = useState(editing?.name ?? '')
  const [year, setYear] = useState(editing?.year?.toString() ?? new Date().getFullYear().toString())
  const [program, setProgram] = useState(editing?.program ?? '')
  const [startDate, setStartDate] = useState(editing?.startDate?.slice(0, 10) ?? '')
  const [endDate, setEndDate] = useState(editing?.endDate?.slice(0, 10) ?? '')
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
        year: Number(year),
        program,
        startDate: new Date(startDate).toISOString(),
        endDate: endDate ? new Date(endDate).toISOString() : null,
        isActive: true,
      }

      if (isEditing) {
        await updateBatch(editing._id, payload)
      } else {
        await createBatch(payload)
      }

      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={isEditing ? 'Edit Batch' : 'Create Batch'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Batch Name" value={name} onChange={(e) => setName(e.target.value)} required />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Year" type="number" value={year} onChange={(e) => setYear(e.target.value)} required />
          <Input label="Program" value={program} onChange={(e) => setProgram(e.target.value)} required />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Start Date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
          <Input label="End Date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={loading}>{isEditing ? 'Save Changes' : 'Create Batch'}</Button>
        </div>
      </form>
    </Modal>
  )
}
