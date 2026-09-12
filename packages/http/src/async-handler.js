'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
exports.asyncHandler = asyncHandler
/**
 * Express 4 does not catch rejected promises from async handlers — the request
 * just hangs until it times out. Wrap every async handler in this.
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    fn(req, res, next).catch(next)
  }
}
//# sourceMappingURL=async-handler.js.map
