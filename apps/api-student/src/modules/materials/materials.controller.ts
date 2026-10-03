import type { Request, Response } from 'express'
import type { ListMaterialsQuery, MaterialIdParams, SearchMaterialsQuery } from '@repo/validation/materials'
import * as service from './materials.service'

/** Owner: Team 04 — Class Materials. */

export async function list(req: Request, res: Response) {
  const query = req.query as unknown as ListMaterialsQuery
  const result = await service.listMaterials(query)
  res.json(result)
}

export async function search(req: Request, res: Response) {
  const query = req.query as unknown as SearchMaterialsQuery
  const items = await service.searchMaterials(query)
  res.json({ items })
}

export async function getById(req: Request, res: Response) {
  const { id } = req.params as unknown as MaterialIdParams
  const material = await service.getMaterialById(id)
  res.json({ material })
}
