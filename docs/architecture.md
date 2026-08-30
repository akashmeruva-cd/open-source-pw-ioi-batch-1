# Architecture

## The shape of it

```
┌──────────────────┐        ┌──────────────────┐
│  web-student     │        │  web-admin       │   Next.js 16 on Vercel
│  :3000  + AI chat│        │  :3001           │
└────────┬─────────┘        └────────┬─────────┘
         │ REST + Bearer JWT         │ REST + Bearer JWT (ADMIN/FACULTY only)
┌────────▼─────────┐        ┌────────▼─────────┐
│  api-student     │        │  api-admin       │   Express on Vercel Functions
│  :4000           │        │  :4001           │
│  └ assistant ──┐ │        │  every route      │
└────────┬───────┼─┘        │  behind role gate │
         │       │          └────────┬─────────┘
         │  ┌────▼──────┐            │
         │  │ Claude API│            │
         │  └───────────┘            │
         └───────────┬───────────────┘
              ┌───────────────────────────┐
              │         Supabase          │
              │ (PostgreSQL + Auth + Storage)
              └───────────────────────────┘
```

## Why two APIs

One API with `requireRole('ADMIN')` sprinkled through it would be less code. We
run two because of how this project is built: thirteen teams, most writing their
first production code, all merging on the same weekend. In that setting, the
question is not "will someone forget a role guard" but "when someone does, what
happens".

With a separate `api-admin`, the answer is _nothing_ — `src/app.ts` mounts every
module behind `requireAuth` + `requireRole('ADMIN', 'FACULTY')`, so a forgotten
guard inside a module is a defence-in-depth failure rather than a data breach.
`src/app.test.ts` exists purely to prove that gate holds.

The cost is duplication, which we pay down by putting everything shareable in
`packages/`: models, auth, HTTP plumbing, validation schemas, UI. The only thing
genuinely duplicated between the two APIs is the small amount of controller code
where their behaviour actually differs (the admin portal has no registration).

Full reasoning: [adr/0001-separate-admin-api.md](adr/0001-separate-admin-api.md).

## Request lifecycle

Take `GET /api/attendance/me` on the student API:

1. **`app.ts`** — helmet, CORS, JSON body parsing, cookie parsing.
2. **DB middleware** — `getDb()` initialises / resolves the cached Drizzle
   connection. On a warm serverless invocation this is a no-op.
3. **`modules.ts`** — the router registered at `/api/attendance` handles it.
4. **`requireAuth`** — verifies the Supabase JWT and sets `req.auth`. This is the
   only trustworthy source of the caller's identity.
5. **`validate(schema)`** — parses `req.query` against the Zod schema from
   `packages/validation`. After this, the handler can trust its input.
6. **Controller** — reads `currentUser(req)`, calls the service, sends JSON.
7. **Service** — all the actual logic. Never touches `req` or `res`, which is
   what makes it testable and reusable.
8. **`createErrorHandler`** — anything thrown lands here and becomes
   `{ error: { code, message, details } }`. Nothing else sends an error body.

## Auth

Managed by **Supabase Auth** with session verification in `@repo/auth`:

|           | Access token             | Refresh token                        |
| --------- | ------------------------ | ------------------------------------ |
| What      | Supabase JWT             | Supabase Refresh Token               |
| Lives     | 1 hour                   | 7 days                               |
| Stored    | In memory in the browser | httpOnly cookie; managed by Supabase |
| Sent as   | `Authorization: Bearer`  | Automatically, by the browser        |
| Revocable | No (short-lived)         | Yes (via Supabase Auth API)          |

The access token is short-lived precisely because it cannot be revoked. It is
kept in a JavaScript variable rather than `localStorage` — anything readable by
JavaScript is readable by an XSS payload.

### Why the frontend guard is not in `middleware.ts`

The refresh cookie is set by the API, which is on a different domain to the
frontend. Next.js middleware runs on the frontend's domain and cannot see that
cookie — a middleware guard would either always pass or always fail. So the
guard is client-side (`components/require-auth.tsx`), which renders a skeleton
until a silent refresh resolves.

This is a real trade-off, not an oversight: it means a moment of skeleton on
first paint. If the APIs ever move behind the frontends' own domain via a
rewrite, this should be revisited.

## Data

Drizzle ORM tables in `packages/models/src/schema.ts`, with re-exports per model. Two things to know:

**Subpath exports.** Import subpaths directly:
`import { profiles } from '@repo/models/user'`.

**Connection caching.** `db.ts` stashes connection instances on
`globalThis` so warm serverless invocations reuse connection pools.

The two tables that grow fastest are `attendance` (students × sessions) and
`submissions` (students × assignments). Both have unique compound indexes that
make duplicate rows impossible rather than merely unlikely.

## The AI assistant

Team 13's module gets tools that map onto endpoints the other teams already
built, and calls them **with the requesting student's own JWT**. That is the
entire security model: the assistant inherits the caller's permissions and
structurally cannot read another student's records, because it has no database
access of its own.

The rule that makes this work: **the model never supplies a student id.** It
always comes from `currentUser(req)` server-side. If a tool definition ever
takes a `studentId` parameter, that is a bug.

## Conventions that exist because of the team size

| Convention                                     | What it prevents                               |
| ---------------------------------------------- | ---------------------------------------------- |
| Self-registering modules + `modules.ts`        | Thirteen teams editing `app.ts`                |
| No barrel files                                | Thirteen teams editing `models/index.ts`       |
| Nav entries as one file each + registry        | Thirteen teams editing a nav array             |
| Dependencies frozen after week 1               | Constant `package-lock.json` conflicts         |
| Design tokens in `packages/ui/src/theme.css`   | Thirteen shades of blue                        |
| Zod schemas merged before code                 | Frontend and backend building different things |
| **No team calls another team's HTTP endpoint** | **Teams blocking on each other's ship dates**  |
| **The seed populates every collection**        | **Teams idle for want of data**                |

### Read models, not each other's endpoints

A team that needs another team's data imports that model and queries it
directly, read-only. It never calls their REST endpoint.

Model files are shared and importable. Module folders are owned. So reading
`Attendance` from Team 12's analytics module creates no merge conflict with
Team 06 and — more importantly — no _schedule_ dependency: Team 12 can build
every aggregation in week 2 against seeded data, long before Team 06 exposes an
endpoint.

The cost is that the same logic can be written twice. Where that actually
matters — the attendance-percentage formula is the real case — the owning team
publishes the calculation and the others reuse it. That is one of the four
agreements in `docs/teams.md`.

One place this trade is sharper: the AI assistant's tools read models directly
rather than calling authenticated endpoints, so it no longer inherits the
caller's permissions _structurally_. Every tool query must filter by
`currentUser(req).sub`, no tool schema may accept a `studentId`, and a
cross-student abuse test is required before it merges.

None of these are best practice in the abstract. They are specifically the rules
that let a large group work in one repo at the same time.
