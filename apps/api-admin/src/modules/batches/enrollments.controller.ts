import type { Request, Response } from 'express'
import { Enrollment } from '@repo/models/enrollment'
import { User } from '@repo/models/user'

export const createEnrollment = async (req: Request, res: Response) => {
  const { studentId, subjectId, batchId } = req.body

  // Check if student exists
  const student = await User.findById(studentId)
  if (!student || student.role !== 'STUDENT') {
    res.status(400).json({ error: 'Invalid student' })
    return
  }

  try {
    const enrollment = await Enrollment.create({ studentId, subjectId, batchId })
    res.status(201).json(enrollment)
  } catch (error: any) {
    if (error.code === 11000) {
      res.status(400).json({ error: 'Student is already enrolled in this subject' })
      return
    }
    throw error
  }
}

export const bulkCreateEnrollments = async (req: Request, res: Response) => {
  const { enrollments } = req.body // array of { studentId, subjectId, batchId }
  
  // A simple insertMany. In real code we might validate each student, but for bulk it's often OK to rely on DB constraints.
  try {
    const result = await Enrollment.insertMany(enrollments, { ordered: false })
    res.status(201).json({ count: result.length })
  } catch (error: any) {
    if (error.code === 11000) {
      // Partial success is possible with ordered: false, but error will still be thrown
      const insertedCount = error.insertedDocs ? error.insertedDocs.length : 0
      res.status(400).json({ 
        error: 'Some enrollments failed (likely duplicates)',
        insertedCount
      })
      return
    }
    throw error
  }
}
