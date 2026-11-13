import { CONSENT_TYPES, type ConsentRecord, type ConsentType, type UpdateConsentsInput } from '@mindbridge/shared';
import { AppError } from '../../common/errors.js';
import { ConsentModel, CURRENT_POLICY_VERSION } from './consent.model.js';

export async function getConsents(studentId: string): Promise<ConsentRecord[]> {
  const docs = await ConsentModel.find({ student: studentId }).lean();
  return CONSENT_TYPES.map((type) => {
    const d = docs.find((x) => x.type === type);
    return { type, granted: d?.granted ?? false, updatedAt: d ? d.updatedAt.toISOString() : null };
  });
}

export async function updateConsents(studentId: string, input: UpdateConsentsInput): Promise<ConsentRecord[]> {
  for (const { type, granted } of input.consents) {
    if (type === 'TERMS_AND_PRIVACY' && !granted) {
      throw new AppError(400, 'CONSENT_REQUIRED', 'To withdraw from the terms, delete your account in Privacy settings');
    }
    await ConsentModel.updateOne(
      { student: studentId, type },
      {
        $set: { granted, policyVersion: CURRENT_POLICY_VERSION },
        $push: { history: { granted, policyVersion: CURRENT_POLICY_VERSION, at: new Date() } },
      },
      { upsert: true },
    );
  }
  return getConsents(studentId);
}

export async function hasConsent(studentId: string, type: ConsentType): Promise<boolean> {
  return Boolean(await ConsentModel.exists({ student: studentId, type, granted: true }));
}

export async function requireConsent(studentId: string, type: ConsentType, message: string): Promise<void> {
  if (!(await hasConsent(studentId, type))) throw new AppError(403, 'CONSENT_REQUIRED', message, { consent: type });
}
