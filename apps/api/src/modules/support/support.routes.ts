import { Router } from 'express';
import { objectIdSchema, supportQuerySchema } from '@mindbridge/shared';
import { z } from 'zod';
import { authUserId, requireAuth } from '../../common/auth.middleware.js';
import { notFound } from '../../common/errors.js';
import { toSupportResource } from '../../common/serializers.js';
import { validate } from '../../common/validate.js';
import { UserModel } from '../students/user.model.js';
import { SupportResourceModel } from './support-resource.model.js';

export const supportRouter = Router();
supportRouter.use(requireAuth);

/** Only VERIFIED + published resources are ever returned to students. No chat data is needed or used. */
const VISIBLE = { verificationStatus: 'VERIFIED', published: true } as const;

supportRouter.get('/resources', validate(supportQuerySchema, 'query'), async (req, res) => {
  const q = res.locals.query as z.infer<typeof supportQuerySchema>;
  const me = await UserModel.findById(authUserId(req), { university: 1 }).lean();
  const filter: Record<string, unknown> = { ...VISIBLE };
  if (q.category) filter.category = q.category;
  if (q.universityId) filter.university = q.universityId;
  const docs = await SupportResourceModel.find(filter).populate('university', 'name').sort({ category: 1, name: 1 }).lean();
  const mine = me?.university?.toString();
  // Emergency first, then the student's own campus, then the rest.
  const score = (d: (typeof docs)[number]) =>
    (d.category === 'EMERGENCY' ? 0 : d.category === 'CRISIS_LINE' ? 1 : 3) + (mine && d.university?._id.toString() === mine ? 0 : 1);
  res.json(docs.sort((a, b) => score(a) - score(b)).map(toSupportResource));
});

supportRouter.get('/resources/:id', validate(z.object({ id: objectIdSchema }), 'params'), async (req, res) => {
  const doc = await SupportResourceModel.findOneAndUpdate({ _id: req.params.id, ...VISIBLE }, { $inc: { views: 1 } }, { new: true })
    .populate('university', 'name')
    .lean();
  if (!doc) throw notFound('Resource');
  res.json(toSupportResource(doc));
});
