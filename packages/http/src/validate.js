'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
exports.validate = validate
const http_error_1 = require('./http-error')
/**
 * Parses and *replaces* `req[source]` with the validated, coerced value. After
 * this middleware runs, the handler can trust its input completely.
 *
 * The schema must come from `@repo/validation` — that package is the contract
 * the frontend half of your team codes against, so a schema defined inline in a
 * route file is a bug.
 */
function validate(schema, source = 'body') {
  return (req, _res, next) => {
    const result = schema.safeParse(req[source])
    if (!result.success) {
      return next(
        new http_error_1.HttpError(
          422,
          'VALIDATION_ERROR',
          'Request failed validation',
          result.error.flatten(),
        ),
      )
    }
    Object.defineProperty(req, source, { value: result.data, writable: true })
    return next()
  }
}
//# sourceMappingURL=validate.js.map
