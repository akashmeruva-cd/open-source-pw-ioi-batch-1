**Team 10 · 4 people · Builds W2 (foundation for every other feature)**

Nothing else has anything to attach to until batches, subjects and enrollments exist. Materials belong to subjects, sessions belong to subjects, attendance belongs to enrolled students. You go early and you unblock everyone.

## What you own

```
packages/models/src/{batch,subject,enrollment}.ts   ← already scaffolded
packages/validation/src/batches.ts
apps/api-admin/src/modules/batches/
apps/web-admin/app/(admin)/{overview,batches,subjects}/
apps/web-admin/features/
apps/api-student/src/modules/subjects/    ← read-only for students
```

## What to build

**Admin side** — CRUD for batches, subjects (with a faculty assignment) and enrollments; a batch overview showing student count, subject list and today's sessions; and **bulk student import from CSV**, which is how 40 real students actually get into the system.

**Student side** — a read-only "my subjects" list.

**Endpoints**

| API     | Method                | Path                                              |
| ------- | --------------------- | ------------------------------------------------- |
| admin   | GET/POST/PATCH/DELETE | `/api/batches`                                    |
| admin   | GET/POST/PATCH/DELETE | `/api/subjects`                                   |
| admin   | POST                  | `/api/enrollments` · `POST /api/enrollments/bulk` |
| admin   | POST                  | `/api/students/import` (CSV)                      |
| student | GET                   | `/api/subjects/me`                                |

## CSV import is the interesting problem

Uploading 40 rows where row 23 has a duplicate email is the normal case, not the exception. Design for it:

- **Validate the whole file before writing anything.** Parse, check every row, and return a per-row error report. A half-imported batch is much worse than a rejected one.
- **Show a preview** — "38 will be created, 2 skipped (duplicate email)" — and let the admin confirm before it commits.
- Creating a student also creates their `Enrollment` rows for the batch's subjects.
- Imported students need a password. Either generate one and email it (coordinate with Team 08), or create the account and let them use Team 03's password-reset flow. **Never put a generated password in a CSV response.**

## Deleting is dangerous

Deleting a subject orphans its materials, sessions, assignments and attendance. Decide early: soft-delete, cascade, or refuse-if-not-empty. Refusing when not empty is the safest for a student project. Whatever you choose, write it in the issue and tell Teams 04–08.

## Definition of done

- An admin creates a batch, adds 6 subjects, imports 40 students, and everyone is enrolled — in under five minutes
- A malformed CSV produces a clear per-row report and changes nothing
- Only `ADMIN` can delete a batch; `FACULTY` can read
- Every destructive action writes an `AuditLog` row (coordinate with Team 11)

## First tasks

- [ ] `packages/validation/src/batches.ts` in W1 — several teams reference subjects
- [ ] Batch and subject CRUD + admin UI
- [ ] Decide and document the delete policy
- [ ] CSV import with dry-run preview

---

## Independence

**Blocked by: nothing.** Everything you need already exists — the models are scaffolded, auth is built, and `npm run seed` gives you 1 batch, 6 subjects, 40 enrolled students, 240 enrollments.

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
