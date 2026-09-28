import { Request } from "express";
import { AuditLogEntry, UserRole } from "../src/types";
import { db } from "./db";

export function logAudit(
  actor: { id: string; name: string; role: UserRole },
  action: string,
  resourceType: string,
  resourceId: string | undefined,
  outcome: 'SUCCESS' | 'FORBIDDEN' | 'FAILED',
  details: string,
  req?: Request,
  extra?: {
    caseId?: string;
    fieldChanged?: string;
    oldValue?: string;
    newValue?: string;
  }
) {
  return db.logAuditEntry({
    actorId: actor.id,
    actorName: actor.name,
    actorRole: actor.role,
    action,
    resourceType,
    resourceId,
    caseId: extra?.caseId || (resourceType === 'MissingPerson' ? resourceId : undefined),
    case_id: extra?.caseId || (resourceType === 'MissingPerson' ? resourceId : undefined),
    userId: actor.id,
    user_id: actor.id,
    userRole: actor.role,
    user_role: actor.role,
    fieldChanged: extra?.fieldChanged,
    field_changed: extra?.fieldChanged,
    oldValue: extra?.oldValue,
    old_value: extra?.oldValue,
    newValue: extra?.newValue,
    new_value: extra?.newValue,
    outcome,
    details,
    ipAddress: req?.ip || req?.headers['x-forwarded-for']?.toString() || '127.0.0.1',
  });
}

export function getAuditLogs(options?: { caseId?: string; actorId?: string }): AuditLogEntry[] {
  return db.getAuditLogs(options);
}

export const auditLogs = {
  get length() {
    return db.getAuditLogs().length;
  },
  filter(fn: (item: AuditLogEntry) => boolean) {
    return db.getAuditLogs().filter(fn);
  },
  slice(start?: number, end?: number) {
    return db.getAuditLogs().slice(start, end);
  },
  [Symbol.iterator]() {
    return db.getAuditLogs()[Symbol.iterator]();
  },
};
