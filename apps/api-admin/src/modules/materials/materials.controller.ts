import type { Request, Response } from 'express'
import { currentUser } from '@repo/auth/middleware'
import type {
  CreateMaterialInput,
  MaterialListQuery,
  UpdateMaterialInput,
  UploadSignatureInput,
} from '@repo/validation/materials'
import * as service from './materials.service'

export async function uploadSignature(req: Request, res: Response) {
  const input = req.body as UploadSignatureInput
  res.json(await service.createUploadTicket(input))
}

export async function create(req: Request, res: Response) {
  const { sub } = currentUser(req)
  const input = req.body as CreateMaterialInput
  res.status(201).json(await service.createMaterial(sub, input))
}

export async function update(req: Request, res: Response) {
  const { id } = req.params as { id: string }
  const input = req.body as UpdateMaterialInput
  res.json(await service.updateMaterial(id, input))
}

export async function deleteMaterial(req: Request, res: Response) {
  const { id } = req.params as { id: string }
  res.json(await service.deleteMaterial(id))
}

export async function list(req: Request, res: Response) {
  const query = req.query as unknown as MaterialListQuery
  res.json(await service.listMaterials(query))
}
