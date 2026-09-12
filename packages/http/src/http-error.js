'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
exports.HttpError = void 0
/**
 * The one error type handlers should throw. The error middleware turns it into
 * the `{ error: { code, message, details } }` body defined by `apiErrorSchema`
 * in `@repo/validation/common` — keep that shape stable, the frontends parse it.
 */
class HttpError extends Error {
  status
  code
  details
  constructor(status, code, message, details) {
    super(message)
    this.name = 'HttpError'
    this.status = status
    this.code = code
    this.details = details
  }
  static badRequest(message, details) {
    return new HttpError(400, 'BAD_REQUEST', message, details)
  }
  static unauthorized(message = 'Not authenticated') {
    return new HttpError(401, 'UNAUTHENTICATED', message)
  }
  static forbidden(message = 'You do not have access to this resource') {
    return new HttpError(403, 'FORBIDDEN', message)
  }
  static notFound(message = 'Not found') {
    return new HttpError(404, 'NOT_FOUND', message)
  }
  static conflict(message) {
    return new HttpError(409, 'CONFLICT', message)
  }
  static tooManyRequests(message = 'Too many requests') {
    return new HttpError(429, 'RATE_LIMITED', message)
  }
}
exports.HttpError = HttpError
//# sourceMappingURL=http-error.js.map
