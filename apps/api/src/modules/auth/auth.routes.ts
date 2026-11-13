import { Router } from 'express';
import {
  forgotPasswordSchema,
  loginSchema,
  refreshSchema,
  registerSchema,
  resetPasswordSchema,
} from '@mindbridge/shared';
import { authLimiter } from '../../common/rate-limit.js';
import { validate } from '../../common/validate.js';
import * as auth from './auth.service.js';

export const authRouter = Router();
authRouter.use(authLimiter);

authRouter.post('/register', validate(registerSchema), async (req, res) => {
  res.status(201).json(await auth.register(req.body));
});

authRouter.post('/login', validate(loginSchema), async (req, res) => {
  res.json(await auth.login(req.body));
});

authRouter.post('/refresh', validate(refreshSchema), async (req, res) => {
  res.json({ tokens: await auth.refresh(req.body.refreshToken) });
});

authRouter.post('/logout', validate(refreshSchema), async (req, res) => {
  await auth.logout(req.body.refreshToken);
  res.status(204).end();
});

authRouter.post('/forgot-password', validate(forgotPasswordSchema), async (req, res) => {
  await auth.forgotPassword(req.body.email);
  res.status(202).json({ message: 'If an account exists for that email, a reset link is on its way.' });
});

authRouter.post('/reset-password', validate(resetPasswordSchema), async (req, res) => {
  await auth.resetPassword(req.body);
  res.status(204).end();
});
