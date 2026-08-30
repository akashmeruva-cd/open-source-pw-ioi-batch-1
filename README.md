# Program Tracker

An open-source program tracker for a college batch. Students find class slides,
submit assignments, check their attendance and ask an AI assistant about their
own academic data. Faculty and admins run the batch from a separate portal.

Built by ~46 students in 14 teams. If you are one of them, read these two, in
order:

1. **[docs/onboarding.md](docs/onboarding.md)** — running locally, ~15 minutes.
   You need Node and Git; nothing else, no accounts.
2. **[docs/how-we-work.md](docs/how-we-work.md)** — the thinking behind the
   repo and how a weekend actually runs.

Then **[docs/first-contribution.md](docs/first-contribution.md)** walks you from
picking an issue to a merged PR. Full index: **[docs/](docs/README.md)**.

**Stack:** Supabase (PostgreSQL + Auth + Storage) · Drizzle ORM · Express · React (Next.js) · Node — with Claude for the assistant. Everything deploys to Vercel.

---

## What is in here

```
apps/
  web-student/    Next.js — the student portal            :3000
  web-admin/      Next.js — the admin & faculty portal    :3001
  api-student/    Express — the student API               :4000
  api-admin/      Express — the admin API                 :4001
packages/
  models/         Drizzle ORM schema & Supabase DB client
  validation/     Zod schemas — the contract between frontend and backend
  auth/           Supabase JWT verification and role middleware
  http/           HttpError, request validation, error middleware
  client/         The browser-side API client both frontends use
  ui/             Shared components and the design tokens
scripts/seed/     Demo data — one batch, 6 subjects, 40 students
docs/             Architecture, onboarding, deployment, team ownership
```

Two APIs rather than one is deliberate: `api-admin` mounts every route behind a
role gate, so a bug in student-facing code cannot expose admin functionality.
See [docs/adr/0001-separate-admin-api.md](docs/adr/0001-separate-admin-api.md).

## Quick start

```bash
git clone <this repo>
cd open-source-pw-ioi-batch-1
npm install

cp .env.example .env

npm run db:local          # terminal 1 — local Supabase stack (PostgreSQL + Auth + Studio)
npm run seed              # terminal 2 — wipes the dev database, loads demo data
npm run dev               # starts all four apps
```

Then open <http://localhost:3000> and sign in:

| Role    | Email                   | Password      |
| ------- | ----------------------- | ------------- |
| Student | `student01@college.edu` | `password123` |
| Faculty | `faculty1@college.edu`  | `password123` |
| Admin   | `admin@college.edu`     | `password123` |

The admin portal is a separate app at <http://localhost:3001>. A student account
cannot sign in there — that is the point of it.

Full setup — including MongoDB Atlas or Docker if you prefer them — is in
[docs/onboarding.md](docs/onboarding.md).

## Contributing

New here? **[docs/first-contribution.md](docs/first-contribution.md)** is the
step-by-step walkthrough. [CONTRIBUTING.md](CONTRIBUTING.md) is the reference
for conventions and which files are locked.

Looking for something to work on? Filter issues by
[`good first issue`](../../labels/good%20first%20issue) and your `team:NN` label,
then **comment on the issue to claim it** — that's the only thing stopping two
people from building the same screen.

Three things worth knowing before your first PR:

- **Your Zod schema in `packages/validation` gets merged first**, before either
  half of your team writes implementation code. It's what lets you work in
  parallel.
- **Keep PRs under ~400 lines** and merge them the same weekend. Big PRs sit
  unreviewed and block you.
- **Every endpoint needs three tests** — happy path, auth requirement, and one
  way it can be abused. The third finds the real bugs.

## Licence

MIT — see [LICENSE](LICENSE).
