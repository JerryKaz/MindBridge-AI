import type { StudentProfile, UpdateProfileInput } from '@mindbridge/shared';
import { badRequest, notFound } from '../../common/errors.js';
import { toProfile } from '../../common/serializers.js';
import { UniversityModel } from '../universities/university.model.js';
import { UserModel } from './user.model.js';

export async function getMe(userId: string): Promise<StudentProfile> {
  const user = await UserModel.findById(userId).populate('university', 'name');
  if (!user) throw notFound('Account');
  return toProfile(user);
}

export async function updateMe(userId: string, input: UpdateProfileInput): Promise<StudentProfile> {
  if (input.universityId && !(await UniversityModel.exists({ _id: input.universityId, active: true }))) {
    throw badRequest('Unknown university');
  }
  const update: Record<string, unknown> = {};
  if (input.displayName !== undefined) update.displayName = input.displayName;
  if (input.universityId !== undefined) update.university = input.universityId;
  if (input.yearOfStudy !== undefined) update.yearOfStudy = input.yearOfStudy;
  if (input.onboardingCompleted !== undefined) update.onboardingCompleted = input.onboardingCompleted;
  const user = await UserModel.findByIdAndUpdate(userId, update, { new: true, runValidators: true }).populate(
    'university',
    'name',
  );
  if (!user) throw notFound('Account');
  return toProfile(user);
}

export async function touchActivity(userId: string): Promise<void> {
  await UserModel.updateOne({ _id: userId }, { lastActiveAt: new Date() });
}
