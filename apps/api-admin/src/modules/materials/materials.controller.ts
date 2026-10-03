import type { Request, Response } from 'express'
import { currentUser } from '@repo/auth/middleware'
import type {
  CreateMaterialInput,
  MaterialIdParams,
  UpdateMaterialInput,
  UploadSignatureInput,
} from '@repo/validation/materials'
import * as service from './materials.service'

/** Owner: Team 04 — Class Materials. */

export async function uploadSignature(req: Request, res: Response) {
  const { filename, folder } = req.body as UploadSignatureInput
  const result = await service.createUploadSignature(filename, folder)
  res.json(result)
}

export async function create(req: Request, res: Response) {
  const { sub } = currentUser(req)
  const input = req.body as CreateMaterialInput
  const material = await service.createMaterial(input, sub)
  res.status(201).json({ material })
}

export async function update(req: Request, res: Response) {
  const { id } = req.params as unknown as MaterialIdParams
  const input = req.body as UpdateMaterialInput
  const material = await service.updateMaterial(id, input)
  res.json({ material })
}

export async function remove(req: Request, res: Response) {
  const { id } = req.params as unknown as MaterialIdParams
  await service.deleteMaterial(id)
  res.status(204).end()
}
