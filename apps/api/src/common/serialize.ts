import type { Types } from 'mongoose';

export const id = (v: Types.ObjectId | string): string => v.toString();
export const iso = (d: Date | null | undefined): string | null => (d ? d.toISOString() : null);
