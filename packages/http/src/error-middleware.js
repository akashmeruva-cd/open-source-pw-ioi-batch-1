'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
exports.notFoundHandler = notFoundHandler
exports.createErrorHandler = createErrorHandler
const http_error_1 = require('./http-error')
function notFoundHandler(req, res) {
  res.status(404).json({
    error: { code: 'NOT_FOUND', message: `No route for ${req.method} ${req.path}` },
  })
}
function createErrorHandler(serviceName) {
  return (err, _req, res, _next) => {
    // `AuthError` from @repo/auth also carries `status` and `code`.
    const candidate = err
    const status = typeof candidate?.status === 'number' ? candidate.status : 500
    const code = candidate?.code ?? 'INTERNAL_ERROR'
    if (status >= 500) {
      // eslint-disable-next-line no-console
      console.error(`[${serviceName}] unhandled error`, err)
    }
    res.status(status).json({
      error: {
        code,
        message:
          status >= 500
            ? 'Something went wrong on our side'
            : (candidate?.message ?? 'Request failed'),
        ...(err instanceof http_error_1.HttpError && err.details !== undefined
          ? { details: err.details }
          : {}),
      },
    })
  }
}
//# sourceMappingURL=error-middleware.js.map
