**Team 03 · 4 people · Active from W1 (foundation — nothing works until login does)**

You own who is allowed to do what. This is the most security-sensitive code in the repo, and the reference implementation every other backend team copies.

## What you own

```
packages/auth/src/{jwt,password,middleware,session}.ts
packages/models/src/user.ts   packages/models/src/refresh-token.ts
apps/api-student/src/modules/auth/    ← the reference vertical
apps/api-admin/src/modules/auth/
apps/api-admin/src/app.ts             ← the role gate
apps/api-admin/src/app.test.ts        ← the test that proves it
apps/web-*/lib/auth-context.tsx   apps/web-*/components/require-*.tsx
apps/web-*/app/(auth)/
```

## What already exists

Login, registration, refresh-token rotation, logout, `/me`, role middleware, the admin role gate, and 16 passing tests. **Read this code before writing any — it is the pattern the other teams are told to copy.**

Specifically, understand _why_:

- Access tokens live 15 minutes and are held **in memory**, never `localStorage` (XSS)
- Refresh tokens are opaque random strings stored as SHA-256 hashes, and **rotate** on use — a token presented twice fails, which is how theft becomes visible
- Login returns the **same error** for a wrong password and an unknown email
- `api-admin` mounts every module behind the role gate in `app.ts`, so a module cannot forget to guard itself

## Your job

- Password reset by email (needs a mail provider — coordinate with Team 08)
- "Change my password" while signed in, which must revoke other sessions
- Session list / "sign out everywhere" using `revokeAllSessionsForUser`
- Restrict registration to the college email domain once the domain is confirmed
- Help other teams get their role checks right — you are the reviewers for anything touching `requireRole`

## Definition of done

- A student can recover a forgotten password without an admin
- No endpoint anywhere trusts a user id from a request body, query or header
- `api-admin/src/app.test.ts` still passes, and you have added cases for every new role rule

## First tasks

- [ ] Password reset flow (request → emailed token → set new password), single-use, 1-hour expiry
- [ ] Change password while signed in + revoke other sessions
- [ ] Domain restriction on registration
- [ ] Document the token model in `docs/` with a sequence diagram

## Watch out for

`packages/auth/` needs a maintainer's review to merge. That is not distrust — a mistake here is worth more than a mistake anywhere else in the repo.

---

## Independence

**Blocked by: nothing.** Everything you need already exists — the models are scaffolded, auth is built, and `npm run seed` gives you 1 admin, 3 faculty, 40 students, all with password123.

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
