# Feature modules — `api-student`

Every feature is a folder in here. Your team owns its folder completely, which is
what lets 13 teams ship on the same weekend without fighting over files.

## Adding your module

1. Copy `auth/` as the template. It is the reference vertical — routes →
   controller → service, with all the logic in the service and nothing touching
   `req`/`res` outside the controller.
2. Name your files `<feature>.routes.ts`, `<feature>.controller.ts`,
   `<feature>.service.ts`, `<feature>.module.ts`, `<feature>.test.ts`.
3. Import your schemas from `@repo/validation/<feature>` — never define a Zod
   schema inline. That package is the contract the frontend half of your team is
   already coding against.
4. Add **one alphabetical line** to `../modules.ts`. Do not touch `app.ts`.

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

## Rules that apply to every module

- Wrap async handlers in `asyncHandler` (`@repo/http/async-handler`) — Express 4
  silently hangs on an unhandled promise rejection.
- Validate input with `validate(schema)` (`@repo/http/validate`); after it runs,
  trust `req.body`.
- Throw `HttpError` (`@repo/http/http-error`) rather than calling
  `res.status(...)` on the error path.
- Read the caller's identity from `currentUser(req)` only. Never from the body,
  a query param, or a header.
- Every endpoint needs a test for the happy path, the auth requirement, and one
  abuse case.

## Who builds what

| Module           | Team | Endpoints                                                                         |
| ---------------- | ---- | --------------------------------------------------------------------------------- |
| `auth/`          | 03   | `POST /register /login /refresh /logout`, `GET /me` — **built, use as reference** |
| `materials/`     | 04   | `GET /`, `GET /:id`, `GET /search`, `POST /upload-signature`                      |
| `assignments/`   | 05   | `GET /`, `GET /upcoming`, `GET /:id`, `POST /:id/submissions`, `GET /me/grades`   |
| `attendance/`    | 06   | `GET /me`, `GET /me/summary`, `GET /subject/:subjectId`                           |
| `sessions/`      | 07   | `GET /timetable`, `GET /today`, `GET /:id`                                        |
| `announcements/` | 08   | `GET /`, `GET /notifications`, `PATCH /notifications/:id/read`                    |
| `assistant/`     | 13   | `POST /chat` (SSE), `GET /conversations`                                          |
