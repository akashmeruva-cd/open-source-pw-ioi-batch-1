import {
  pgTable,
  uuid,
  text,
  boolean,
  integer,
  timestamp,
  real,
  jsonb,
  uniqueIndex,
  index,
  pgEnum,
} from 'drizzle-orm/pg-core'

/**
 * LOCKED FILE — Team 01 (Core Platform).
 *
 * All Drizzle table definitions live here. Teams still import individual tables
 * via subpath exports (e.g. `import { profiles } from '@repo/models/schema'`),
 * but the definitions are co-located so foreign keys resolve cleanly.
 *
 * Adding a table = adding it to this file. Do not create separate schema files.
 */

// ─── Enums ──────────────────────────────────────────────────────────────────

export const roleEnum = pgEnum('role', ['STUDENT', 'FACULTY', 'ADMIN'])
export const attendanceStatusEnum = pgEnum('attendance_status', [
  'PRESENT',
  'ABSENT',
  'LATE',
  'EXCUSED',
])
export const submissionStatusEnum = pgEnum('submission_status', ['SUBMITTED', 'LATE', 'GRADED'])
export const materialTypeEnum = pgEnum('material_type', [
  'PPT',
  'PDF',
  'DOC',
  'VIDEO',
  'LINK',
  'OTHER',
])
export const notificationTypeEnum = pgEnum('notification_type', [
  'MATERIAL_ADDED',
  'ASSIGNMENT_PUBLISHED',
  'ASSIGNMENT_DUE_SOON',
  'SUBMISSION_GRADED',
  'ATTENDANCE_LOW',
  'ANNOUNCEMENT',
])
export const bookmarkTargetEnum = pgEnum('bookmark_target', [
  'MATERIAL',
  'ASSIGNMENT',
  'ANNOUNCEMENT',
])
export const messageRoleEnum = pgEnum('message_role', ['user', 'assistant'])

// ─── Profiles (linked to Supabase auth.users) ──────────────────────────────

/** Owner: Team 03 — Auth & Identity. */
export const profiles = pgTable(
  'profiles',
  {
    id: uuid('id').primaryKey(), // matches auth.users.id — NOT defaultRandom()
    name: text('name').notNull(),
    email: text('email').notNull().unique(),
    role: roleEnum('role').notNull().default('STUDENT'),
    batchId: uuid('batch_id'),
    avatarUrl: text('avatar_url'),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('profiles_batch_role_idx').on(t.batchId, t.role)],
)

// ─── Batches ────────────────────────────────────────────────────────────────

/** Owner: Team 10 — Admin Core & Batch Management. */
export const batches = pgTable(
  'batches',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    year: integer('year').notNull(),
    program: text('program').notNull(),
    startDate: timestamp('start_date', { withTimezone: true }).notNull(),
    endDate: timestamp('end_date', { withTimezone: true }),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('batches_name_year_idx').on(t.name, t.year)],
)

// ─── Subjects ───────────────────────────────────────────────────────────────

/** Owner: Team 10 — Admin Core & Batch Management. */
export const subjects = pgTable(
  'subjects',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    code: text('code').notNull(),
    batchId: uuid('batch_id')
      .notNull()
      .references(() => batches.id),
    facultyId: uuid('faculty_id').references(() => profiles.id),
    credits: integer('credits').notNull().default(3),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('subjects_batch_code_idx').on(t.batchId, t.code),
    index('subjects_batch_idx').on(t.batchId),
  ],
)

// ─── Enrollments ────────────────────────────────────────────────────────────

/** Owner: Team 10 — Admin Core & Batch Management. */
export const enrollments = pgTable(
  'enrollments',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    studentId: uuid('student_id')
      .notNull()
      .references(() => profiles.id),
    subjectId: uuid('subject_id')
      .notNull()
      .references(() => subjects.id),
    batchId: uuid('batch_id')
      .notNull()
      .references(() => batches.id),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('enrollments_student_subject_idx').on(t.studentId, t.subjectId),
    index('enrollments_batch_idx').on(t.batchId),
  ],
)

// ─── Class Sessions ─────────────────────────────────────────────────────────

/** Owner: Team 07 — Timetable & Sessions. */
export const classSessions = pgTable(
  'class_sessions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    subjectId: uuid('subject_id')
      .notNull()
      .references(() => subjects.id),
    title: text('title').notNull(),
    scheduledAt: timestamp('scheduled_at', { withTimezone: true }).notNull(),
    durationMins: integer('duration_mins').notNull().default(60),
    room: text('room'),
    facultyId: uuid('faculty_id').references(() => profiles.id),
    isCancelled: boolean('is_cancelled').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('class_sessions_subject_idx').on(t.subjectId),
    index('class_sessions_scheduled_idx').on(t.scheduledAt),
    index('class_sessions_subject_scheduled_idx').on(t.subjectId, t.scheduledAt),
  ],
)

// ─── Attendance ─────────────────────────────────────────────────────────────

/** Owner: Team 06 — Attendance. Largest table in the system. */
export const attendance = pgTable(
  'attendance',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    sessionId: uuid('session_id')
      .notNull()
      .references(() => classSessions.id),
    subjectId: uuid('subject_id')
      .notNull()
      .references(() => subjects.id),
    studentId: uuid('student_id')
      .notNull()
      .references(() => profiles.id),
    status: attendanceStatusEnum('status').notNull().default('ABSENT'),
    markedBy: uuid('marked_by')
      .notNull()
      .references(() => profiles.id),
    markedAt: timestamp('marked_at', { withTimezone: true }).notNull().defaultNow(),
    note: text('note'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('attendance_session_student_idx').on(t.sessionId, t.studentId),
    index('attendance_student_subject_idx').on(t.studentId, t.subjectId),
  ],
)

// ─── Materials ──────────────────────────────────────────────────────────────

/** Owner: Team 04 — Class Materials. */
export const materials = pgTable(
  'materials',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    subjectId: uuid('subject_id')
      .notNull()
      .references(() => subjects.id),
    sessionId: uuid('session_id').references(() => classSessions.id),
    title: text('title').notNull(),
    description: text('description'),
    type: materialTypeEnum('type').notNull().default('OTHER'),
    /** File metadata for uploaded files; null for LINK materials. */
    file: jsonb('file').$type<{
      key: string
      url: string
      bytes: number
      format: string
    } | null>(),
    externalUrl: text('external_url'),
    uploadedBy: uuid('uploaded_by')
      .notNull()
      .references(() => profiles.id),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('materials_subject_idx').on(t.subjectId),
    index('materials_subject_created_idx').on(t.subjectId, t.createdAt),
  ],
)

// ─── Assignments ────────────────────────────────────────────────────────────

/** Owner: Team 05 — Assignments & Submissions. */
export const assignments = pgTable(
  'assignments',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    subjectId: uuid('subject_id')
      .notNull()
      .references(() => subjects.id),
    title: text('title').notNull(),
    description: text('description').notNull().default(''),
    dueAt: timestamp('due_at', { withTimezone: true }).notNull(),
    maxMarks: integer('max_marks').notNull(),
    /** File attachments as JSON array. */
    attachments: jsonb('attachments')
      .$type<{ publicId: string; url: string; name: string }[]>()
      .notNull()
      .default([]),
    createdBy: uuid('created_by')
      .notNull()
      .references(() => profiles.id),
    isPublished: boolean('is_published').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('assignments_subject_idx').on(t.subjectId),
    index('assignments_subject_due_idx').on(t.subjectId, t.dueAt),
  ],
)

// ─── Submissions ────────────────────────────────────────────────────────────

/** Owner: Team 05 — Assignments & Submissions. */
export const submissions = pgTable(
  'submissions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    assignmentId: uuid('assignment_id')
      .notNull()
      .references(() => assignments.id),
    studentId: uuid('student_id')
      .notNull()
      .references(() => profiles.id),
    /** Submitted file metadata as JSON array. */
    files: jsonb('files')
      .$type<{ publicId: string; url: string; name: string; bytes: number }[]>()
      .notNull()
      .default([]),
    note: text('note'),
    submittedAt: timestamp('submitted_at', { withTimezone: true }).notNull().defaultNow(),
    status: submissionStatusEnum('status').notNull().default('SUBMITTED'),
    marks: real('marks'),
    feedback: text('feedback'),
    gradedBy: uuid('graded_by').references(() => profiles.id),
    gradedAt: timestamp('graded_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('submissions_assignment_student_idx').on(t.assignmentId, t.studentId),
    index('submissions_assignment_idx').on(t.assignmentId),
    index('submissions_student_idx').on(t.studentId),
  ],
)

// ─── Announcements ──────────────────────────────────────────────────────────

/** Owner: Team 08 — Announcements & Notifications. */
export const announcements = pgTable(
  'announcements',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    batchId: uuid('batch_id')
      .notNull()
      .references(() => batches.id),
    subjectId: uuid('subject_id').references(() => subjects.id),
    title: text('title').notNull(),
    body: text('body').notNull(),
    pinned: boolean('pinned').notNull().default(false),
    authorId: uuid('author_id')
      .notNull()
      .references(() => profiles.id),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('announcements_batch_pinned_created_idx').on(t.batchId, t.pinned, t.createdAt)],
)

// ─── Notifications ──────────────────────────────────────────────────────────

/** Owner: Team 08 — Announcements & Notifications. */
export const notifications = pgTable(
  'notifications',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => profiles.id),
    type: notificationTypeEnum('type').notNull(),
    title: text('title').notNull(),
    body: text('body').notNull().default(''),
    href: text('href'),
    readAt: timestamp('read_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('notifications_user_read_created_idx').on(t.userId, t.readAt, t.createdAt)],
)

// ─── Notes ──────────────────────────────────────────────────────────────────

/**
 * Owner: Team 09 — Student Profile & Notes.
 *
 * Private by construction: every query must filter by `studentId` taken from
 * the verified token, never from the request.
 */
export const notes = pgTable(
  'notes',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    studentId: uuid('student_id')
      .notNull()
      .references(() => profiles.id),
    subjectId: uuid('subject_id').references(() => subjects.id),
    sessionId: uuid('session_id').references(() => classSessions.id),
    title: text('title').notNull(),
    body: text('body').notNull().default(''),
    pinned: boolean('pinned').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('notes_student_pinned_updated_idx').on(t.studentId, t.pinned, t.updatedAt),
    index('notes_student_subject_idx').on(t.studentId, t.subjectId),
  ],
)

// ─── Bookmarks ──────────────────────────────────────────────────────────────

/**
 * Owner: Team 09 — Student Profile & Notes.
 * Bookmarking the same thing twice is a no-op, not a duplicate row.
 */
export const bookmarks = pgTable(
  'bookmarks',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    studentId: uuid('student_id')
      .notNull()
      .references(() => profiles.id),
    entityType: bookmarkTargetEnum('entity_type').notNull(),
    entityId: uuid('entity_id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('bookmarks_student_entity_idx').on(t.studentId, t.entityType, t.entityId),
    index('bookmarks_student_idx').on(t.studentId),
  ],
)

// ─── Audit Logs ─────────────────────────────────────────────────────────────

/** Owner: Team 11 — Admin People, Roles & Audit. Written by api-admin only. */
export const auditLogs = pgTable(
  'audit_logs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    actorId: uuid('actor_id')
      .notNull()
      .references(() => profiles.id),
    action: text('action').notNull(),
    entity: text('entity').notNull(),
    entityId: uuid('entity_id'),
    meta: jsonb('meta').$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('audit_logs_actor_idx').on(t.actorId),
    index('audit_logs_entity_idx').on(t.entity, t.entityId, t.createdAt),
  ],
)

// ─── Conversations (AI Assistant) ───────────────────────────────────────────

/** Owner: Team 13 — AI Assistant. */
export const conversations = pgTable(
  'conversations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => profiles.id),
    title: text('title').notNull().default('New chat'),
    tokensUsed: jsonb('tokens_used')
      .$type<{ input: number; output: number }>()
      .notNull()
      .default({ input: 0, output: 0 }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('conversations_user_updated_idx').on(t.userId, t.updatedAt)],
)

/** Owner: Team 13 — AI Assistant. Separate table instead of embedded array. */
export const conversationMessages = pgTable(
  'conversation_messages',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    conversationId: uuid('conversation_id')
      .notNull()
      .references(() => conversations.id, { onDelete: 'cascade' }),
    role: messageRoleEnum('role').notNull(),
    content: text('content').notNull(),
    toolsUsed: jsonb('tools_used').$type<string[]>().notNull().default([]),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('conversation_messages_conversation_idx').on(t.conversationId, t.createdAt)],
)
