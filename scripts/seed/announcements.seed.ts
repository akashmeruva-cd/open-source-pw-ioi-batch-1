import { getDb } from '@repo/models/db'
import { announcements, notifications } from '@repo/models/schema'
import type { CoreSeed } from './core.seed'

/**
 * Owner: Team 08 — Announcements & Notifications.
 */
export async function seedAnnouncements(core: CoreSeed, now: Date) {
  const db = getDb()
  const daysAgo = (n: number) => new Date(now.getTime() - n * 24 * 60 * 60 * 1000)

  const insertedAnnouncements = await db
    .insert(announcements)
    .values([
      {
        batchId: core.batch.id,
        subjectId: null,
        title: 'Mid-semester exam schedule published',
        body: 'The mid-semester timetable is up. Exams run over five days starting the first Monday of next month. Check your timetable for room allocations.',
        pinned: true,
        authorId: core.admin.id,
        createdAt: daysAgo(2),
      },
      {
        batchId: core.batch.id,
        subjectId: null,
        title: 'Library extended hours during exams',
        body: 'The library will stay open until 11pm on weekdays for the next three weeks.',
        pinned: false,
        authorId: core.admin.id,
        createdAt: daysAgo(5),
      },
      {
        batchId: core.batch.id,
        subjectId: core.subjects[1]?.id ?? null,
        title: 'DBMS lab rescheduled',
        body: "Thursday's lab moves to Friday 2pm this week only. Same room.",
        pinned: false,
        authorId: core.faculty[0]?.id ?? core.admin.id,
        createdAt: daysAgo(1),
      },
      {
        batchId: core.batch.id,
        subjectId: core.subjects[0]?.id ?? null,
        title: 'Extra doubt-clearing session for Data Structures',
        body: 'Optional session on trees and traversal this Saturday at 10am.',
        pinned: false,
        authorId: core.faculty[1]?.id ?? core.admin.id,
        createdAt: daysAgo(3),
      },
    ])
    .returning()

  // Unread notifications for the first two students
  const targets = core.students.slice(0, 2)
  const notificationValues = targets.flatMap((student) => [
    {
      userId: student.id,
      type: 'ANNOUNCEMENT' as const,
      title: 'Mid-semester exam schedule published',
      body: 'Check your timetable for room allocations.',
      href: '/announcements',
      readAt: null,
    },
    {
      userId: student.id,
      type: 'ASSIGNMENT_DUE_SOON' as const,
      title: 'An assignment is due in 3 days',
      body: 'CS202 Assignment 2',
      href: '/assignments',
      readAt: null,
    },
    {
      userId: student.id,
      type: 'MATERIAL_ADDED' as const,
      title: 'New material in Operating Systems',
      body: 'Virtual memory',
      href: '/materials',
      readAt: daysAgo(1),
    },
  ])

  const insertedNotifications = await db
    .insert(notifications)
    .values(notificationValues)
    .returning()

  return {
    announcements: insertedAnnouncements.length,
    notifications: insertedNotifications.length,
  }
}
