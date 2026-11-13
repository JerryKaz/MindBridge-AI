import { Router } from 'express';
import { createMoodSchema, moodHistoryQuerySchema, objectIdSchema } from '@mindbridge/shared';
import { z } from 'zod';
import { authUserId, requireAuth } from '../../common/auth.middleware.js';
import { validate } from '../../common/validate.js';
import * as moods from './moods.service.js';

export const moodsRouter = Router();
moodsRouter.use(requireAuth);

moodsRouter.post('/', validate(createMoodSchema), async (req, res) => {
  res.status(201).json(await moods.create(authUserId(req), req.body));
});

moodsRouter.get('/history', validate(moodHistoryQuerySchema, 'query'), async (req, res) => {
  res.set('Cache-Control', 'no-store').json(await moods.history(authUserId(req), res.locals.query.range));
});

moodsRouter.delete('/:id', validate(z.object({ id: objectIdSchema }), 'params'), async (req, res) => {
  await moods.remove(authUserId(req), req.params.id as string);
  res.status(204).end();
});
