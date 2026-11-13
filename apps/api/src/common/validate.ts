import type { RequestHandler } from 'express';
import type { ZodType } from 'zod';

type Source = 'body' | 'query' | 'params';

/**
 * Validates and replaces req[source] with the parsed (typed, stripped) value.
 * Express 5 makes req.query a getter, so parsed query values go on res.locals.query.
 */
export const validate =
  (schema: ZodType, source: Source = 'body'): RequestHandler =>
  (req, res, next) => {
    const parsed = schema.parse(req[source] ?? {});
    if (source === 'query') res.locals.query = parsed;
    else req[source] = parsed;
    next();
  };
