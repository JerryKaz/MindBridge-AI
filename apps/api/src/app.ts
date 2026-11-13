import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';
import mongoose from 'mongoose';
import { env } from './config/env.js';
import { errorHandler, notFoundHandler } from './common/error-handler.js';
import { globalLimiter } from './common/rate-limit.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { MongoConversationStore } from './modules/conversations/conversation.store.js';
import { conversationsRouter } from './modules/conversations/conversations.routes.js';
import { AIOrchestrator } from './modules/intelligence/ai-orchestrator.service.js';
import type { AIProvider } from './modules/intelligence/providers/ai-provider.interface.js';
import { createAIProvider } from './modules/intelligence/providers/provider.factory.js';
import { moodsRouter } from './modules/moods/moods.routes.js';
import { consentsRouter, memoriesRouter, privacyRouter } from './modules/privacy/privacy.routes.js';
import { studentsRouter } from './modules/students/students.routes.js';
import { supportRouter } from './modules/support/support.routes.js';
import { universitiesRouter } from './modules/universities/universities.routes.js';
import { wellnessRouter } from './modules/wellness/wellness.routes.js';

export interface AppDeps {
  provider?: AIProvider;
}

export function createApp(deps: AppDeps = {}): Express {
  const app = express();
  const provider = deps.provider ?? createAIProvider(env);
  const orchestrator = new AIOrchestrator({ provider, store: new MongoConversationStore() });

  app.disable('x-powered-by');
  if (env.TRUST_PROXY > 0) app.set('trust proxy', env.TRUST_PROXY);
  app.use(helmet());
  app.use(
    cors({
      origin: (origin, cb) => cb(null, !origin || env.CORS_ORIGINS.includes(origin)),
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      maxAge: 600,
    }),
  );
  app.use(express.json({ limit: '32kb' }));

  app.get('/health', (_req, res) => {
    const db = mongoose.connection.readyState === 1 ? 'up' : 'down';
    res.status(db === 'up' ? 200 : 503).json({ status: db === 'up' ? 'ok' : 'degraded', db, aiProvider: provider.name });
  });

  const api = express.Router();
  api.use(globalLimiter);
  api.use('/auth', authRouter);
  api.use('/universities', universitiesRouter);
  api.use('/students', studentsRouter);
  api.use('/conversations', conversationsRouter(orchestrator));
  api.use('/moods', moodsRouter);
  api.use('/wellness', wellnessRouter);
  api.use('/support', supportRouter);
  api.use('/consents', consentsRouter);
  api.use('/privacy', privacyRouter);
  api.use('/memories', memoriesRouter);
  app.use('/api/v1', api);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
