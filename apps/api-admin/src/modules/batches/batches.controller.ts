import type { Request, Response } from 'express'
import { Batch } from '@repo/models/batch'

export const getBatches = async (req: Request, res: Response) => {
  const batches = await Batch.find().sort({ createdAt: -1 })
  res.json(batches)
}

export const createBatch = async (req: Request, res: Response) => {
  const batch = await Batch.create(req.body)
  res.status(201).json(batch)
}

export const updateBatch = async (req: Request, res: Response) => {
  const batch = await Batch.findByIdAndUpdate(req.params.id, req.body, { new: true })
  if (!batch) {
    res.status(404).json({ error: 'Batch not found' })
    return
  }
  res.json(batch)
}

export const deleteBatch = async (req: Request, res: Response) => {
  // Only ADMIN can delete a batch - this is handled by the global admin gate.
  // Note: we should probably write an AuditLog row per requirements: "Every destructive action writes an AuditLog row"
  
  const batch = await Batch.findByIdAndDelete(req.params.id)
  if (!batch) {
    res.status(404).json({ error: 'Batch not found' })
    return
  }
  
  // TODO: create AuditLog row when team 11 provides the model
  res.status(204).end()
}
