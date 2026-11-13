import { Router } from 'express';
import { updateProfileSchema } from '@mindbridge/shared';
import { authUserId, requireAuth } from '../../common/auth.middleware.js';
import { validate } from '../../common/validate.js';
import * as students from './students.service.js';

export const studentsRouter = Router();
studentsRouter.use(requireAuth);

studentsRouter.get('/me', async (req, res) => {
  res.json(await students.getMe(authUserId(req)));
});

studentsRouter.put('/me', validate(updateProfileSchema), async (req, res) => {
  res.json(await students.updateMe(authUserId(req), req.body));
});
