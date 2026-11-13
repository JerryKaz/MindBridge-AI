import { Schema, model, type InferSchemaType } from 'mongoose';
import { CONSENT_TYPES } from '@mindbridge/shared';

/** One document per (student, consent type); history kept in `history` for accountability. */
const consentSchema = new Schema(
  {
    student: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: CONSENT_TYPES, required: true },
    granted: { type: Boolean, required: true },
    policyVersion: { type: String, required: true },
    history: [
      {
        _id: false,
        granted: Boolean,
        policyVersion: String,
        at: { type: Date, default: () => new Date() },
      },
    ],
  },
  { timestamps: true },
);

consentSchema.index({ student: 1, type: 1 }, { unique: true });

export type Consent = InferSchemaType<typeof consentSchema>;
export const ConsentModel = model('Consent', consentSchema, 'consents');
export const CURRENT_POLICY_VERSION = '2026-11';
