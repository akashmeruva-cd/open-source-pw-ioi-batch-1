import type { NextFunction, Request, Response } from 'express'
import type { ZodTypeAny } from 'zod'
type Source = 'body' | 'query' | 'params'
/**
 * Parses and *replaces* `req[source]` with the validated, coerced value. After
 * this middleware runs, the handler can trust its input completely.
 *
 * The schema must come from `@repo/validation` — that package is the contract
 * the frontend half of your team codes against, so a schema defined inline in a
 * route file is a bug.
 */
export declare function validate<T extends ZodTypeAny>(
  schema: T,
  source?: Source,
): (req: Request, _res: Response, next: NextFunction) => void
export {}
//# sourceMappingURL=validate.d.ts.map
