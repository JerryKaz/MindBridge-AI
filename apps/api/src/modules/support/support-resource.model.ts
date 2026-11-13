import { Schema, model, type InferSchemaType } from 'mongoose';
import { SUPPORT_CATEGORIES, VERIFICATION_STATUSES } from '@mindbridge/shared';

/**
 * Human support directory. Students only ever see resources that are both
 * VERIFIED and published — nothing is shown on the strength of an unverified entry.
 */
const supportResourceSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 150 },
    category: { type: String, enum: SUPPORT_CATEGORIES, required: true },
    description: { type: String, required: true, trim: true, maxlength: 1000 },
    university: { type: Schema.Types.ObjectId, ref: 'University', default: null },
    phone: { type: String, default: null },
    email: { type: String, default: null },
    website: { type: String, default: null },
    location: { type: String, default: null },
    region: { type: String, default: null },
    availability: { type: String, default: null },
    isFree: { type: Boolean, default: null },
    verificationStatus: { type: String, enum: VERIFICATION_STATUSES, default: 'PENDING' },
    verificationSource: { type: String, default: null },
    verifiedAt: { type: Date, default: null },
    verifiedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    published: { type: Boolean, default: false },
    views: { type: Number, default: 0 },
  },
  { timestamps: true },
);

supportResourceSchema.index({ verificationStatus: 1, published: 1, category: 1 });
supportResourceSchema.index({ university: 1, verificationStatus: 1 });

export type SupportResourceDocShape = InferSchemaType<typeof supportResourceSchema>;
export const SupportResourceModel = model('SupportResource', supportResourceSchema, 'supportResources');
