# Deployment

Four Vercel projects from this one repository, plus Supabase (PostgreSQL + Auth + Storage).

## Vercel projects

Create four projects, all pointing at this repo, each with a different **Root
Directory**:

| Project                  | Root directory     | Framework preset |
| ------------------------ | ------------------ | ---------------- |
| `pw-tracker-student`     | `apps/web-student` | Next.js          |
| `pw-tracker-admin`       | `apps/web-admin`   | Next.js          |
| `pw-tracker-api-student` | `apps/api-student` | Other            |
| `pw-tracker-api-admin`   | `apps/api-admin`   | Other            |

The two API projects use the `vercel.json` already in their folder: it installs
from the repo root, builds the shared packages via Turbo, and rewrites every
path to `api/index.ts`, which exports the Express app. Vercel's Node runtime
accepts an Express app directly as a handler — that is the whole adapter.

### Skip builds that cannot be affected

On **every** project, set **Settings → Git → Ignored Build Step** to:

```bash
npx turbo-ignore
```

Without this, a one-line CSS change in the student portal redeploys all four
projects. With 43 contributors pushing, that is the difference between staying
inside the Hobby plan's daily deployment limit and not.

If you do hit the limit, that is the signal to move the team to a Pro seat
rather than to start batching pushes.

## Environment variables

Set these per project in **Settings → Environment Variables**. Note carefully
which ones must _not_ be set on the frontends.

| Variable                    | student web | admin web | api-student | api-admin |
| --------------------------- | :---------: | :-------: | :---------: | :-------: |
| `DATABASE_URL`              |      —      |     —     |     ✅      |    ✅     |
| `SUPABASE_URL`              |      —      |     —     |     ✅      |    ✅     |
| `SUPABASE_ANON_KEY`         |      —      |     —     |     ✅      |    ✅     |
| `SUPABASE_SERVICE_ROLE_KEY` |      —      |     —     |     ✅      |    ✅     |
| `SUPABASE_JWT_SECRET`       |      —      |     —     |     ✅      |    ✅     |
| `CORS_ORIGIN`               |      —      |     —     |     ✅      |    ✅     |
| `NEXT_PUBLIC_API_URL`       |     ✅      |    ✅     |      —      |     —     |
| `ANTHROPIC_API_KEY`         |      —      |     —     |     ✅      |     —     |

`CORS_ORIGIN` on each API is the URL of the frontend that talks to it:

```
api-student → CORS_ORIGIN=https://pw-tracker-student.vercel.app
api-admin   → CORS_ORIGIN=https://pw-tracker-admin.vercel.app
```

`NEXT_PUBLIC_API_URL` on each frontend is the URL of its API. The student app
never points at `api-admin`, and vice versa.

## Cookies across domains

The frontends and APIs are on different Vercel domains, so the refresh cookie is
cross-site. `auth.controller.ts` sets `sameSite: 'none'` and `secure: true` when
`NODE_ENV === 'production'`, which browsers require for cross-site cookies.

This is also why login works locally but silently fails on a first deploy if
`NODE_ENV` is not `production` on the API — the cookie gets `SameSite=Lax` and
the browser drops it.

## Databases

Supabase PostgreSQL database:

- Local dev: local PostgreSQL via `npx supabase start` (port 54322)
- Production: managed Supabase project

The seed script refuses to run against a connection string containing `prod`.
That check is the only thing standing between a tired contributor and the live
data, so do not name the production database something clever that gets past it.

## Preview deployments

Every PR gets four preview URLs (or fewer, thanks to `turbo-ignore`). Previews
share the production environment variables by default — **point the preview
`DATABASE_URL` at a dev database** so a preview cannot write to live data.

Batch contributors push branches to this repo rather than forks, specifically so
previews work: Vercel does not expose environment variables to fork PRs, which
would leave every preview broken.

## First deploy checklist

1. All four projects created with the right root directories.
2. Environment variables set per the table above.
3. `Ignored Build Step` set to `npx turbo-ignore` on all four.
4. Visit `<api-student>/api/health` and `<api-admin>/api/health` — both should
   return `{"ok":true}`.
5. Sign in to the student portal. Then try the same credentials on the admin
   portal; it must fail.
6. Open DevTools → Network on the deployed student portal and confirm no request
   or bundle contains `SUPABASE_SERVICE_ROLE_KEY` or `ANTHROPIC_API_KEY`.
