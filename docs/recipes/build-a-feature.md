# Recipe: build a feature end to end

One vertical, all the way through: contract → model → API → screen → tests.

The example is a **materials list** — "show me the slides for this subject".
Team 04 owns the real one; here it's a worked example. **Copy the shape, not the
code.**

Two things to notice as you read: the schema is written before anything else,
and no file outside the team's own folders is touched except one line in a
registry.

---

## 0. Before you write anything

```bash
git checkout main && git pull
git checkout -b t04/materials-list
```

Look at the reference vertical first — `apps/api-student/src/modules/auth/`.
Every backend module in this repo has that shape, and yours should too.

---

## 1. The contract

**Always first.** The moment this merges, the frontend half of your team can
start.

```ts
// packages/validation/src/materials.ts
import { z } from 'zod'
import { objectIdSchema, paginatedSchema, paginationQuerySchema } from './common'
import { materialTypeSchema } from './enums'

/** Query params for GET /api/materials */
export const materialListQuerySchema = paginationQuerySchema.extend({
  subjectId: objectIdSchema.optional(),
  type: materialTypeSchema.optional(),
})
export type MaterialListQuery = z.infer<typeof materialListQuerySchema>

/** What the API returns. Note what is NOT here: no cloudinary publicId, no
 *  uploadedBy email. Send the client what it needs and nothing more. */
export const materialSchema = z.object({
  id: objectIdSchema,
  subjectId: objectIdSchema,
  title: z.string(),
  description: z.string().nullable(),
  type: materialTypeSchema,
  url: z.string().nullable(),
  bytes: z.number().nullable(),
  createdAt: z.string(),
})
export type Material = z.infer<typeof materialSchema>

export const materialListResponseSchema = paginatedSchema(materialSchema)
export type MaterialListResponse = z.infer<typeof materialListResponseSchema>
```

Open this as its own PR. It's twenty lines, reviews in two minutes, and unblocks
a teammate for the whole weekend.

---

## 2. The model

Add your table definition to `packages/models/src/schema.ts`:

```ts
import { pgTable, uuid, text, timestamp, index } from 'drizzle-orm/pg-core'
import { profiles } from './schema'

export const things = pgTable(
  'things',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    ownerId: uuid('owner_id')
      .notNull()
      .references(() => profiles.id),
    title: text('title').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('things_owner_created_idx').on(t.ownerId, t.createdAt)],
)
```

And re-export it from `packages/models/src/thing.ts`:

```ts
export { things } from './schema'
```

Rule: import via subpaths: `import { things } from '@repo/models/thing'`.

---

## 3. The service

All the logic. Never touches `req` or `res`, which is what makes it testable.

```ts
// apps/api-student/src/modules/materials/materials.service.ts
import { Material } from '@repo/models/material'
import { Enrollment } from '@repo/models/enrollment'
import { HttpError } from '@repo/http/http-error'
import type { MaterialListQuery, Material as MaterialDto } from '@repo/validation/materials'

function toDto(doc: MaterialDoc): MaterialDto {
  return {
    id: doc._id.toString(),
    subjectId: doc.subjectId.toString(),
    title: doc.title,
    description: doc.description,
    type: doc.type,
    url: doc.cloudinary?.url ?? doc.externalUrl,
    bytes: doc.cloudinary?.bytes ?? null,
    createdAt: doc.createdAt.toISOString(),
  }
}

export async function listMaterialsForStudent(studentId: string, query: MaterialListQuery) {
  // A student may only see materials for subjects they're enrolled in.
  // This is the access-control decision, and it belongs here — not in the UI.
  const enrolled = await Enrollment.find({ studentId }).select('subjectId').lean()
  const allowed = enrolled.map((e) => e.subjectId)

  if (query.subjectId && !allowed.some((id) => id.equals(query.subjectId))) {
    // 404, not 403: telling them "forbidden" confirms the subject exists.
    throw HttpError.notFound('Subject not found')
  }

  const filter = {
    subjectId: query.subjectId ? query.subjectId : { $in: allowed },
    ...(query.type ? { type: query.type } : {}),
  }

  // Count and page in parallel — two round trips become one wait.
  const [items, total] = await Promise.all([
    Material.find(filter)
      .sort({ createdAt: -1 })
      .skip((query.page - 1) * query.limit)
      .limit(query.limit)
      .lean(),
    Material.countDocuments(filter),
  ])

  return {
    items: items.map(toDto),
    page: query.page,
    limit: query.limit,
    total,
    hasMore: query.page * query.limit < total,
  }
}
```

The `$in: allowed` is the important line. The alternative — fetch everything,
filter in JavaScript — works on seed data and leaks on real data the first time
someone forgets the filter.

---

## 4. The controller

Thin. Reads the request, calls the service, sends the response.

```ts
// materials.controller.ts
import type { Request, Response } from 'express'
import { currentUser } from '@repo/auth/middleware'
import type { MaterialListQuery } from '@repo/validation/materials'
import { listMaterialsForStudent } from './materials.service'

export async function list(req: Request, res: Response) {
  const { sub } = currentUser(req) // the ONLY source of identity
  const query = req.query as unknown as MaterialListQuery // already validated
  res.json(await listMaterialsForStudent(sub, query))
}
```

---

## 5. The routes

```ts
// materials.routes.ts
import { Router } from 'express'
import { requireAuth } from '@repo/auth/middleware'
import { asyncHandler } from '@repo/http/async-handler'
import { validate } from '@repo/http/validate'
import { materialListQuerySchema } from '@repo/validation/materials'
import * as controller from './materials.controller'

export const materialsRouter: Router = Router()

materialsRouter.get(
  '/',
  requireAuth,
  validate(materialListQuerySchema, 'query'),
  asyncHandler(controller.list),
)
```

`asyncHandler` is not optional — Express 4 silently hangs on an unhandled
promise rejection, and the request just times out with no error anywhere.

---

## 6. Register it

```ts
// materials.module.ts
import type { ApiModule } from '../../modules'
import { materialsRouter } from './materials.routes'

const materialsModule: ApiModule = {
  basePath: '/api/materials',
  router: materialsRouter,
}

export default materialsModule
```

Then **one line** in `src/modules.ts`, alphabetically:

```ts
export const modules: ApiModule[] = [
  authModule,
  materialsModule, // ← your line
  // ...
]
```

That's the only shared file you touch. `app.ts` never changes.

---

## 7. The tests

```ts
// materials.test.ts
import request from 'supertest'
import { beforeEach, describe, expect, it } from 'vitest'
import { createApp } from '../../app'

const app = createApp()

describe('GET /api/materials', () => {
  it('returns materials for an enrolled subject', async () => {
    const { token, subjectId } = await seedStudentWithMaterials()
    const res = await request(app)
      .get(`/api/materials?subjectId=${subjectId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)

    expect(res.body.items).toHaveLength(4)
    expect(res.body.items[0]).not.toHaveProperty('cloudinary') // no internals leak
  })

  it('401s without a token', async () => {
    await request(app).get('/api/materials').expect(401)
  })

  // The one that matters.
  it('404s for a subject the student is not enrolled in', async () => {
    const { token } = await seedStudentWithMaterials()
    const other = await seedUnrelatedSubject()
    await request(app)
      .get(`/api/materials?subjectId=${other.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404)
  })
})
```

Write the third one **first**, before the feature works. A privacy test written
afterwards tends to be written to match what the code already does.

---

## 8. The frontend half

Runs in parallel with steps 3–7, against the schema from step 1.

```ts
// apps/web-student/features/materials/api.ts
import { api } from '@/lib/api-client'
import type { MaterialListResponse } from '@repo/validation/materials'

export function fetchMaterials(subjectId?: string) {
  const qs = subjectId ? `?subjectId=${subjectId}` : ''
  return api.get<MaterialListResponse>(`/api/materials${qs}`)
}
```

```tsx
// apps/web-student/features/materials/components/material-list.tsx
'use client'

import { useEffect, useState } from 'react'
import { EmptyState } from '@repo/ui/empty-state'
import { Skeleton } from '@repo/ui/skeleton'
import type { Material } from '@repo/validation/materials'
import { fetchMaterials } from '../api'

export function MaterialList({ subjectId }: { subjectId?: string }) {
  const [state, setState] = useState<
    { status: 'loading' } | { status: 'error' } | { status: 'ready'; items: Material[] }
  >({ status: 'loading' })

  useEffect(() => {
    let cancelled = false
    setState({ status: 'loading' })
    fetchMaterials(subjectId)
      .then((r) => !cancelled && setState({ status: 'ready', items: r.items }))
      .catch(() => !cancelled && setState({ status: 'error' }))
    return () => {
      cancelled = true
    }
  }, [subjectId])

  // All three states. This is not optional — a blank screen is
  // indistinguishable from a bug.
  if (state.status === 'loading') {
    return (
      <div className="space-y-2">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-16" />
        ))}
      </div>
    )
  }

  if (state.status === 'error') {
    return (
      <EmptyState
        title="Couldn't load materials"
        description="Check your connection and try again."
      />
    )
  }

  if (state.items.length === 0) {
    return (
      <EmptyState
        title="No materials yet"
        description="Your faculty hasn't uploaded anything for this subject."
      />
    )
  }

  return (
    <ul className="divide-y divide-line">
      {state.items.map((m) => (
        <li key={m.id} className="py-3">
          <span className="text-sm font-medium text-fg">{m.title}</span>
        </li>
      ))}
    </ul>
  )
}
```

The `cancelled` flag matters: without it, switching subjects quickly lets a slow
first response overwrite a fast second one, and the list shows the wrong
subject's materials.

Then the page is thin:

```tsx
// apps/web-student/app/(dashboard)/materials/page.tsx
import { MaterialList } from '@/features/materials/components/material-list'

export default function MaterialsPage() {
  return (
    <div className="space-y-5">
      <h1 className="text-xl font-semibold text-fg">Materials</h1>
      <MaterialList />
    </div>
  )
}
```

And one nav entry — `components/nav/items/materials.ts` plus uncommenting your
line in `items/registry.ts`. **Only once the route actually exists** — a nav link
to a 404 reads as a bug.

---

## 9. Seed data

So the next person sees something without doing your work:

```ts
// scripts/seed/materials.seed.ts   (already exists — extend it)
```

Add one line to `scripts/seed/index.ts` if your feature has a new seeder.

---

## 10. Ship it

```bash
npm run lint && npm run typecheck && npm run test
npm run db:local     # terminal 1
npm run seed && npm run dev
```

Sign in as `student01@college.edu` / `password123`, click through it, then open
the PR.

---

## What you touched

```
packages/validation/src/materials.ts          your team
apps/api-student/src/modules/materials/*      your team
apps/api-student/src/modules.ts               ONE line, append-only
apps/web-student/features/materials/*         your team
apps/web-student/app/(dashboard)/materials/*  your team
apps/web-student/components/nav/items/*       one file, yours
scripts/seed/materials.seed.ts                your team
```

Nothing another team owns. That's the whole design — and it's why thirteen teams
can do this on the same Saturday.
