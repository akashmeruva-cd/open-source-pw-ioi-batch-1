import type { Request, Response } from 'express'
import { Enrollment } from '@repo/models/enrollment'
import { Subject } from '@repo/models/subject'

export const getMySubjects = async (req: Request, res: Response) => {
  // @ts-ignore - Assuming req.user is set by requireAuth middleware
  const studentId = req.user?._id

  if (!studentId) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  // Find all enrollments for this student
  const enrollments = await Enrollment.find({ studentId }).lean()
  const subjectIds = enrollments.map(e => e.subjectId)

  // Find the actual subjects
  const subjects = await Subject.find({ _id: { $in: subjectIds } })
    .populate('facultyId', 'name email')
    .sort({ name: 1 })

  res.json(subjects)
}
