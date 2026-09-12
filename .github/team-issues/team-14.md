**Team 14 · QA & Testing · 3 people · Builds from W2**

> **Scope.** Feature teams test their own unit logic — every team's "Definition of ready to merge" already requires a happy path, an auth test, and one abuse test. Team 14 owns everything that _crosses_ team boundaries: full-journey E2E flows, regression catching, cross-feature integration scenarios, and the QA checklist that reviewers use before merging.

You are the safety net the whole batch shares. When a fix in Team 05 silently breaks Team 12's at-risk calculation, you catch it before `main` does.

## What you own

```
scripts/e2e/                        Playwright E2E test suite (scenarios)
docs/qa-checklist.md                The pre-merge QA checklist all teams follow
.github/ISSUE_TEMPLATE/qa_test_task.yml
```

**You read, but do not modify:**

```
apps/*/src/                         — you write tests against running apps, not inside feature folders
packages/*/src/                     — same rule
```

**Your relationship with Team 01 is a clean split:**

| Team 01 owns                                                              | Team 14 owns                                                            |
| ------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| The Playwright harness (install, config, `playwright.config.ts`, CI step) | The E2E _scenarios_ for every cross-team flow                           |
| The unit test harness (Jest config, shared fixtures, test utilities)      | Filing bugs when cross-team flows break; triage and regression tracking |
| CI green on `main`                                                        | Pre-release QA sign-off                                                 |

## What to build

### Cross-team E2E scenarios (Playwright)

Each scenario covers a flow that spans two or more teams' code. These are the tests no single feature team would naturally write:

| Scenario                                                                            | Teams crossed |
| ----------------------------------------------------------------------------------- | ------------- |
| Sign up → verify → sign in as student                                               | 03 · 02       |
| Faculty publishes assignment → student submits → faculty grades → student sees mark | 05 · 10       |
| Admin marks attendance → student attendance % updates → AI assistant quotes it      | 06 · 13       |
| Admin posts announcement → student sees notification bell badge                     | 08 · 09       |
| Admin imports batch CSV → student can sign in under new batch                       | 10 · 03       |
| Student at 33% (seed: student04) appears on at-risk report                          | 06 · 12       |
| Material uploaded by faculty → student can search and download it via AI assistant  | 04 · 13       |

Start with the first two. The seed gives you all the data you need on day one.

### QA checklist (`docs/qa-checklist.md`)

A short, scannable document reviewers open before clicking "Approve". It should cover:

- Does `npm run lint && npm run typecheck && npm run test` pass?
- Does the happy path work against `npm run seed` data?
- Is auth enforced (can an unauthenticated request reach this endpoint)?
- Is the ownership rule enforced (can student A access student B's data)?
- Is the PR under ~400 lines?
- Are any locked files touched without maintainer sign-off?

### Bug triage

When CI goes red on `main` for a cross-team reason, you file a bug issue, tag the owning team, and track it to resolution. You are not responsible for fixing it — the owning team is — but you are responsible for knowing it exists.

## Endpoints you'll test against

You do not own any endpoints. You call the same student and admin APIs the apps call:

- `POST /api/auth/login` — student and admin accounts
- Feature endpoints from Teams 04–13

Use seeded credentials (`student01@college.edu`, `faculty1@college.edu`, `admin@college.edu` — all `password123`).

## Definition of done

- Every cross-team scenario in the table above has a passing Playwright test
- `docs/qa-checklist.md` is published and linked from `CONTRIBUTING.md`
- At least one regression caught by your suite before it reached `main`
- CI runs your E2E suite on every PR (Team 01 wires the CI step; you hand them the script)

## First tasks

- [ ] Read `docs/onboarding.md` and get the full local stack running
- [ ] Read `docs/code-review.md` — this is the bar you enforce
- [ ] Write `docs/qa-checklist.md` draft and open a PR for maintainer review in W2
- [ ] Implement the "sign up → sign in" E2E scenario against the Playwright harness Team 01 builds
- [ ] Implement the "assignment → submit → grade → student sees mark" scenario in W3
- [ ] Add remaining cross-team scenarios progressively through W4–W7

---

## Independence

**Blocked by: Team 01** (Playwright harness must exist before you can write scenarios — coordinate in W1 so the harness is ready for W2).
**Blocked by: nothing else.** The seed provides all data; you never wait for a feature team to ship before writing the test skeleton against mocks.

Two rules keep it that way:

- **Never call another team's HTTP endpoint from within a feature module.** Your tests call running apps via HTTP — that is correct. Feature code may not.
- **Merge your `docs/qa-checklist.md` in week 2**, before the first batch of PRs lands for review in W3.

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
