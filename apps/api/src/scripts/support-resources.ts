import type { SupportCategory } from '@mindbridge/shared';

/**
 * The human support directory shown to students and used by the crisis pathway.
 * This file is the single source of truth — `pnpm seed` makes the database match it
 * (entries removed here are removed from the database).
 *
 * A resource is shown to students ONLY when it has both `verificationSource` and
 * `verifiedOn`. Never add a phone number you have not personally confirmed:
 * a wrong crisis number is worse than none.
 *
 * Example (copy, fill in with real details you have checked, then run `pnpm seed`):
 *
 *   {
 *     name: 'UPSA Counselling Unit',
 *     category: 'UNIVERSITY_COUNSELLING',
 *     description: 'Free, confidential counselling for registered UPSA students.',
 *     university: 'UPSA',                  // a university shortName from seed-data.ts, or omit
 *     phone: '+233 ...',
 *     email: 'counselling@...',
 *     location: 'Main campus, ...',
 *     region: 'Greater Accra',
 *     availability: 'Mon–Fri, 8am–5pm',
 *     isFree: true,
 *     verificationSource: 'Called the unit and confirmed details with the coordinator',
 *     verifiedOn: '2026-11-14',
 *   },
 */
export interface SupportResourceEntry {
  name: string;
  category: SupportCategory;
  description: string;
  /** University shortName from seed-data.ts (e.g. 'UPSA'); omit for national resources. */
  university?: string;
  phone?: string;
  email?: string;
  website?: string;
  location?: string;
  region?: string;
  availability?: string;
  isFree?: boolean;
  /** How you confirmed the details. Required for the resource to be shown. */
  verificationSource?: string;
  /** Date you confirmed the details, YYYY-MM-DD. Required for the resource to be shown. */
  verifiedOn?: string;
}

export const SUPPORT_RESOURCES: SupportResourceEntry[] = [
  // Add verified resources here.
];
