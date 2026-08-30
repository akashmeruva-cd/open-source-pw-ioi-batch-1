**Team 11 · 3 people · Builds W2–W3**

Who is in the system, what they are allowed to do, and a record of who changed what. Small surface area, high blast radius.

## What you own

```
packages/models/src/audit-log.ts           ← already scaffolded
packages/validation/src/users.ts
apps/api-admin/src/modules/users/
apps/web-admin/app/(admin)/{users,audit-log}/
```

## What to build

**User management** — list users with filters (role, batch, active), create faculty and admin accounts, edit details, deactivate and reactivate, and reset a user's password.

**Roles** — promote/demote between `STUDENT`, `FACULTY`, `ADMIN`, with the safety rules below.

**Audit log** — a filterable view of every privileged action: who, what, when, to whom.

**Endpoints**

| Method | Path                                        |
| ------ | ------------------------------------------- |
| GET    | `/api/users?role=&batchId=&isActive=`       |
| POST   | `/api/users`                                |
| PATCH  | `/api/users/:id`                            |
| PATCH  | `/api/users/:id/role`                       |
| POST   | `/api/users/:id/deactivate` · `/reactivate` |
| GET    | `/api/audit-log?entity=&actorId=`           |

## Rules that are not optional

- **Only `ADMIN` changes roles.** Faculty can view users, never promote.
- **An admin cannot demote or deactivate themselves.** Guess how a batch loses its last admin at 2am. Guard it explicitly and test it.
- **Deactivating revokes sessions.** Call `revokeAllSessionsForUser` from `@repo/auth/session` — otherwise a deactivated user keeps working for up to 7 days on their existing refresh token. Coordinate with Team 03.
- **Never return `passwordHash`.** It is `select: false` on the schema; keep it that way and add a test asserting no user response contains it.
- **Every privileged action writes an `AuditLog` row.** Role changes, deactivations, deletions, password resets. This is the whole point of your team existing.

## Audit log design

Write the log entry in the same request that performs the action, not in a background job — an action that succeeds while its log entry fails is worse than useless. Keep entries append-only: no edit, no delete, not even for admins.

## Definition of done

- An admin creates a faculty account and assigns them a subject (with Team 10)
- Deactivating a user logs them out everywhere within seconds
- The last admin cannot lock themselves out
- Every role change appears in the audit log with actor, target and timestamp
- No API response anywhere contains a password hash (tested)

## First tasks

- [ ] `packages/validation/src/users.ts` in W1
- [ ] User list + create/edit UI
- [ ] Role change endpoint with the self-demotion guard and its test
- [ ] Audit log write helper other teams can call, plus the viewer UI

---

## Independence

**Blocked by: nothing.** Everything you need already exists — the models are scaffolded, auth is built, and `npm run seed` gives you 44 users across all three roles.

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
