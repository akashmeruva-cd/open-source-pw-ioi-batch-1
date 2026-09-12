**Team 01 · 3 people · Active from W0 (foundation — everyone else depends on you)**

You own the machinery the other twelve teams build on: the monorepo, CI, deployments, the database connection, the seed harness and the test harness. When someone says "I can't get it running", that is your issue.

## What you own

```
package.json  package-lock.json  turbo.json  tsconfig.json
.github/workflows/  .github/CODEOWNERS  .github/ISSUE_TEMPLATE/
packages/config/   packages/http/   packages/client/
packages/models/src/db.ts   packages/models/src/define-model.ts
scripts/seed/index.ts   scripts/seed/core.seed.ts
apps/*/vercel.json   apps/*/api/index.ts   apps/*/src/app.ts
```

## Your job

- **Keep `main` green.** CI runs lint → typecheck → test → build on every PR. When it breaks for a reason that isn't one team's code, it's yours.
- **Own the dependency freeze.** Dependencies are frozen after W1. Teams file `dependency request` issues; you batch approved ones into one PR per week. This exists because `package-lock.json` is the single worst merge-conflict file in the repo.
- **Own the four Vercel projects.** Root directories, environment variables, and `npx turbo-ignore` as the Ignored Build Step on all four — without it, one CSS change redeploys everything and you'll hit the Hobby daily limit with 43 people pushing.
- **Own the E2E suite.** You build the Playwright harness; every other team contributes its own scenario.
- **Own the seed script.** `scripts/seed/core.seed.ts` gives everyone a realistic batch. Teams add `scripts/seed/<feature>.seed.ts` and one line to `index.ts`.

## Definition of done for the project

- A new contributor goes from `git clone` to a working local app in under 15 minutes following `docs/onboarding.md`
- CI is under ~3 minutes on a typical PR
- All four Vercel projects deploy from `main` and preview on every PR
- `npm run seed && npm run dev` works on macOS, Linux and Windows/WSL

## First tasks

- [ ] Verify `docs/onboarding.md` on a machine that has never run this project
- [ ] Set up the four Vercel projects and confirm previews work on a PR
- [ ] Add `required_status_checks` to the branch ruleset so CI is actually enforced
- [ ] Build the Playwright harness with one smoke test (login → dashboard)
- [ ] Add a Windows/WSL section to onboarding if anything differs

## Watch out for

The serverless connection cache in `packages/models/src/db.ts` is the reason Atlas doesn't run out of connections. Read the comment before touching it.

---

## Independence

**Blocked by: nothing.** You own the seed, and every other team's independence depends on it staying realistic. When a team says "I have no data to build against", that is your issue.

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
