# Feature modules — `api-admin`

Same rules as `api-student/src/modules/README.md`. Read that first; only the
differences are listed here.

## The admin gate

Every module in this app is mounted behind `requireAuth` +
`requireRole('ADMIN', 'FACULTY')` by `app.ts`. You get that for free — do **not**
set `public: true` on your module. `auth` is the only exception and it already
exists.

Inside your routes you still narrow further where it matters. Faculty should be
able to grade their own subject's submissions; only `ADMIN` should be able to
delete a batch:

```ts
router.delete('/:id', requireRole('ADMIN'), asyncHandler(controller.remove))
```

## Write an audit log entry for destructive actions

Anything that deletes, deactivates, or changes a role goes through Team 11's
`AuditLog` (`@repo/models/audit-log`). "Who removed this student?" is the first
question anyone asks when something goes wrong.

## Who builds what

| Module           | Team | Endpoints                                                                    |
| ---------------- | ---- | ---------------------------------------------------------------------------- |
| `auth/`          | 03   | `POST /login /refresh /logout`, `GET /me` — **built, use as reference**      |
| `batches/`       | 10   | CRUD for batches, subjects, enrollments, `POST /students/import` (CSV)       |
| `users/`         | 11   | list/create/update users, role assignment, deactivate, `GET /audit-log`      |
| `materials/`     | 04   | `POST /` upload, `PATCH /:id`, `DELETE /:id`, `POST /upload-signature`       |
| `assignments/`   | 05   | create/publish assignments, list submissions, `PATCH /submissions/:id/grade` |
| `attendance/`    | 06   | `POST /sessions/:id/mark` (bulk), `PATCH /:id` corrections                   |
| `sessions/`      | 07   | timetable builder CRUD                                                       |
| `announcements/` | 08   | compose, pin, delete                                                         |
| `analytics/`     | 12   | batch dashboards, at-risk students, `GET /export/*.csv`                      |
