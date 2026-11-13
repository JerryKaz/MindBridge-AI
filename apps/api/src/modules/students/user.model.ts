import { Schema, model, type InferSchemaType, type HydratedDocument } from 'mongoose';
import { ACCOUNT_STATUSES } from '@mindbridge/shared';

const userSchema = new Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true, maxlength: 254 },
    passwordHash: { type: String, required: true, select: false },
    displayName: { type: String, required: true, trim: true, maxlength: 50 },
    status: { type: String, enum: ACCOUNT_STATUSES, default: 'ACTIVE', required: true },
    university: { type: Schema.Types.ObjectId, ref: 'University', default: null },
    yearOfStudy: { type: Number, min: 1, max: 10, default: null },
    onboardingCompleted: { type: Boolean, default: false },
    lastActiveAt: { type: Date, default: null },
    passwordReset: {
      tokenHash: { type: String, select: false },
      expiresAt: { type: Date, select: false },
    },
  },
  { timestamps: true },
);

userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ status: 1, createdAt: -1 });
userSchema.index({ university: 1 });
userSchema.index({ lastActiveAt: -1 });

export type User = InferSchemaType<typeof userSchema>;
export type UserDoc = HydratedDocument<User>;
export const UserModel = model('User', userSchema, 'users');
