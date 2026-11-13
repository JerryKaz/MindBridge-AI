/**
 * Creates (or promotes) an administrator account.
 * Usage: pnpm --filter @mindbridge/api create-admin -- admin@example.com "Display Name" [SUPER_ADMIN]
 * The password is read from the ADMIN_PASSWORD environment variable so it never lands in shell history.
 */
import { passwordSchema, emailSchema } from '@mindbridge/shared';
import { env } from '../config/env.js';
import { connectDatabase, disconnectDatabase } from '../config/db.js';
import { hashPassword } from '../modules/auth/password.js';
import { UserModel } from '../modules/students/user.model.js';

async function main() {
  const [emailArg, name = 'Administrator', roleArg = 'ADMIN'] = process.argv.slice(2).filter((a) => a !== '--');
  const email = emailSchema.parse(emailArg);
  const role = roleArg === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'ADMIN';
  const password = passwordSchema.parse(process.env.ADMIN_PASSWORD);

  await connectDatabase(env.MONGODB_URI);
  await UserModel.findOneAndUpdate(
    { email },
    { $set: { role, status: 'ACTIVE', passwordHash: await hashPassword(password) }, $setOnInsert: { email, displayName: name, onboardingCompleted: true } },
    { upsert: true },
  );
  console.log(`${role} account ready for ${email}`);
}

main()
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(() => disconnectDatabase());
