# Onboarding — get it running in 15 minutes

This is the first thing you should do. If any step here fails, say so in
Discussions rather than pushing through — a broken local setup is the single
biggest reason first-time contributors give up.

## What you need

- **Node 20 or newer** — check with `node -v`. Install via [nvm](https://github.com/nvm-sh/nvm).
- **npm 10 or newer** — comes with Node.
- **Git**, and a GitHub account added to the repo by a lead.

**That is the whole list.** You do not need a MongoDB Atlas account, a
Cloudinary account, an Anthropic API key, or an email provider. Everything
external has a local driver:

| Service      | Local default          | What it does                                        |
| ------------ | ---------------------- | --------------------------------------------------- |
| Database     | `npm run db:local`     | Runs local Supabase (PostgreSQL + Auth + Studio)    |
| File storage | `STORAGE_DRIVER=local` | Writes uploads to `.local-uploads/`                 |
| Email        | `EMAIL_DRIVER=console` | Prints the email (and reset links) to your terminal |
| AI assistant | `AI_DRIVER=stub`       | Deterministic canned replies and tool calls         |

The real services are only used in deployed environments, where the maintainers
hold the credentials. You never need an account to build your feature.

## 1. Clone and install

```bash
git clone <this repo>
cd open-source-pw-ioi-batch-1
npm install
```

One `npm install` at the root covers all four apps and every shared package —
that is what the workspace setup buys us. Never run `npm install` inside
`apps/` or `packages/`.

## 2. Get a database

### Option A — Local Supabase (recommended)

Make sure **Docker Desktop** is installed and running, then:

```bash
npm run db:local
```

This starts local PostgreSQL, Supabase Auth, and the Supabase Studio dashboard at <http://localhost:54323>.

### Option B — Supabase Cloud Project

1. Create a free project at <https://supabase.com>.
2. Copy `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` from your project settings into `.env`.

## 3. Configure the environment

```bash
cp .env.example .env
```

Open `.env` and set three things:

```bash
MONGODB_URI=<your connection string from step 2>

# Generate each of these separately — they must be different from each other:
#   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_ACCESS_SECRET=<paste the first one>
JWT_REFRESH_SECRET=<paste the second one>
```

`.env` is gitignored. If you ever find yourself about to commit it, stop.

## 4. Seed and run

```bash
npm run seed
npm run dev
```

`npm run seed` **wipes the database it connects to**, then loads a full batch:
6 subjects, 3 faculty, 40 students, 48 class sessions (30 past, 18 upcoming),
24 materials, 18 assignments, 221 graded submissions, 1,200 attendance records,
announcements and notes. It refuses to run against anything with `prod` in the
connection string.

That data is the reason no team has to wait for another. Whatever you are
building, there is already something realistic to build it against —
`student04@college.edu` is deliberately below 75% attendance so low-attendance
warnings and at-risk reports have someone to find.

`npm run dev` starts all four apps at once:

| App            | URL                                |
| -------------- | ---------------------------------- |
| Student portal | <http://localhost:3000>            |
| Admin portal   | <http://localhost:3001>            |
| Student API    | <http://localhost:4000/api/health> |
| Admin API      | <http://localhost:4001/api/health> |

## 5. Check it actually works

1. Open <http://localhost:3000>, sign in as `student01@college.edu` /
   `password123`. You should land on the dashboard.
2. Open <http://localhost:3001>, sign in as `admin@college.edu` / `password123`.
3. Now try signing in to the **admin** portal with the **student** account. It
   must fail with "Email or password is incorrect" — if it succeeds, something
   is badly wrong, and that is worth an issue immediately.

## 6. Run the checks you will need before every PR

```bash
npm run lint
npm run typecheck
npm run test
```

The first `npm run test` is slow — `mongodb-memory-server` downloads a real
MongoDB binary. Later runs are quick.

## Common problems

**`MONGODB_URI is not set`** — you have a `.env.example` but no `.env`, or you
are running a command from inside `apps/` instead of the repo root.

**`MongoServerError: bad auth`** — the password in your connection string needs
URL-encoding if it contains `@`, `:`, `/` or `%`.

**Port already in use** — something else is on 3000/3001/4000/4001. Find it with
`lsof -i :3000` and stop it.

**Changes to `packages/*` do not show up** — the shared packages compile to
`dist/`. `npm run dev` watches them, but if you started an app on its own, run
`npm run build` at the root first.

**`Cannot find module '@repo/...'`** — run `npm install` at the repo root, then
`npm run build`.

## Next

**Read [how-we-work.md](how-we-work.md) next** — it explains the thinking behind
the repo and how a weekend actually runs. Most of the rules elsewhere stop
looking arbitrary once you've read it.

Then:

- [first-contribution.md](first-contribution.md) — issue → branch → PR → merged
- [teams.md](teams.md) — which folders your team owns
- [recipes/build-a-feature.md](recipes/build-a-feature.md) — a full vertical worked through
- [architecture.md](architecture.md) — how the pieces fit together, and why
- [CONTRIBUTING.md](../CONTRIBUTING.md) — conventions and locked files
