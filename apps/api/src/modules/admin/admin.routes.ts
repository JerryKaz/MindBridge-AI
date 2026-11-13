import { Router, type Request } from 'express';
import {
  adminUpdateUserSchema,
  objectIdSchema,
  supportResourceSchema,
  supportResourceUpdateSchema,
  wellnessActivitySchema,
  wellnessActivityUpdateSchema,
} from '@mindbridge/shared';
import { z } from 'zod';
import { authUserId, requireAuth, requireRole } from '../../common/auth.middleware.js';
import { validate } from '../../common/validate.js';
import * as admin from './admin.service.js';
import { getAnalytics } from './analytics.service.js';

const idParams = z.object({ id: objectIdSchema });
const pageQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  search: z.string().trim().max(100).optional(),
});
const actor = (req: Request): admin.Actor => ({ id: authUserId(req), ip: req.ip ?? null });

/**
 * Administration API. There is deliberately NO endpoint here that returns
 * conversation messages, journal entries or individual mood histories.
 */
export const adminRouter = Router();
adminRouter.use(requireAuth, requireRole('ADMIN', 'SUPER_ADMIN'));

adminRouter.get('/analytics', async (_req, res) => {
  res.set('Cache-Control', 'no-store').json(await getAnalytics());
});

adminRouter.get('/users', validate(pageQuery, 'query'), async (_req, res) => {
  res.json(await admin.listUsers(res.locals.query));
});
adminRouter.patch('/users/:id/status', validate(idParams, 'params'), validate(adminUpdateUserSchema), async (req, res) => {
  await admin.setUserStatus(actor(req), req.params.id as string, req.body.status);
  res.status(204).end();
});

adminRouter.get('/wellness-activities', async (_req, res) => {
  res.json(await admin.listWellness());
});
adminRouter.post('/wellness-activities', validate(wellnessActivitySchema), async (req, res) => {
  res.status(201).json(await admin.createWellness(actor(req), req.body));
});
adminRouter.put('/wellness-activities/:id', validate(idParams, 'params'), validate(wellnessActivityUpdateSchema), async (req, res) => {
  res.json(await admin.updateWellness(actor(req), req.params.id as string, req.body));
});

adminRouter.get('/support-resources', async (_req, res) => {
  res.json(await admin.listSupport());
});
adminRouter.post('/support-resources', validate(supportResourceSchema), async (req, res) => {
  res.status(201).json(await admin.createSupport(actor(req), req.body));
});
adminRouter.put('/support-resources/:id', validate(idParams, 'params'), validate(supportResourceUpdateSchema), async (req, res) => {
  res.json(await admin.updateSupport(actor(req), req.params.id as string, req.body));
});

adminRouter.get('/audit-logs', validate(pageQuery, 'query'), async (_req, res) => {
  res.json(await admin.listAudit(res.locals.query));
});
