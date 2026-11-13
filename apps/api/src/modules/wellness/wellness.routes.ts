import { Router } from 'express';
import { objectIdSchema, WELLNESS_CATEGORIES, type WellnessCategory } from '@mindbridge/shared';
import { z } from 'zod';
import { requireAuth } from '../../common/auth.middleware.js';
import { notFound } from '../../common/errors.js';
import { toWellnessActivity } from '../../common/serializers.js';
import { validate } from '../../common/validate.js';
import { WellnessActivityModel } from './wellness-activity.model.js';

const idParams = z.object({ id: objectIdSchema });

export const wellnessRouter = Router();
wellnessRouter.use(requireAuth);

wellnessRouter.get('/activities', validate(z.object({ category: z.enum(WELLNESS_CATEGORIES).optional() }), 'query'), async (_req, res) => {
  const { category } = res.locals.query as { category?: WellnessCategory };
  const docs = await WellnessActivityModel.find({ published: true, ...(category ? { category } : {}) })
    .sort({ category: 1, title: 1 })
    .lean();
  res.json(docs.map(toWellnessActivity));
});

wellnessRouter.get('/activities/:id', validate(idParams, 'params'), async (req, res) => {
  const doc = await WellnessActivityModel.findOne({ _id: req.params.id, published: true }).lean();
  if (!doc) throw notFound('Activity');
  res.json(toWellnessActivity(doc));
});

/** Anonymous engagement counter (no per-student record is kept). */
wellnessRouter.post('/activities/:id/complete', validate(idParams, 'params'), async (req, res) => {
  const r = await WellnessActivityModel.updateOne({ _id: req.params.id, published: true }, { $inc: { completions: 1 } });
  if (r.matchedCount === 0) throw notFound('Activity');
  res.status(204).end();
});
