import { Router } from 'express';
import { accountDeletionSchema, createMemorySchema, objectIdSchema, updateConsentsSchema } from '@mindbridge/shared';
import { z } from 'zod';
import { authUserId, requireAuth } from '../../common/auth.middleware.js';
import { validate } from '../../common/validate.js';
import * as consents from './consent.service.js';
import * as memories from './memories.service.js';
import * as privacy from './privacy.service.js';

const idParams = z.object({ id: objectIdSchema });

export const consentsRouter = Router();
consentsRouter.use(requireAuth);
consentsRouter.get('/', async (req, res) => {
  res.json(await consents.getConsents(authUserId(req)));
});
consentsRouter.put('/', validate(updateConsentsSchema), async (req, res) => {
  res.json(await consents.updateConsents(authUserId(req), req.body));
});

export const privacyRouter = Router();
privacyRouter.use(requireAuth);
privacyRouter.post('/data-export', async (req, res) => {
  res
    .set('Content-Disposition', 'attachment; filename="mindbridge-data-export.json"')
    .set('Cache-Control', 'no-store')
    .json(await privacy.exportData(authUserId(req)));
});
privacyRouter.post('/account-deletion', validate(accountDeletionSchema), async (req, res) => {
  await privacy.deleteAccount(authUserId(req), req.body.password, req.ip ?? null);
  res.status(204).end();
});

export const memoriesRouter = Router();
memoriesRouter.use(requireAuth);
memoriesRouter.get('/', async (req, res) => {
  res.json(await memories.listMemories(authUserId(req)));
});
memoriesRouter.post('/', validate(createMemorySchema), async (req, res) => {
  res.status(201).json(await memories.addMemory(authUserId(req), req.body.content));
});
memoriesRouter.delete('/:id', validate(idParams, 'params'), async (req, res) => {
  await memories.deleteMemory(authUserId(req), req.params.id as string);
  res.status(204).end();
});
