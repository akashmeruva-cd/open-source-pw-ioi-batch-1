**Team 07 · 3 people · Builds W6**

Every class in the batch is a `ClassSession`. Team 06 marks attendance against your sessions and Team 04 attaches materials to them, so your model is load-bearing for two other teams.

## What you own

```
packages/models/src/class-session.ts       ← already scaffolded
packages/validation/src/sessions.ts
apps/api-student/src/modules/sessions/
apps/api-admin/src/modules/sessions/
apps/web-student/features/timetable/
apps/web-student/app/(dashboard)/timetable/
```

## What to build

**Student side** — a weekly grid (days across, time down), "today's classes" for the dashboard with the next class highlighted, and a session detail view linking to that session's materials.

**Admin/faculty side** — a timetable builder: create sessions for a subject, repeat weekly for N weeks, move or cancel a session, and set room and faculty.

**Endpoints**

| API     | Method | Path                                                  |
| ------- | ------ | ----------------------------------------------------- |
| student | GET    | `/api/sessions/timetable?from=&to=`                   |
| student | GET    | `/api/sessions/today`                                 |
| student | GET    | `/api/sessions/:id`                                   |
| admin   | POST   | `/api/sessions` · `POST /api/sessions/bulk`           |
| admin   | PATCH  | `/api/sessions/:id` · `POST /api/sessions/:id/cancel` |

## Time zones will get you

Store everything in UTC (Mongo does this already). Render in the user's local zone. "Today" means today _for the student_, which is not the same as today in UTC — a 9am class in IST is 03:30 UTC the same day, but an evening class can land on the next UTC date.

Decide early whether the batch has a single fixed time zone (almost certainly yes for one college) and write it down. That decision makes "today's classes" simple; discovering it in W8 makes it painful.

Cancelling sets `isCancelled`, it does not delete — Team 06 still needs the row so a cancelled class doesn't count against attendance.

## Definition of done

- The weekly grid matches the seeded sessions exactly
- "Today's classes" is correct at 11pm local time, not just at midday
- Bulk-creating a 15-week schedule is one request
- Cancelling a session removes it from attendance denominators (coordinate with Team 06)

## First tasks

- [ ] `packages/validation/src/sessions.ts` in W1
- [ ] Agree the time-zone rule with Teams 06 and 09, write it in `docs/`
- [ ] Weekly grid UI against mocks
- [ ] Bulk session creation ("every Tuesday 9am for 15 weeks")

---

## Independence

**Blocked by: nothing.** Everything you need already exists — the models are scaffolded, auth is built, and `npm run seed` gives you 48 sessions — 30 past, 18 upcoming, so today's-classes has real answers.

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
