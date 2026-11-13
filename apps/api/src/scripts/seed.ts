/**
 * Seeds reference data: universities and starter wellness activities.
 * Support resources are intentionally NOT seeded — every resource must be
 * added and verified by an administrator in the dashboard.
 */
import { env } from '../config/env.js';
import { connectDatabase, disconnectDatabase } from '../config/db.js';
import { UniversityModel } from '../modules/universities/university.model.js';
import { WellnessActivityModel } from '../modules/wellness/wellness-activity.model.js';
import { UNIVERSITIES, WELLNESS_ACTIVITIES } from './seed-data.js';

async function seed() {
  await connectDatabase(env.MONGODB_URI);
  for (const u of UNIVERSITIES) {
    await UniversityModel.updateOne({ name: u.name }, { $setOnInsert: u }, { upsert: true });
  }
  for (const a of WELLNESS_ACTIVITIES) {
    await WellnessActivityModel.updateOne({ title: a.title }, { $setOnInsert: a }, { upsert: true });
  }
  await Promise.all([UniversityModel.syncIndexes(), WellnessActivityModel.syncIndexes()]);
  console.log(`Seeded ${UNIVERSITIES.length} universities and ${WELLNESS_ACTIVITIES.length} wellness activities.`);
  console.log('Support resources were not seeded: add and verify them in the admin dashboard.');
}

seed()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => disconnectDatabase());
