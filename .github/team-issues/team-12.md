**Team 12 · Admin Analytics & Reports · 3 people · Builds from W2**

> **Scope clarified.** You were the team most at risk of waiting on others. You are not any more: the seed ships **1,200 attendance records and 221 graded submissions** on day one. You read those models directly and can build every pipeline in week 2, before Teams 05 and 06 ship a single endpoint.

Faculty need to know which students are in trouble while there is still time to help. That is the product — not charts, but _"these six students need a conversation this week."_

## What you own

```
packages/validation/src/analytics.ts
apps/api-admin/src/modules/analytics/
apps/web-admin/app/(admin)/analytics/
apps/web-admin/features/analytics/
```

You **read** `Attendance`, `Submission`, `Assignment`, `Enrollment` and `User`. Reading another team's model is fine and creates no conflict — model files are shared, module folders are not. You never call another team's HTTP endpoint.

## MVP — ships alone, depends on nobody

**At-risk report** — the most valuable screen in the admin portal. Students below the attendance threshold, with missing submissions, or trending down. Sortable, filterable, links to the student. The seed puts exactly one student (`student04@college.edu`, 33.3%) below 75%, so you have a known-correct answer to test against.

**Batch dashboard** — average attendance, submission rate, average marks, attendance distribution, per-subject comparison.

**CSV export** — attendance, grades, at-risk list.

**Endpoints**

| Method | Path                                           |
| ------ | ---------------------------------------------- |
| GET    | `/api/analytics/batch/:batchId`                |
| GET    | `/api/analytics/subject/:subjectId`            |
| GET    | `/api/analytics/at-risk?batchId=&threshold=75` |
| GET    | `/api/analytics/export/attendance.csv`         |
| GET    | `/api/analytics/export/grades.csv`             |

## The technical heart of this team

Every one of these is a MongoDB **aggregation pipeline**. Computing them in JavaScript will work and will be the wrong answer — 1,200 attendance rows in the seed becomes tens of thousands in a real batch. Learn `$match`, `$group`, `$lookup`, `$facet` and `$bucket`; this is the best place in the whole project to actually learn Mongo.

Two rules:

- **`$match` before `$lookup`.** Always narrow before joining.
- **`Attendance.subjectId` is denormalised on purpose** so per-subject percentages need no `$lookup` at all. Use it.

CSV export must stream rather than building one big string, and must escape properly — a student named `O'Brien, Jr.` breaks a naive implementation.

## Definition of done

- At-risk list returns exactly `student04` at the 75% threshold on seed data, in a test
- Every number matches the equivalent number in the student portal (see Agreements)
- Exported CSVs open correctly in Excel and Google Sheets
- No aggregate computed with a JavaScript loop over all documents

## First tasks

- [ ] `packages/validation/src/analytics.ts` in W1
- [ ] Agree the attendance-percentage formula with Team 06 — **before** writing a pipeline
- [ ] Agree the chart library with Team 09, file one shared dependency request
- [ ] At-risk pipeline with the fixed-seed test
- [ ] CSV export with proper escaping

---

## Independence

**Blocked by: nothing.** Everything you need already exists — the models are scaffolded, auth is built, and `npm run seed` gives you 1,200 attendance rows and 221 submissions — every pipeline is testable now.

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
