import { Router } from 'express';
import type { University } from '@mindbridge/shared';
import { UniversityModel } from './university.model.js';

export const universitiesRouter = Router();

/** Public list used during onboarding (selection is optional). */
universitiesRouter.get('/', async (_req, res) => {
  const list = await UniversityModel.find({ active: true }).sort({ name: 1 }).lean();
  const body: University[] = list.map((u) => ({ id: u._id.toString(), name: u.name, shortName: u.shortName, city: u.city }));
  res.set('Cache-Control', 'public, max-age=3600').json(body);
});
