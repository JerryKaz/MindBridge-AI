import type { Types } from 'mongoose';
import type { StudentProfile, SupportResource, WellnessActivity } from '@mindbridge/shared';
import { iso } from './serialize.js';

type Ref = Types.ObjectId | { _id: Types.ObjectId; name: string } | null | undefined;

const populatedName = (ref: Ref): { id: string; name: string } | null =>
  ref && typeof ref === 'object' && 'name' in ref ? { id: ref._id.toString(), name: ref.name } : null;

export function toProfile(u: {
  _id: Types.ObjectId;
  email: string;
  displayName: string;
  status: StudentProfile['status'];
  university?: Ref;
  yearOfStudy?: number | null;
  onboardingCompleted?: boolean | null;
  createdAt: Date;
}): StudentProfile {
  return {
    id: u._id.toString(),
    email: u.email,
    displayName: u.displayName,
    status: u.status,
    university: populatedName(u.university),
    yearOfStudy: u.yearOfStudy ?? null,
    onboardingCompleted: Boolean(u.onboardingCompleted),
    createdAt: u.createdAt.toISOString(),
  };
}

export function toSupportResource(r: {
  _id: Types.ObjectId;
  name: string;
  category: SupportResource['category'];
  description: string;
  university?: Ref;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  location?: string | null;
  region?: string | null;
  availability?: string | null;
  isFree?: boolean | null;
  verificationStatus: SupportResource['verificationStatus'];
  verifiedAt?: Date | null;
  published: boolean;
}): SupportResource {
  return {
    id: r._id.toString(),
    name: r.name,
    category: r.category,
    description: r.description,
    university: populatedName(r.university),
    phone: r.phone ?? null,
    email: r.email ?? null,
    website: r.website ?? null,
    location: r.location ?? null,
    region: r.region ?? null,
    availability: r.availability ?? null,
    isFree: r.isFree ?? null,
    verificationStatus: r.verificationStatus,
    verifiedAt: iso(r.verifiedAt),
    published: r.published,
  };
}

export function toWellnessActivity(a: {
  _id: Types.ObjectId;
  title: string;
  description: string;
  category: WellnessActivity['category'];
  durationMinutes: number;
  instructions: string[];
  reviewStatus: WellnessActivity['reviewStatus'];
  reviewedBy?: string | null;
  published: boolean;
}): WellnessActivity {
  return {
    id: a._id.toString(),
    title: a.title,
    description: a.description,
    category: a.category,
    durationMinutes: a.durationMinutes,
    instructions: a.instructions,
    reviewStatus: a.reviewStatus,
    reviewedBy: a.reviewedBy ?? null,
    published: a.published,
  };
}
