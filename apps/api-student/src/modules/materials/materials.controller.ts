import type { Request, Response } from 'express'
import { currentUser } from '@repo/auth/middleware'
import type { MaterialListQuery, MaterialSearchQuery } from '@repo/validation/materials'
import * as service from './materials.service'

export async function list(req: Request, res: Response) {
  const { sub } = currentUser(req)
  const query = req.query as unknown as MaterialListQuery
  res.json(await service.listMaterialsForStudent(sub, query))
}

export async function search(req: Request, res: Response) {
  const { sub } = currentUser(req)
  const query = req.query as unknown as MaterialSearchQuery
  res.json(await service.searchMaterialsForStudent(sub, query))
}

export async function getById(req: Request, res: Response) {
  const { sub } = currentUser(req)
  const { id } = req.params as { id: string }
  res.json(await service.getMaterialByIdForStudent(sub, id))
}
