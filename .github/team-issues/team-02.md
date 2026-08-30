**Team 02 · 3 people · Active from W1 (foundation — every screen uses your components)**

You own how the product looks and feels. Thirteen teams building screens independently is exactly how an app ends up with four different button styles and three shades of blue. Your job is to make sure that doesn't happen.

## What you own

```
packages/ui/src/                    all shared components
packages/ui/src/theme.css           the design tokens — the whole palette
apps/web-student/app/layout.tsx     root layout
apps/web-admin/app/layout.tsx
apps/web-student/app/(dashboard)/layout.tsx   the dashboard shell
apps/web-admin/app/(admin)/layout.tsx
apps/*/components/nav/sidebar.tsx
```

## Your job

- **Own the token palette.** Feature teams use `bg-surface`, `text-fg-muted`, `border-line` — never a hex value. When someone needs a colour that doesn't exist, they file an issue with you rather than inventing one.
- **Grow the component library on demand.** You already ship `Button`, `Input`, `Card`, `Badge`, `EmptyState`, `Skeleton`. Teams will need `Table`, `Modal`, `Select`, `Tabs`, `Toast`, `FileDropzone`, `Avatar`, `Pagination`. Build them when a second team needs the same thing — not before.
- **Own accessibility.** Every interactive component needs a visible focus ring, a real label, and keyboard operability. This is much cheaper to get right in `packages/ui` once than to retrofit across 30 screens in W8.
- **Own dark mode.** The tokens already flip under `prefers-color-scheme`. Keep it working as components land.

## Definition of done

- No feature PR needs to write a raw colour or build a button
- Every component works with keyboard only and has a visible focus state
- Student and admin portals look like the same product
- Both themes readable, contrast ≥ 4.5:1 for body text

## First tasks

- [ ] `Table` with sortable headers — Teams 05, 11 and 12 all need it
- [ ] `Modal` / `Dialog` with focus trap and Escape to close
- [ ] `Select` and `Tabs`
- [ ] `Toast` for success/error feedback after actions
- [ ] Replace the placeholder glyphs in the sidebar with a real icon set
- [ ] Write `packages/ui/README.md` showing each component with usage examples

## Watch out for

Your files are locked in CODEOWNERS, which means every feature team is blocked on you when they need a component. Turn those PRs around fast — a slow design system team stalls twelve others.

---

## Independence

**Blocked by: nothing.** You build components, not data, so you need nothing from anyone. Twelve teams need things from _you_ — that is the asymmetry to manage.

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
