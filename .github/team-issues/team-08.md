**Team 08 · 3 people · Builds W6**

Announcements are how faculty reach the batch. Notifications are how the app tells a student something changed without them having to check. You own both, plus the plumbing every other team hooks into.

## What you own

```
packages/models/src/announcement.ts   packages/models/src/notification.ts
packages/validation/src/announcements.ts
apps/api-student/src/modules/announcements/
apps/api-admin/src/modules/announcements/
apps/web-student/features/announcements/
```

## What to build

**Student side** — an announcement feed with pinned items first, a notification bell with unread count, mark-as-read, and a notifications page.

**Admin/faculty side** — compose an announcement for the whole batch or one subject, pin/unpin, edit, delete.

**Endpoints**

| API     | Method | Path                                                               |
| ------- | ------ | ------------------------------------------------------------------ |
| student | GET    | `/api/announcements?subjectId=`                                    |
| student | GET    | `/api/notifications?unread=true`                                   |
| student | PATCH  | `/api/notifications/:id/read` · `POST /api/notifications/read-all` |
| admin   | POST   | `/api/announcements` · PATCH `/:id` · DELETE `/:id`                |

## The part other teams depend on

Export a small service the other teams call:

```ts
await notify(userIds, {
  type: 'SUBMISSION_GRADED',
  title: 'Your DBMS assignment was graded',
  body: '18/20',
  href: '/assignments/abc123',
})
```

Teams 04, 05, 06 and 12 will call this. Design it in W1 and tell them, so they build against it rather than around it.

**Do not fan out one document per user in a loop.** For a batch announcement that is 40 inserts — use `insertMany`, and think about whether an announcement needs per-user notification rows at all, or whether "unread" can be derived from a last-read timestamp on the user.

## Email digest (second milestone)

A weekly or daily email summarising what changed. Needs a mail provider (Resend or Postmark both have free tiers) — file a `dependency request` early, and coordinate with Team 03 who also need email for password reset. **One provider, one integration, shared between you.**

## Definition of done

- Publishing an announcement shows it in the student feed immediately
- The bell shows an accurate unread count and clears correctly
- At least two other teams are successfully calling `notify()`
- No N+1 writes when notifying a whole batch

## First tasks

- [ ] `packages/validation/src/announcements.ts` in W1
- [ ] Announcement feed + compose UI against the seeded announcements
- [ ] Notification bell with unread count (the seed leaves 4 unread)
- [ ] Publish the `notify()` interface so other teams can code against it — **post-MVP**, nobody is blocked on it

---

## Independence

**Blocked by: nothing.** Everything you need already exists — the models are scaffolded, auth is built, and `npm run seed` gives you 4 announcements and 6 notifications (4 unread on student01/02).

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
