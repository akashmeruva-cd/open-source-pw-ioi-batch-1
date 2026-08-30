**Team 04 · 3 people · Builds W3 (core spine)**

Students need last week's slides. That is the single most-used feature in a tracker like this, so it needs to be fast, searchable, and obvious.

## What you own

```
packages/models/src/material.ts            ← already scaffolded
packages/validation/src/materials.ts       ← you write this first
apps/api-student/src/modules/materials/    ← read + search + download
apps/api-admin/src/modules/materials/      ← upload + manage
apps/web-student/features/materials/
apps/web-student/app/(dashboard)/materials/
```

## What to build

**Student side** — a library per subject: list with filters (subject, type, week), search by title, preview PDFs inline, download, and "recently added" on the dashboard.

**Admin/faculty side** — upload one or many files to a subject, optionally attach to a specific class session, edit title/description, delete.

**Endpoints**

| API     | Method | Path                              |
| ------- | ------ | --------------------------------- |
| student | GET    | `/api/materials?subjectId=&type=` |
| student | GET    | `/api/materials/search?q=`        |
| student | GET    | `/api/materials/:id`              |
| admin   | POST   | `/api/materials/upload-signature` |
| admin   | POST   | `/api/materials`                  |
| admin   | PATCH  | `/api/materials/:id`              |
| admin   | DELETE | `/api/materials/:id`              |

## Cloudinary uploads — read this carefully

The browser uploads **directly to Cloudinary**, never through our API. The flow:

1. Client asks `POST /api/materials/upload-signature` for a signed payload
2. API signs it server-side using `CLOUDINARY_API_SECRET` and returns signature + timestamp
3. Client PUTs the file straight to Cloudinary
4. Client posts the returned `publicId`/`url` back to `POST /api/materials`

**`CLOUDINARY_API_SECRET` must never leave the API.** Never prefix it with `NEXT_PUBLIC_`. In step 4, do not trust the client's claimed file size or type blindly — verify against Cloudinary if it matters.

Restrict uploads to PPT/PPTX/PDF/DOC/DOCX/ZIP and cap size (start at 50MB).

## Definition of done

- A student opens a subject and sees every material, newest first, with a working search
- A faculty member uploads a 20MB deck and it appears in the student portal immediately
- Only faculty/admin can upload; a student token gets 403
- `scripts/seed/materials.seed.ts` gives every subject a few materials

## First tasks

- [ ] Write `packages/validation/src/materials.ts` — do this in W1, it unblocks your frontend half
- [ ] Cloudinary signature endpoint + a test that the secret is never in a response
- [ ] Material list UI against mock data
- [ ] Upload UI with progress and error states

---

## Independence

**Blocked by: nothing.** Everything you need already exists — the models are scaffolded, auth is built, and `npm run seed` gives you 24 materials across 6 subjects, linked to sessions.

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
