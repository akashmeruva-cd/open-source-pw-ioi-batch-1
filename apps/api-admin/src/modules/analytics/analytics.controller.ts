import type { Request, Response } from 'express'
import type { BatchAnalyticsParams } from '@repo/validation/analytics'
import { getBatchAnalytics } from './analytics.service'

/** Owner: Team 12 — Admin Analytics & Reports. */

export async function getBatchAnalyticsHandler(req: Request, res: Response) {
  const { batchId } = req.params as BatchAnalyticsParams
  res.json(await getBatchAnalytics(batchId))
}