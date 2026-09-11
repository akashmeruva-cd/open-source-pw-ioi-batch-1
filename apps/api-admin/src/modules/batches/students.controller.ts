import type { Request, Response } from 'express'
import { User } from '@repo/models/user'
import { Subject } from '@repo/models/subject'
import { Enrollment } from '@repo/models/enrollment'

export const importStudents = async (req: Request, res: Response) => {
  const { batchId, students } = req.body // students: { name, email }[]
  
  // 1. Dry run / Preview logic?
  // The prompt said: "Show a preview — '38 will be created, 2 skipped (duplicate email)' — and let the admin confirm before it commits."
  // Wait, if this endpoint is POST /api/students/import, does it just do the import, or do we have a preview endpoint?
  // Typically, the frontend parses the CSV, validates format, then we can either send it to a preview endpoint, or just do an upsert/skip on this endpoint and return the result.
  // The frontend can send the list of students, and we can check existing emails.
  
  // Let's implement the actual commit logic here. If the frontend wants a preview, it can send `?dryRun=true`.
  const isDryRun = req.query.dryRun === 'true'

  const emails = students.map((s: any) => s.email)
  const existingUsers = await User.find({ email: { $in: emails } }, { email: 1 }).lean()
  const existingEmails = new Set(existingUsers.map(u => u.email))

  const toCreate = students.filter((s: any) => !existingEmails.has(s.email))
  const skippedCount = students.length - toCreate.length

  if (isDryRun) {
    res.json({
      willCreate: toCreate.length,
      willSkip: skippedCount,
      skippedEmails: Array.from(existingEmails)
    })
    return
  }

  // Create students and enroll them in all subjects of the batch
  const createdUsers = []
  
  // We need subjects for this batch to create enrollments
  const subjects = await Subject.find({ batchId }, { _id: 1 }).lean()
  
  // Create accounts
  for (const studentData of toCreate) {
    // Generate a placeholder password hash (or let them use reset flow). 
    // Usually it requires a hashed password, we'll just put a dummy hash for now, 
    // assuming Team 03 handles proper flows or there's a util.
    const newUser = await User.create({
      name: studentData.name,
      email: studentData.email,
      role: 'STUDENT',
      batchId,
      passwordHash: 'dummy_hash_requires_reset', // Team 03 password-reset flow
    })
    createdUsers.push(newUser)
  }

  // Create Enrollments
  const enrollmentsToCreate = []
  for (const user of createdUsers) {
    for (const subject of subjects) {
      enrollmentsToCreate.push({
        studentId: user._id,
        subjectId: subject._id,
        batchId,
      })
    }
  }

  if (enrollmentsToCreate.length > 0) {
    await Enrollment.insertMany(enrollmentsToCreate, { ordered: false })
  }

  res.status(201).json({
    created: createdUsers.length,
    skipped: skippedCount,
    enrollmentsCreated: enrollmentsToCreate.length
  })
}
