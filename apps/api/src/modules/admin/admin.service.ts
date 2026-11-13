import type {
  AdminUserRow,
  AuditLogEntry,
  Paginated,
  SupportResource,
  SupportResourceInput,
  WellnessActivity,
  WellnessActivityInput,
} from '@mindbridge/shared';
import { Types } from 'mongoose';
import { AppError, badRequest, forbidden, notFound } from '../../common/errors.js';
import { iso } from '../../common/serialize.js';
import { toSupportResource, toWellnessActivity } from '../../common/serializers.js';
import { RefreshTokenModel } from '../auth/refresh-token.model.js';
import { AuditLogModel } from '../audit/audit-log.model.js';
import { recordAudit } from '../audit/audit.service.js';
import { UserModel } from '../students/user.model.js';
import { SupportResourceModel } from '../support/support-resource.model.js';
import { WellnessActivityModel } from '../wellness/wellness-activity.model.js';

export interface Actor {
  id: string;
  ip: string | null;
}

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// ---- Users ---------------------------------------------------------------
export async function listUsers(q: { page: number; pageSize: number; search?: string }): Promise<Paginated<AdminUserRow>> {
  const filter: Record<string, unknown> = {};
  if (q.search) filter.$or = [{ email: new RegExp(escapeRegex(q.search), 'i') }, { displayName: new RegExp(escapeRegex(q.search), 'i') }];
  const [total, docs] = await Promise.all([
    UserModel.countDocuments(filter),
    UserModel.find(filter)
      .sort({ createdAt: -1 })
      .skip((q.page - 1) * q.pageSize)
      .limit(q.pageSize)
      .populate('university', 'shortName')
      .lean(),
  ]);
  return {
    total,
    page: q.page,
    pageSize: q.pageSize,
    items: docs.map((u) => ({
      id: u._id.toString(),
      email: u.email,
      displayName: u.displayName,
      role: u.role,
      status: u.status,
      university: u.university && 'shortName' in u.university ? (u.university.shortName as string) : null,
      createdAt: u.createdAt.toISOString(),
      lastActiveAt: iso(u.lastActiveAt),
    })),
  };
}

export async function setUserStatus(actor: Actor, userId: string, status: 'ACTIVE' | 'DEACTIVATED'): Promise<void> {
  if (userId === actor.id) throw badRequest('You cannot change your own account status');
  const user = await UserModel.findById(userId);
  if (!user) throw notFound('User');
  if (user.role === 'SUPER_ADMIN') throw forbidden('Super admin accounts cannot be changed here');
  user.status = status;
  await user.save();
  if (status === 'DEACTIVATED') await RefreshTokenModel.updateMany({ user: user._id, revokedAt: null }, { revokedAt: new Date() });
  await recordAudit({ actorId: actor.id, action: `USER_${status}`, targetType: 'user', targetId: userId, ip: actor.ip });
}

// ---- Wellness content ------------------------------------------------------
export async function listWellness(): Promise<WellnessActivity[]> {
  return (await WellnessActivityModel.find().sort({ updatedAt: -1 }).lean()).map(toWellnessActivity);
}

export async function createWellness(actor: Actor, input: WellnessActivityInput): Promise<WellnessActivity> {
  const doc = await WellnessActivityModel.create({ ...input, createdBy: actor.id });
  await recordAudit({ actorId: actor.id, action: 'WELLNESS_CREATED', targetType: 'wellnessActivity', targetId: doc.id, metadata: { published: doc.published }, ip: actor.ip });
  return toWellnessActivity(doc);
}

export async function updateWellness(actor: Actor, id: string, input: Partial<WellnessActivityInput>): Promise<WellnessActivity> {
  const doc = await WellnessActivityModel.findByIdAndUpdate(id, input, { new: true, runValidators: true });
  if (!doc) throw notFound('Activity');
  await recordAudit({ actorId: actor.id, action: 'WELLNESS_UPDATED', targetType: 'wellnessActivity', targetId: id, metadata: { fields: Object.keys(input) }, ip: actor.ip });
  return toWellnessActivity(doc);
}

// ---- Support resources ---------------------------------------------------
export async function listSupport(): Promise<SupportResource[]> {
  return (await SupportResourceModel.find().populate('university', 'name').sort({ updatedAt: -1 }).lean()).map(toSupportResource);
}

/**
 * Enforces the directory's core rule: only VERIFIED resources with a recorded
 * verification source can be published, and verification is attributed.
 */
function applyVerificationRules(
  update: Partial<SupportResourceInput> & Record<string, unknown>,
  existing: { verificationStatus?: string; verificationSource?: string | null; published?: boolean } | null,
  actorId: string,
) {
  const status = update.verificationStatus ?? existing?.verificationStatus ?? 'PENDING';
  const source = update.verificationSource ?? existing?.verificationSource;
  const published = update.published ?? existing?.published ?? false;
  if (status === 'VERIFIED' && !source) {
    throw new AppError(400, 'VERIFICATION_SOURCE_REQUIRED', 'Record how this resource was verified before marking it verified');
  }
  if (published && status !== 'VERIFIED') {
    throw new AppError(400, 'NOT_VERIFIED', 'Only verified resources can be published to students');
  }
  if (update.verificationStatus === 'VERIFIED' && existing?.verificationStatus !== 'VERIFIED') {
    update.verifiedAt = new Date();
    update.verifiedBy = new Types.ObjectId(actorId);
  }
  if (update.verificationStatus && update.verificationStatus !== 'VERIFIED') {
    update.published = false;
    update.verifiedAt = null;
  }
  if (update.universityId !== undefined) {
    update.university = update.universityId;
    delete update.universityId;
  }
}

export async function createSupport(actor: Actor, input: SupportResourceInput): Promise<SupportResource> {
  const data: Record<string, unknown> & Partial<SupportResourceInput> = { ...input };
  applyVerificationRules(data, null, actor.id);
  const doc = await SupportResourceModel.create(data);
  await doc.populate('university', 'name');
  await recordAudit({ actorId: actor.id, action: 'SUPPORT_RESOURCE_CREATED', targetType: 'supportResource', targetId: doc.id, metadata: { verificationStatus: doc.verificationStatus }, ip: actor.ip });
  return toSupportResource(doc);
}

export async function updateSupport(actor: Actor, id: string, input: Partial<SupportResourceInput>): Promise<SupportResource> {
  const existing = await SupportResourceModel.findById(id).lean();
  if (!existing) throw notFound('Resource');
  const data: Record<string, unknown> & Partial<SupportResourceInput> = { ...input };
  applyVerificationRules(data, existing, actor.id);
  const doc = await SupportResourceModel.findByIdAndUpdate(id, data, { new: true, runValidators: true }).populate('university', 'name');
  if (!doc) throw notFound('Resource');
  await recordAudit({
    actorId: actor.id,
    action: input.verificationStatus && input.verificationStatus !== existing.verificationStatus ? `SUPPORT_RESOURCE_${input.verificationStatus}` : 'SUPPORT_RESOURCE_UPDATED',
    targetType: 'supportResource',
    targetId: id,
    metadata: { fields: Object.keys(input) },
    ip: actor.ip,
  });
  return toSupportResource(doc);
}

// ---- Audit log -------------------------------------------------------------
export async function listAudit(q: { page: number; pageSize: number }): Promise<Paginated<AuditLogEntry>> {
  const [total, docs] = await Promise.all([
    AuditLogModel.estimatedDocumentCount(),
    AuditLogModel.find()
      .sort({ createdAt: -1 })
      .skip((q.page - 1) * q.pageSize)
      .limit(q.pageSize)
      .populate<{ actor: { _id: Types.ObjectId; email: string } | null }>('actor', 'email')
      .lean(),
  ]);
  return {
    total,
    page: q.page,
    pageSize: q.pageSize,
    items: docs.map((d) => ({
      id: d._id.toString(),
      actor: d.actor ? { id: d.actor._id.toString(), email: d.actor.email } : null,
      action: d.action,
      targetType: d.targetType,
      targetId: d.targetId ?? null,
      metadata: (d.metadata ?? {}) as Record<string, unknown>,
      createdAt: d.createdAt.toISOString(),
    })),
  };
}
