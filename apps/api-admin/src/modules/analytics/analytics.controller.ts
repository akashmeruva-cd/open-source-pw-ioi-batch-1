import type { Request, Response } from 'express'
import {
  getBatchAnalytics,
  getSubjectAnalytics,
  getAtRiskStudents,
  streamAttendanceCsv,
  streamGradesCsv,
} from './analytics.service'

/**
 * Owner: Team 12 — Admin Analytics & Reports.
 *
 * Thin controllers: validate input, call service, return result.
 * Query/param parsing is handled by validate() middleware in the router.
 */

export async function batchAnalytics(req: Request, res: Response) {
  const { batchId } = req.params as { batchId: string }
  const data = await getBatchAnalytics(batchId)
  res.json(data)
}

export async function subjectAnalytics(req: Request, res: Response) {
  const { subjectId } = req.params as { subjectId: string }
  const data = await getSubjectAnalytics(subjectId)
  res.json(data)
}

export async function atRisk(req: Request, res: Response) {
  // validate() middleware has already coerced and replaced req.query
  const q = req.query as unknown as { batchId: string; threshold: number }
  const data = await getAtRiskStudents(q.batchId, Number(q.threshold))
  res.json(data)
}

export async function exportAttendance(req: Request, res: Response) {
  const q = req.query as unknown as { batchId: string }
  await streamAttendanceCsv(q.batchId, res)
}

export async function exportGrades(req: Request, res: Response) {
  const q = req.query as unknown as { batchId: string }
  await streamGradesCsv(q.batchId, res)
}
