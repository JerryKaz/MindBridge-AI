import { AuditLogModel } from './audit-log.model.js';
import { logger } from '../../common/logger.js';

export interface AuditEntry {
  actorId: string | null;
  action: string;
  targetType: string;
  targetId?: string | null;
  metadata?: Record<string, unknown>;
  ip?: string | null;
}

/** Records a sensitive administrative/privacy action. Failures are logged, never swallowed silently. */
export async function recordAudit(entry: AuditEntry): Promise<void> {
  try {
    await AuditLogModel.create({
      actor: entry.actorId,
      action: entry.action,
      targetType: entry.targetType,
      targetId: entry.targetId ?? null,
      metadata: entry.metadata ?? {},
      ip: entry.ip ?? null,
    });
  } catch (err) {
    logger.error({ err, action: entry.action }, 'Failed to write audit log');
    throw err;
  }
}
