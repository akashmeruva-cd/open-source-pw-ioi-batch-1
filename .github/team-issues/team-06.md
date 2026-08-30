**Team 06 · 4 people · Builds W5 (core spine)**

"What's my attendance?" is the question this whole app gets opened for. Your number has to be right, and it has to be right on the first load.

## What you own

```
packages/models/src/attendance.ts          ← already scaffolded
packages/validation/src/attendance.ts
apps/api-student/src/modules/attendance/
apps/api-admin/src/modules/attendance/
apps/web-student/features/attendance/
apps/web-student/app/(dashboard)/attendance/
```

## What to build

**Student side** — overall percentage, per-subject breakdown with a bar or ring per subject, a warning when a subject drops below the threshold (75% is the usual college rule — confirm it), and a session-by-session history showing exactly which classes were missed.

**Admin/faculty side** — mark a whole session at once (list of enrolled students, default everyone present, flip the absentees), edit a past record with a reason, and see a batch-wide grid.

**Endpoints**

| API     | Method | Path                                              |
| ------- | ------ | ------------------------------------------------- |
| student | GET    | `/api/attendance/me/summary`                      |
| student | GET    | `/api/attendance/me?subjectId=`                   |
| admin   | GET    | `/api/attendance/sessions/:sessionId`             |
| admin   | POST   | `/api/attendance/sessions/:sessionId/mark` (bulk) |
| admin   | PATCH  | `/api/attendance/:id`                             |

## This is the hardest data problem in the project

`Attendance` is the largest collection: students × sessions, so ~40 × 30 already in the seed and growing every week. Two things follow:

- **Use an aggregation pipeline, not a loop.** Computing a percentage by fetching all rows and counting in JavaScript works with seed data and falls over later. `$match` → `$group` by subject → `$sum` with `$cond`.
- **`subjectId` is denormalised onto every attendance row on purpose** so the percentage query doesn't need a `$lookup`. Keep it in sync when marking.

Decide and document how `LATE` and `EXCUSED` count. Does `EXCUSED` count as present, or come out of the denominator entirely? Whatever you choose, the number on screen must match what a student would calculate by hand — write that as a test with fixed seed data.

There is a unique index on `{sessionId, studentId}`, so double-marking is impossible rather than merely unlikely. Bulk marking should upsert.

## Definition of done

- Percentage on the dashboard matches a hand count of the seeded sessions, exactly
- Marking 40 students for one session is a single request, not 40
- A student sees only their own attendance
- Faculty can only mark sessions for subjects they teach

## First tasks

- [ ] `packages/validation/src/attendance.ts` in W1
- [ ] Decide and document the LATE/EXCUSED rule — write it in the issue before coding
- [ ] Aggregation pipeline for per-subject percentage, with a fixed-data test
- [ ] Bulk marking screen in the admin portal

---

## Independence

**Blocked by: nothing.** Everything you need already exists — the models are scaffolded, auth is built, and `npm run seed` gives you 1,200 attendance records across 30 past sessions; student04 sits at 33.3%.

Two rules keep it that way:

- **Never call another team's HTTP endpoint.** If you need their data, read their model directly (read-only). Model files are shared and importable; module folders are owned. This is why no team waits on another.
- **Merge your Zod schema in `packages/validation` in week 1**, before either half of your team writes implementation code. It is the contract your frontend and backend build against in parallel.

## Agreements (not dependencies)

Four decisions that two or more teams must make the _same way_. Settle them in week 1 and write them into `docs/` — nobody is blocked, but disagreeing is expensive to unpick later.

| Agreement                                                                                | Teams             | Owner  |
| ---------------------------------------------------------------------------------------- | ----------------- | ------ |
| The attendance-percentage formula (does LATE count? does EXCUSED leave the denominator?) | 06 · 12 · 13 · 09 | **06** |
| The batch timezone rule, and what "today" means                                          | 07 · 06 · 09      | **07** |
| One chart library, requested once                                                        | 09 · 12           | **12** |
| One Cloudinary signed-upload helper, written once                                        | 04 · 05 · 09      | **04** |

## Definition of ready to merge

- `npm run lint`, `npm run typecheck`, `npm run test` pass locally
- Tests cover the happy path, the auth requirement, and one abuse case
- Only files your team owns are touched (see `.github/CODEOWNERS`)
- Under ~400 lines
