**Team 09 · Student Profile & Notes · 3 people · Builds from W1**

> **Scope changed.** This team was originally "Dashboard", which owned no data and consumed five other teams — meaning you'd have been blocked until week 7. You now own two models of your own and ship a standalone vertical. The dashboard becomes a small composition task in the integration weekend.

Everything a student keeps for themselves: their profile, their private notes, and the things they've saved.

## What you own

```
packages/models/src/note.ts        packages/models/src/bookmark.ts
packages/validation/src/notes.ts
apps/api-student/src/modules/notes/
apps/api-student/src/modules/profile/
apps/web-student/features/{notes,profile}/
apps/web-student/app/(dashboard)/{notes,profile}/
apps/web-student/app/(dashboard)/dashboard/page.tsx   ← integration weekend only
```

## MVP — ships alone, depends on nobody

**Notes** — create, edit, delete and pin personal notes, optionally attached to a subject. List with search and filter by subject. This is real CRUD with a real privacy requirement.

**Bookmarks** — save a material, assignment or announcement; a "Saved" page listing them. `Bookmark` is polymorphic-lite (`entityType` + `entityId`), so it works for all three without needing those teams to change anything.

**Profile** — view and edit name and avatar, see batch and enrolled subjects, change password (Team 03 already owns that endpoint — call it, don't rebuild it).

**Endpoints**

| Method       | Path                 |
| ------------ | -------------------- |
| GET/POST     | `/api/notes`         |
| PATCH/DELETE | `/api/notes/:id`     |
| GET/POST     | `/api/bookmarks`     |
| DELETE       | `/api/bookmarks/:id` |
| GET/PATCH    | `/api/profile/me`    |

## The rule that matters most here

**Every query filters by `currentUser(req).sub`.** Not "the UI only shows your own notes" — the _query_ must be scoped. A note is the most personal thing in this app, and `GET /api/notes/:id` returning someone else's note is the exact bug to avoid.

Write this test before the feature works:

```
student02 requests student01's note id → 404 (not 403 — don't confirm it exists)
```

The seed gives student01, student02 and student03 three notes each, so you can test this on day one.

## Integration weekend (post-MVP)

Assemble the dashboard: attendance summary, what's due this week, recent materials, pinned announcements, today's classes. By then those models are populated and the other teams' modules exist.

**Read the models directly** in your own `modules/dashboard/` — one request, not five. Do not call other teams' HTTP endpoints.

## Definition of done

- A student writes, pins, edits and deletes notes; searches them; filters by subject
- Saving a material shows it on the Saved page
- Student A cannot read, edit or delete student B's note or bookmark (tested)
- Avatar upload works (same Cloudinary helper as Team 04 — see Agreements)

## First tasks

- [ ] `packages/validation/src/notes.ts` in W1
- [ ] Notes CRUD with the cross-student privacy test written first
- [ ] Notes UI — list, editor, pin, search
- [ ] Bookmarks + Saved page
- [ ] Profile page with avatar upload

---

## Independence

**Blocked by: nothing.** Everything you need already exists — the models are scaffolded, auth is built, and `npm run seed` gives you 9 notes and 4 bookmarks across student01–03.

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
