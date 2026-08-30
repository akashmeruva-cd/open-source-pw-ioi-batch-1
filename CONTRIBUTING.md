# Contributing

This is the **reference** — conventions, locked files, the git workflow. It is
written to be read once and then referred back to.

If you're starting out, read these first instead:

| Doc                                                                | What it gives you                                      |
| ------------------------------------------------------------------ | ------------------------------------------------------ |
| [docs/onboarding.md](docs/onboarding.md)                           | The project running locally, in ~15 minutes            |
| [docs/how-we-work.md](docs/how-we-work.md)                         | **The thinking behind all of this** — read it properly |
| [docs/first-contribution.md](docs/first-contribution.md)           | Issue → branch → PR → merged, step by step             |
| [docs/recipes/build-a-feature.md](docs/recipes/build-a-feature.md) | A full vertical worked through                         |
| [docs/code-review.md](docs/code-review.md)                         | How to review, and how to be reviewed                  |

---

## The one thing to understand

Thirteen teams commit to this repo on the same weekends. Almost every rule below
exists to answer one question: _how do 43 people work in one repository without
spending Saturday resolving merge conflicts?_

The answer is **vertical slices**. Your team owns a folder at every layer —
model, API module, validation schema, frontend feature folder — and works inside
those folders. See [docs/teams.md](docs/teams.md) for which ones are yours, and
[docs/how-we-work.md](docs/how-we-work.md) for why it's built this way.

Two rules follow from it, and they are the ones that actually keep you unblocked:

- **Never call another team's HTTP endpoint.** Need their data? Import their
  model and read it directly. Model files are shared; module folders are owned.
- **Merge your Zod schema before writing implementation code.** It's the
  contract that lets the frontend and backend halves of your team build at the
  same time instead of one waiting for the other.

---

## Locked files

Some files are shared by everyone, so they cannot be edited casually. These are
enforced by [`.github/CODEOWNERS`](.github/CODEOWNERS): a PR touching them needs
a lead's review.

| File                                          | Owner                | If you need a change                    |
| --------------------------------------------- | -------------------- | --------------------------------------- |
| `package.json`, `package-lock.json`           | Team 01              | Open a **dependency request** issue     |
| `turbo.json`, `.github/`                      | Team 01              | Issue for Team 01                       |
| `apps/api-*/src/app.ts`                       | Team 01              | You almost certainly do not — see below |
| `apps/api-admin/src/app.ts` and `app.test.ts` | Team 03 + maintainer | Never weaken the role gate              |
| `packages/auth/**`                            | Team 03 + maintainer | Issue, then a reviewed PR               |
| `packages/models/src/db.ts`                   | Team 01              | Issue for Team 01                       |
| `packages/ui/**`, `theme.css`                 | Team 02              | Issue for Team 02                       |
| Root `layout.tsx`, dashboard `layout.tsx`     | Team 02              | Issue for Team 02                       |

**Dependencies are frozen after week 1.** Every new package changes two files
all thirteen teams share. Team 01 batches approved requests into one PR each
week. Before requesting, check whether `@repo/ui` already has what you need.

---

## Append-only registries

Three files are shared but _designed_ to be edited by everyone, because each team
adds exactly one line and git merges non-adjacent line additions cleanly:

- `apps/api-student/src/modules.ts` and `apps/api-admin/src/modules.ts`
- `apps/web-*/components/nav/items/registry.ts`
- `scripts/seed/index.ts`

Add your line **in alphabetical order**. Do not reorder, regroup, or reformat
other teams' lines — that turns a clean merge into a conflict for someone else.

---

## Adding a backend feature

Copy `apps/api-student/src/modules/auth/` — it is the reference vertical.

```
modules/materials/
  materials.module.ts       exports { basePath, router }
  materials.routes.ts       routing + middleware only
  materials.controller.ts   reads req, calls service, sends res
  materials.service.ts      all the logic; never touches req/res
  materials.test.ts
```

Then add one line to `src/modules.ts`. You should never need to edit `app.ts`.

Rules that apply to every module:

- Wrap async handlers in `asyncHandler` (`@repo/http/async-handler`) — Express 4
  silently hangs on an unhandled promise rejection.
- Validate input with `validate(schema)` (`@repo/http/validate`). After it runs,
  trust `req.body`.
- Throw `HttpError` (`@repo/http/http-error`). Do not send error responses
  yourself; the error middleware owns that shape.
- Read the caller's identity from `currentUser(req)` **only** — never from the
  body, a query param, or a header.
- Schemas live in `packages/validation/src/<feature>.ts`, never inline in a
  route file. That file is the contract the frontend half of your team is
  already coding against.

## Adding a frontend feature

```
apps/web-student/
  app/(dashboard)/materials/page.tsx    thin — composes the feature
  features/materials/
    components/   hooks/   api.ts
```

- Never call `fetch` directly — use `api` from `@/lib/api-client`.
- Types come from `@repo/validation/<feature>`.
- Every list renders **three** states: loading (`Skeleton`), empty
  (`EmptyState`), data. A blank screen is indistinguishable from a bug.
- Add a nav entry only when the route actually exists.

## Adding a model

Add your table definition to `packages/models/src/schema.ts` and re-export it from a dedicated file in `packages/models/src/`. Import subpaths:
`import { materials } from '@repo/models/material'`.

---

## Git workflow

**Branches:** `t<NN>/<short-description>` — e.g. `t06/attendance-percentage`.
The team number makes ownership obvious in a list of forty branches.

**Commits:** conventional commits — `feat(attendance): add percentage endpoint`,
`fix(auth): reject rotated refresh tokens`.

**Pull requests:**

- One issue, one PR, one person.
- **Under ~400 lines.** Bigger PRs sit unreviewed for a week, which blocks you
  and everyone downstream. Split them.
- Fill in the template honestly. "How I tested it" means what you actually ran,
  not "it works".
- Needs one peer review from your team plus one lead review.
- `main` is protected: squash merge, linear history, CI green. The merge queue
  handles keeping your branch up to date — do not rebase everything by hand.

**Before you open a PR:**

```bash
npm run lint
npm run typecheck
npm run test
```

---

## Testing

Every endpoint needs three tests: the happy path, the auth requirement, and one
way it can be abused. `apps/api-student/src/modules/auth/auth.test.ts` shows the
shape.

---

## Finding work

Issues are labelled `team:NN`, `area:*` and `difficulty:*`. Start with
[`good first issue`](../../labels/good%20first%20issue) filtered to your team.

Comment on an issue to claim it before you start, so two people do not build the
same thing. If you get stuck for more than an hour, say so in the issue — asking
early is not a failure, and it is much cheaper than a week of silence.

## Code of conduct

By participating you agree to the [Code of Conduct](CODE_OF_CONDUCT.md). It is
short; read it.

## Security

Found a vulnerability? Do **not** open a public issue. See
[SECURITY.md](SECURITY.md).
