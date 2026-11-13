import { Schema, model, type InferSchemaType } from 'mongoose';

const universitySchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 150 },
    shortName: { type: String, required: true, trim: true, maxlength: 20 },
    city: { type: String, required: true, trim: true, maxlength: 80 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

universitySchema.index({ name: 1 }, { unique: true });
universitySchema.index({ active: 1, name: 1 });

export type University = InferSchemaType<typeof universitySchema>;
export const UniversityModel = model('University', universitySchema, 'universities');
