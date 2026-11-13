// Creates apps/api/.env from the example, with freshly
// generated secrets. Never overwrites an existing .env. Run: pnpm setup:env
import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const rand = (n) => randomBytes(n).toString('base64');

const api = 'apps/api/.env';
if (existsSync(api)) console.log(`${api} already exists — left unchanged`);
else {
  const content = readFileSync('apps/api/.env.example', 'utf8')
    .replace(/^JWT_ACCESS_SECRET=.*$/m, `JWT_ACCESS_SECRET=${rand(48)}`)
    .replace(/^JWT_REFRESH_SECRET=.*$/m, `JWT_REFRESH_SECRET=${rand(48)}`)
    .replace(/^FIELD_ENCRYPTION_KEY=.*$/m, `FIELD_ENCRYPTION_KEY=${rand(32)}`);
  writeFileSync(api, content);
  console.log(`Created ${api} with generated secrets`);
}

