import type { Request, Response } from 'express'
import { Subject } from '@repo/models/subject'
import { Enrollment } from '@repo/models/enrollment'
import { Material } from '@repo/models/material'
import { ClassSession } from '@repo/models/class-session'
import { Assignment } from '@repo/models/assignment'

export const getSubjects = async (req: Request, res: Response) => {
  const subjects = await Subject.find().populate('facultyId', 'name email').sort({ createdAt: -1 })
  res.json(subjects)
}

export const createSubject = async (req: Request, res: Response) => {
  const subject = await Subject.create(req.body)
  res.status(201).json(subject)
}

export const updateSubject = async (req: Request, res: Response) => {
  const subject = await Subject.findByIdAndUpdate(req.params.id, req.body, { new: true })
  if (!subject) {
    res.status(404).json({ error: 'Subject not found' })
    return
  }
  res.json(subject)
}

export const deleteSubject = async (req: Request, res: Response) => {
  const subjectId = req.params.id

  // Refuse-if-not-empty policy
  const hasEnrollments = await Enrollment.exists({ subjectId })
  const hasMaterials = await Material.exists({ subjectId })
  const hasSessions = await ClassSession.exists({ subjectId })
  const hasAssignments = await Assignment.exists({ subjectId })

  if (hasEnrollments || hasMaterials || hasSessions || hasAssignments) {
    res.status(400).json({ 
      error: 'Cannot delete subject because it has related records (enrollments, materials, sessions, or assignments).' 
    })
    return
  }

  const subject = await Subject.findByIdAndDelete(subjectId)
  if (!subject) {
    res.status(404).json({ error: 'Subject not found' })
    return
  }

  res.status(204).end()
}
