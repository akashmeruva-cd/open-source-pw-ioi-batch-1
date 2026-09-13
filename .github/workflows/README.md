# CI Workflows & TypeLink (Typecheck) Setup

This directory contains the GitHub Actions workflows for continuous integration (CI) across the monorepo, maintained by **Team 01 — Core Platform & DevOps**.

---

## 1. Overview of Workflows

### `ci.yml` — Continuous Integration Pipeline

The CI workflow runs on:
- **Pull Requests**: Every time a PR is opened, synchronized, or updated.
- **Pushes to `main`**: Ensures `main` remains green.

Concurrency is configured to cancel outdated runs when a contributor pushes multiple commits consecutively:
```yaml
concurrency:
  group: ci-${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true
```

---

## 2. Jobs Architecture & Parallelism

Rather than running as a monolithic step, CI runs four modular, parallel jobs. This ensures fast execution and independent status checks on pull requests:

| Job Name | Identifier | Command | Description |
|---|---|---|---|
| **TypeLink (Typecheck)** | `typecheck` | `npx turbo run typecheck` | Checks TypeScript types across all 12 packages & apps. |
| **Lint** | `lint` | `npx turbo run lint` | Runs ESLint across web workspaces. |
| **Test** | `test` | `npx turbo run test` | Runs Jest / Vitest unit and module test suites. |
| **Build** | `build` | `npx turbo run build` | Compiles packages and Next.js applications. |

---

## 3. How TypeLink / Typecheck Works in this Monorepo

In this project, **TypeLink** refers to **TypeScript type checking and package linking across workspace boundaries**:

1. **Shared Workspace Packages**:
   - `packages/validation`: Zod schemas and inferred types (`@repo/validation`)
   - `packages/models`: Database schema and entities (`@repo/models`)
   - `packages/http`, `packages/auth`, `packages/client`, `packages/ui`
2. **Turborepo Dependency Pipeline (`turbo.json`)**:
   ```json
   "typecheck": {
     "dependsOn": ["^build"]
   }
   ```
   When `npx turbo run typecheck` executes, Turborepo builds topological dependencies (`^build`) first so that `.d.ts` declaration files are available for downstream apps (`apps/web-*` and `apps/api-*`).
3. **Zero-Emit Checking**:
   Each workspace runs TypeScript with `--noEmit`:
   ```bash
   tsc -p tsconfig.json --noEmit
   ```

---

## 4. Pull Request Feedback & Branch Protection

### Why Dedicated Jobs Matter for PRs:
1. **Isolated Feedback**: If a contributor introduces a linting error, `TypeLink (Typecheck)` still runs in parallel, providing immediate feedback on whether their TypeScript types pass or fail.
2. **Clear PR Badges**: GitHub PRs display individual checkmarks for:
   - `CI / TypeLink (Typecheck)`
   - `CI / Lint`
   - `CI / Test`
   - `CI / Build`
3. **Branch Protection Enforceability**: Repository administrators and Team 01 leads can enforce `TypeLink (Typecheck)` as a `required_status_check` in GitHub repository rulesets.

---

## 5. Running Checks Locally

Contributors must verify checks locally before opening a pull request:

```bash
# Run type checking across all workspaces
npm run typecheck

# Run linting
npm run lint

# Run unit tests
npm run test

# Run build
npm run build
```
