import { Schema, model, type InferSchemaType } from 'mongoose';
import { CONTENT_REVIEW_STATUSES, WELLNESS_CATEGORIES } from '@mindbridge/shared';

const wellnessActivitySchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, required: true, trim: true, maxlength: 500 },
    category: { type: String, enum: WELLNESS_CATEGORIES, required: true },
    durationMinutes: { type: Number, required: true, min: 1, max: 120 },
    instructions: { type: [String], required: true },
    reviewStatus: { type: String, enum: CONTENT_REVIEW_STATUSES, default: 'DRAFT' },
    reviewedBy: { type: String, default: null },
    published: { type: Boolean, default: false },
    completions: { type: Number, default: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true },
);

wellnessActivitySchema.index({ published: 1, category: 1, title: 1 });

export type WellnessActivity = InferSchemaType<typeof wellnessActivitySchema>;
export const WellnessActivityModel = model('WellnessActivity', wellnessActivitySchema, 'wellnessActivities');
