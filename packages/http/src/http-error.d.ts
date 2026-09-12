/**
 * The one error type handlers should throw. The error middleware turns it into
 * the `{ error: { code, message, details } }` body defined by `apiErrorSchema`
 * in `@repo/validation/common` — keep that shape stable, the frontends parse it.
 */
export declare class HttpError extends Error {
  readonly status: number
  readonly code: string
  readonly details?: unknown
  constructor(status: number, code: string, message: string, details?: unknown)
  static badRequest(message: string, details?: unknown): HttpError
  static unauthorized(message?: string): HttpError
  static forbidden(message?: string): HttpError
  static notFound(message?: string): HttpError
  static conflict(message: string): HttpError
  static tooManyRequests(message?: string): HttpError
}
//# sourceMappingURL=http-error.d.ts.map
