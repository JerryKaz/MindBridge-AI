import { Router } from 'express';
import { createConversationSchema, objectIdSchema, sendMessageSchema } from '@mindbridge/shared';
import { z } from 'zod';
import { authUserId, requireAuth } from '../../common/auth.middleware.js';
import { messageLimiter } from '../../common/rate-limit.js';
import { validate } from '../../common/validate.js';
import type { AIOrchestrator } from '../intelligence/ai-orchestrator.service.js';
import * as conversations from './conversations.service.js';

const idParams = z.object({ id: objectIdSchema });

export function conversationsRouter(orchestrator: AIOrchestrator): Router {
  const router = Router();
  router.use(requireAuth);

  router.post('/', validate(createConversationSchema), async (req, res) => {
    res.status(201).json(await conversations.create(authUserId(req), req.body.title));
  });

  router.get('/', async (req, res) => {
    res.json(await conversations.list(authUserId(req)));
  });

  router.get('/:id', validate(idParams, 'params'), async (req, res) => {
    res.set('Cache-Control', 'no-store').json(await conversations.get(authUserId(req), req.params.id as string));
  });

  router.delete('/:id', validate(idParams, 'params'), async (req, res) => {
    await conversations.remove(authUserId(req), req.params.id as string);
    res.status(204).end();
  });

  router.post('/:id/messages', messageLimiter, validate(idParams, 'params'), validate(sendMessageSchema), async (req, res) => {
    res
      .status(201)
      .json(await conversations.sendMessage(orchestrator, authUserId(req), req.params.id as string, req.body.content));
  });

  return router;
}
