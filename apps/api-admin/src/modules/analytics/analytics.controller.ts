import type { Request, Response } from 'express'
import type { BatchAnalyticsParams, SubjectAnalyticsParams } from '@repo/validation/analytics'
import { getBatchAnalytics, getSubjectAnalytics } from './analytics.service'

/** Owner: Team 12 — Admin Analytics & Reports. */

export async function getBatch(req: Request, res: Response) {
  const { batchId } = req.params as BatchAnalyticsParams
  res.json(await getBatchAnalytics(batchId))
}

export async function getSubject(req: Request, res: Response) {
  const { subjectId } = req.params as SubjectAnalyticsParams
  res.json(await getSubjectAnalytics(subjectId))
}