/**
 * Seeds reference data: universities, starter wellness activities and the
 * support directory from support-resources.ts. Safe to run repeatedly.
 */
import { supportResourceSchema } from '@mindbridge/shared';
import { env } from '../config/env.js';
import { connectDatabase, disconnectDatabase } from '../config/db.js';
import { SupportResourceModel } from '../modules/support/support-resource.model.js';
import { UniversityModel } from '../modules/universities/university.model.js';
import { WellnessActivityModel } from '../modules/wellness/wellness-activity.model.js';
import { UNIVERSITIES, WELLNESS_ACTIVITIES } from './seed-data.js';
import { SUPPORT_RESOURCES } from './support-resources.js';

const DATE = /^\d{4}-\d{2}-\d{2}$/;

async function seedSupportResources() {
  const names = new Set<string>();
  let shown = 0;

  for (const entry of SUPPORT_RESOURCES) {
    const { university: uniShortName, verificationSource, verifiedOn, ...fields } = entry;
    // Reuse the shared schema so phone/email/URL formats are checked before anything is written.
    supportResourceSchema.parse({ ...fields, verificationSource });
    if (names.has(entry.name)) throw new Error(`Duplicate support resource name: "${entry.name}"`);
    names.add(entry.name);

    let university = null;
    if (uniShortName) {
      const uni = await UniversityModel.findOne({ shortName: uniShortName }, { _id: 1 }).lean();
      if (!uni) throw new Error(`"${entry.name}": unknown university shortName "${uniShortName}"`);
      university = uni._id;
    }

    if (verifiedOn && !DATE.test(verifiedOn)) throw new Error(`"${entry.name}": verifiedOn must be YYYY-MM-DD`);
    const verified = Boolean(verificationSource && verifiedOn);
    if (verified) shown++;
    else console.warn(`  ! "${entry.name}" has no verificationSource/verifiedOn — it will NOT be shown to students.`);

    await SupportResourceModel.updateOne(
      { name: entry.name },
      {
        $set: {
          ...fields,
          phone: fields.phone ?? null,
          email: fields.email ?? null,
          website: fields.website ?? null,
          location: fields.location ?? null,
          region: fields.region ?? null,
          availability: fields.availability ?? null,
          isFree: fields.isFree ?? null,
          university,
          verificationStatus: verified ? 'VERIFIED' : 'PENDING',
          verificationSource: verificationSource ?? null,
          verifiedAt: verified ? new Date(`${verifiedOn}T00:00:00Z`) : null,
          published: verified,
        },
      },
      { upsert: true },
    );
  }

  // support-resources.ts is the source of truth: drop anything no longer listed.
  const removed = await SupportResourceModel.deleteMany({ name: { $nin: [...names] } });
  if (removed.deletedCount) console.log(`Removed ${removed.deletedCount} support resource(s) no longer in support-resources.ts.`);

  if (shown === 0) {
    console.warn(
      '\n  WARNING: no verified support resources. Students in distress will be shown no human contacts.\n' +
        '  Add real, confirmed entries to apps/api/src/scripts/support-resources.ts and run `pnpm seed` again.\n',
    );
  } else {
    console.log(`Support directory: ${shown} verified resource(s) visible to students.`);
  }
}

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
  await seedSupportResources();
}

seed()
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(() => disconnectDatabase());
