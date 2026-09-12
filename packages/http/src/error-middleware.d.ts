import type { NextFunction, Request, Response } from 'express'
export declare function notFoundHandler(req: Request, res: Response): void
export declare function createErrorHandler(
  serviceName: string,
): (err: unknown, _req: Request, res: Response, _next: NextFunction) => void
//# sourceMappingURL=error-middleware.d.ts.map
