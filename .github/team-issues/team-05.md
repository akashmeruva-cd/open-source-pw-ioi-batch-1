**Team 05 · 4 people · Builds W4 (core spine)**

The full loop: a faculty member publishes an assignment, students submit files before a deadline, faculty grades them, students see their marks and feedback. This is the biggest single vertical in the project.

## What you own

```
packages/models/src/assignment.ts   packages/models/src/submission.ts
packages/validation/src/assignments.ts
apps/api-student/src/modules/assignments/
apps/api-admin/src/modules/assignments/
apps/web-student/features/assignments/
apps/web-student/app/(dashboard)/assignments/
```

## What to build

**Student side** — list of assignments grouped by due date with clear status (not started / submitted / late / graded), detail page with description and attachments, submit with file upload and an optional note, resubmit before the deadline, and a grades view.

**Admin/faculty side** — create and publish an assignment (draft until published), see the submission list for an assignment with who hasn't submitted, grade with marks and written feedback, bulk-download submissions.

**Endpoints**

| API     | Method | Path                                                    |
| ------- | ------ | ------------------------------------------------------- |
| student | GET    | `/api/assignments?subjectId=`                           |
| student | GET    | `/api/assignments/upcoming?days=7`                      |
| student | GET    | `/api/assignments/:id`                                  |
| student | POST   | `/api/assignments/:id/submissions`                      |
| student | GET    | `/api/submissions/me/grades`                            |
| admin   | POST   | `/api/assignments` · PATCH `/:id` · POST `/:id/publish` |
| admin   | GET    | `/api/assignments/:id/submissions`                      |
| admin   | PATCH  | `/api/submissions/:id/grade`                            |

## The rules that will bite you

- **Late detection is server-side.** Compare `submittedAt` against `dueAt` on the server and set status to `LATE`. Never let the client tell you whether it was on time.
- **One submission row per student per assignment** — there is a unique compound index on `{assignmentId, studentId}`. Resubmission _updates_ the row, it does not insert a second one.
- **A student may only read their own submission.** The student id comes from `currentUser(req)`, never from the URL. This is the single most likely place in the whole project to leak another student's work — write the test for it first.
- **Unpublished assignments are invisible to students.** Check `isPublished` in the student API, not just in the UI.
- **Faculty grade only their own subjects.** Admin can grade anything.

## Definition of done

- Publish → submit → grade → student sees marks, end to end on the deployed site
- A student cannot read, overwrite, or grade another student's submission (tested)
- Submitting one second after the deadline is marked `LATE`
- Files use the same Cloudinary signed-upload flow as Team 04 — coordinate, do not reinvent it

## First tasks

- [ ] `packages/validation/src/assignments.ts` in W1
- [ ] Assignment list + detail UI against mocks
- [ ] Submission endpoints with the ownership test
- [ ] Grading UI in the admin portal

---

## Independence

**Blocked by: nothing.** Everything you need already exists — the models are scaffolded, auth is built, and `npm run seed` gives you 18 assignments (12 published, 6 draft) and 221 graded submissions.

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
