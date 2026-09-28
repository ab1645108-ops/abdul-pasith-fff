import fs from 'fs';
import path from 'path';
import { Response, Request } from 'express';
import { MissingPerson, AuditLogEntry, SystemAlert, UserRole, CaseChangeRecord } from '../src/types';
import { SYSTEM_USERS } from '../src/data/featureMockData';

interface DatabaseSchema {
  version: number;
  cases: MissingPerson[];
  auditLogs: AuditLogEntry[];
  alerts: SystemAlert[];
  lastUpdated: string;
}

const DB_DIR = path.resolve(process.cwd(), 'server', 'data');
const DB_FILE = path.join(DB_DIR, 'database.json');

// SSE Real-time client listeners
type SSEListener = (data: { event: string; payload: any }) => void;
const sseListeners = new Set<SSEListener>();

class DatabaseService {
  private data: DatabaseSchema = {
    version: 1,
    cases: [],
    auditLogs: [],
    alerts: [],
    lastUpdated: new Date().toISOString(),
  };

  private isInitialized = false;

  constructor() {
    this.init();
  }

  public init() {
    if (this.isInitialized) return;
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.cases)) {
          this.data = {
            version: parsed.version || 1,
            cases: parsed.cases || [],
            auditLogs: parsed.auditLogs || [],
            alerts: parsed.alerts || [],
            lastUpdated: parsed.lastUpdated || new Date().toISOString(),
          };
          this.isInitialized = true;
          return;
        }
      }

      // Initialize with default structure
      this.data = {
        version: 1,
        cases: [],
        auditLogs: [],
        alerts: [],
        lastUpdated: new Date().toISOString(),
      };
      this.persist();
      this.isInitialized = true;
    } catch (err) {
      console.error('[DatabaseService] Failed to load database file, initializing fresh:', err);
      this.isInitialized = true;
    }
  }

  private persist() {
    try {
      this.data.lastUpdated = new Date().toISOString();
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }
      const tmpFile = `${DB_FILE}.tmp.${Date.now()}`;
      fs.writeFileSync(tmpFile, JSON.stringify(this.data, null, 2), 'utf-8');
      fs.renameSync(tmpFile, DB_FILE);
    } catch (err) {
      console.error('[DatabaseService] Atomic write failed:', err);
    }
  }

  // -------------------------------------------------------------
  // Real-time Event Subscription (SSE)
  // -------------------------------------------------------------
  public addSSEListener(listener: SSEListener): () => void {
    sseListeners.add(listener);
    return () => {
      sseListeners.delete(listener);
    };
  }

  public broadcastEvent(event: string, payload: any) {
    for (const listener of sseListeners) {
      try {
        listener({ event, payload });
      } catch (err) {
        console.warn('[DatabaseService] Error dispatching SSE event:', err);
      }
    }
  }

  // -------------------------------------------------------------
  // Case Access & Queries
  // -------------------------------------------------------------
  public getAllCases(options?: {
    includeDeleted?: boolean;
    callerRole?: UserRole;
    callerId?: string;
    callerEmail?: string;
  }): MissingPerson[] {
    const { includeDeleted = false, callerRole, callerId, callerEmail } = options || {};

    // Admin & Investigators see all active cases by default; with includeDeleted=true, they see all including archived
    if (callerRole === 'ADMIN' || callerRole === 'INVESTIGATOR') {
      if (includeDeleted) {
        return [...this.data.cases];
      }
      return this.data.cases.filter((c) => !c.is_deleted);
    }

    // Citizen / Public caller
    // If includeDeleted is requested by a citizen, only include their own archived cases for "My Reports" view
    return this.data.cases.filter((c) => {
      if (c.is_deleted) {
        if (!includeDeleted) return false;
        const isOwner =
          (callerId && c.reportedByUserId === callerId) ||
          (callerEmail && c.reportedByUserEmail?.toLowerCase() === callerEmail.toLowerCase());
        return isOwner;
      }
      return true;
    });
  }

  public getCaseById(id: string): MissingPerson | undefined {
    return this.data.cases.find((c) => c.id === id);
  }

  public getCaseByCaseNumber(caseNumber: string): MissingPerson | undefined {
    return this.data.cases.find((c) => c.caseNumber.toLowerCase() === caseNumber.toLowerCase());
  }

  // -------------------------------------------------------------
  // Case Mutations (Permanent DB Storage)
  // -------------------------------------------------------------
  public createCase(newCase: MissingPerson, actor: { id: string; name: string; role: UserRole }, req?: Request): MissingPerson {
    const timestamp = new Date().toISOString();
    const preparedCase: MissingPerson = {
      ...newCase,
      created_at: newCase.created_at || timestamp,
      updated_at: newCase.updated_at || timestamp,
      is_deleted: false,
      hasUnreadCitizenUpdate: false,
      changeHistory: [
        {
          id: `CHG-${Date.now()}-0`,
          caseId: newCase.id,
          userId: actor.id,
          userName: actor.name,
          userRole: actor.role,
          action: 'CASE_CREATED',
          timestamp,
          summary: `Case #${newCase.caseNumber} registered by ${actor.name} (${actor.role}).`,
        },
      ],
    };

    // Prepend to cases array (latest first)
    const existingIdx = this.data.cases.findIndex((c) => c.id === preparedCase.id);
    if (existingIdx >= 0) {
      this.data.cases[existingIdx] = preparedCase;
    } else {
      this.data.cases.unshift(preparedCase);
    }

    this.logAuditEntry({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'CASE_CREATED',
      resourceType: 'MissingPerson',
      resourceId: preparedCase.id,
      caseId: preparedCase.id,
      outcome: 'SUCCESS',
      details: `New case dossier #${preparedCase.caseNumber} registered for ${preparedCase.name}.`,
      ipAddress: req?.ip,
    });

    this.persist();
    this.broadcastEvent('CASE_CREATED', preparedCase);
    return preparedCase;
  }

  public updateCase(
    id: string,
    updates: Partial<MissingPerson>,
    actor: { id: string; name: string; role: UserRole },
    req?: Request
  ): { success: boolean; case?: MissingPerson; error?: string } {
    const targetIdx = this.data.cases.findIndex((c) => c.id === id);
    if (targetIdx < 0) {
      return { success: false, error: `Case ${id} not found in database.` };
    }

    const currentCase = this.data.cases[targetIdx];
    const timestamp = new Date().toISOString();

    // Security Check for Citizen:
    // Citizens can ONLY edit their own case and cannot change administrative fields
    const isCitizen = actor.role === 'CITIZEN' || actor.role === 'PUBLIC_USER';
    if (isCitizen) {
      const isOwner =
        (currentCase.reportedByUserId && currentCase.reportedByUserId === actor.id) ||
        (currentCase.reportedByUserEmail && actor.id && currentCase.reportedByUserEmail.toLowerCase().includes(actor.name.toLowerCase())) ||
        (currentCase.reportedByName && currentCase.reportedByName.toLowerCase() === actor.name.toLowerCase()) ||
        currentCase.reportedByRole === 'CITIZEN' ||
        currentCase.reportedByRole === 'PUBLIC_USER';

      if (!isOwner) {
        this.logAuditEntry({
          actorId: actor.id,
          actorName: actor.name,
          actorRole: actor.role,
          action: 'CASE_UPDATED',
          resourceType: 'MissingPerson',
          resourceId: id,
          caseId: id,
          outcome: 'FORBIDDEN',
          details: `Unauthorized attempt to edit Case #${currentCase.caseNumber}. Citizen is not the registered owner.`,
          ipAddress: req?.ip,
        });
        return { success: false, error: 'Unauthorized: You can only edit your own registered missing person case.' };
      }

      // Enforce immutability of administrative fields for citizens
      delete (updates as any).id;
      delete (updates as any).caseNumber;
      delete (updates as any).status;
      delete (updates as any).isVerified;
      delete (updates as any).verifiedBy;
      delete (updates as any).verifiedAt;
      delete (updates as any).verificationNotes;
      delete (updates as any).foundConfirmation;
      delete (updates as any).assignedInvestigatorId;
      delete (updates as any).assignedInvestigatorName;
      delete (updates as any).assignedBadgeNumber;
      delete (updates as any).is_deleted;
      delete (updates as any).deleted_at;
      delete (updates as any).deleted_by;
    }

    // Detect field changes for audit tracking
    const fieldChanges: { field: string; oldVal: string; newVal: string }[] = [];
    const keysToCheck: (keyof MissingPerson)[] = [
      'name',
      'age',
      'gender',
      'alertType',
      'missingSince',
      'clothingLastSeen',
      'summary',
      'reporterPhone',
      'reporterEmail',
      'emergencyContact',
      'investigatingAgency',
      'photoUrl',
    ];

    for (const key of keysToCheck) {
      if (updates[key] !== undefined && updates[key] !== currentCase[key]) {
        fieldChanges.push({
          field: String(key),
          oldVal: String(currentCase[key] ?? ''),
          newVal: String(updates[key] ?? ''),
        });
      }
    }

    // Check location diff
    if (updates.lastSeenLocation && updates.lastSeenLocation.name !== currentCase.lastSeenLocation?.name) {
      fieldChanges.push({
        field: 'lastSeenLocation',
        oldVal: currentCase.lastSeenLocation?.name || '',
        newVal: updates.lastSeenLocation.name,
      });
    }

    // Create change records and audit logs
    const newChanges: CaseChangeRecord[] = fieldChanges.map((ch, idx) => ({
      id: `CHG-${Date.now()}-${idx}`,
      caseId: id,
      userId: actor.id,
      userName: actor.name,
      userRole: actor.role,
      action: 'CASE_UPDATED',
      fieldChanged: ch.field,
      oldValue: ch.oldVal,
      newValue: ch.newVal,
      timestamp,
      summary: `Updated ${ch.field}: "${ch.oldVal}" -> "${ch.newVal}"`,
    }));

    // Consolidate changes summary
    const changesSummary = fieldChanges.map((c) => `${c.field} updated`);

    const updatedCase: MissingPerson = {
      ...currentCase,
      ...updates,
      id: currentCase.id, // Immutable
      caseNumber: currentCase.caseNumber, // Immutable
      updated_at: timestamp,
      last_edited_by: actor.name,
      last_edited_role: actor.role,
      hasUnreadCitizenUpdate: isCitizen ? true : currentCase.hasUnreadCitizenUpdate,
      recentChangesSummary: changesSummary.length > 0 ? changesSummary : currentCase.recentChangesSummary,
      changeHistory: [...(currentCase.changeHistory || []), ...newChanges],
    };

    this.data.cases[targetIdx] = updatedCase;

    // Log granular audits
    for (const ch of fieldChanges) {
      this.logAuditEntry({
        actorId: actor.id,
        actorName: actor.name,
        actorRole: actor.role,
        action: 'CASE_UPDATED',
        resourceType: 'MissingPerson',
        resourceId: id,
        caseId: id,
        fieldChanged: ch.field,
        oldValue: ch.oldVal,
        newValue: ch.newVal,
        outcome: 'SUCCESS',
        details: `Case #${updatedCase.caseNumber} (${updatedCase.name}) field "${ch.field}" updated by ${actor.name} (${actor.role}).`,
        ipAddress: req?.ip,
      });
    }

    if (fieldChanges.length === 0) {
      this.logAuditEntry({
        actorId: actor.id,
        actorName: actor.name,
        actorRole: actor.role,
        action: 'CASE_UPDATED',
        resourceType: 'MissingPerson',
        resourceId: id,
        caseId: id,
        outcome: 'SUCCESS',
        details: `Case #${updatedCase.caseNumber} updated by ${actor.name} (${actor.role}).`,
        ipAddress: req?.ip,
      });
    }

    // Create in-app system alert for Investigator and Admin
    if (isCitizen && fieldChanges.length > 0) {
      const citizenAlert: SystemAlert = {
        id: `ALT-EDIT-${Date.now().toString().slice(-5)}`,
        type: 'CASE_UPDATE',
        severity: 'INFO',
        title: `Citizen Update: Case #${updatedCase.caseNumber}`,
        message: `Reporter ${actor.name} updated details for ${updatedCase.name}: [${changesSummary.join(', ')}].`,
        personId: updatedCase.id,
        personName: updatedCase.name,
        locationName: updatedCase.lastSeenLocation?.name,
        timestamp,
        isRead: false,
        broadcastChannels: ['In-App System Notification', 'Investigator Dashboard'],
        targetAudience: 'INVESTIGATORS',
      };
      this.data.alerts.unshift(citizenAlert);
    }

    this.persist();
    this.broadcastEvent('CASE_UPDATED', updatedCase);

    return { success: true, case: updatedCase };
  }

  public archiveCase(
    id: string,
    actor: { id: string; name: string; role: UserRole },
    reason: string = 'DELETED BY REPORTER',
    req?: Request
  ): { success: boolean; case?: MissingPerson; error?: string } {
    const targetIdx = this.data.cases.findIndex((c) => c.id === id);
    if (targetIdx < 0) {
      return { success: false, error: `Case ${id} not found in database.` };
    }

    const currentCase = this.data.cases[targetIdx];
    const timestamp = new Date().toISOString();

    // Security Check for Citizen:
    // Can only archive their own case
    const isCitizen = actor.role === 'CITIZEN' || actor.role === 'PUBLIC_USER';
    if (isCitizen) {
      const isOwner =
        (currentCase.reportedByUserId && currentCase.reportedByUserId === actor.id) ||
        (currentCase.reportedByUserEmail && actor.id && currentCase.reportedByUserEmail.toLowerCase().includes(actor.name.toLowerCase())) ||
        (currentCase.reportedByName && currentCase.reportedByName.toLowerCase() === actor.name.toLowerCase()) ||
        currentCase.reportedByRole === 'CITIZEN' ||
        currentCase.reportedByRole === 'PUBLIC_USER';

      if (!isOwner) {
        this.logAuditEntry({
          actorId: actor.id,
          actorName: actor.name,
          actorRole: actor.role,
          action: 'CASE_ARCHIVED',
          resourceType: 'MissingPerson',
          resourceId: id,
          caseId: id,
          outcome: 'FORBIDDEN',
          details: `Unauthorized attempt to archive Case #${currentCase.caseNumber}. User is not authorized owner.`,
          ipAddress: req?.ip,
        });
        return { success: false, error: 'Unauthorized: You can only delete/archive your own registered case.' };
      }
    }

    const changeEntry: CaseChangeRecord = {
      id: `CHG-${Date.now()}`,
      caseId: id,
      userId: actor.id,
      userName: actor.name,
      userRole: actor.role,
      action: 'CASE_ARCHIVED',
      fieldChanged: 'is_deleted',
      oldValue: 'false',
      newValue: 'true',
      timestamp,
      summary: `Case marked as ARCHIVED / DELETED BY REPORTER by ${actor.name} (${actor.role}). Reason: ${reason}.`,
    };

    const updatedCase: MissingPerson = {
      ...currentCase,
      is_deleted: true,
      deleted_at: timestamp,
      deleted_by: actor.name,
      deleted_role: actor.role,
      status: 'Archived',
      publicStatusStage: 'ARCHIVED',
      archiveReason: reason,
      updated_at: timestamp,
      changeHistory: [...(currentCase.changeHistory || []), changeEntry],
    };

    this.data.cases[targetIdx] = updatedCase;

    // System Alert for Admin & Investigator
    const archiveAlert: SystemAlert = {
      id: `ALT-ARCH-${Date.now().toString().slice(-5)}`,
      type: 'CASE_UPDATE',
      severity: 'HIGH',
      title: `Case Withdrawn / Archived: Case #${updatedCase.caseNumber}`,
      message: `Case #${updatedCase.caseNumber} for ${updatedCase.name} was archived by reporter ${actor.name} (${reason}). Public broadcasting halted; historical records retained.`,
      personId: updatedCase.id,
      personName: updatedCase.name,
      timestamp,
      isRead: false,
      broadcastChannels: ['In-App System Notification', 'Admin Command Center', 'Investigator CAD'],
      targetAudience: 'INVESTIGATORS',
    };
    this.data.alerts.unshift(archiveAlert);

    this.logAuditEntry({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'CASE_ARCHIVED',
      resourceType: 'MissingPerson',
      resourceId: id,
      caseId: id,
      outcome: 'SUCCESS',
      details: `Case dossier #${updatedCase.caseNumber} (${updatedCase.name}) archived/deleted by ${actor.name} (${actor.role}). Reason: ${reason}. Soft-deleted and preserved in Admin archive.`,
      ipAddress: req?.ip,
    });

    this.persist();
    this.broadcastEvent('CASE_ARCHIVED', updatedCase);

    return { success: true, case: updatedCase };
  }

  public restoreCase(
    id: string,
    actor: { id: string; name: string; role: UserRole },
    req?: Request
  ): { success: boolean; case?: MissingPerson; error?: string } {
    if (actor.role !== 'ADMIN' && actor.role !== 'INVESTIGATOR') {
      return { success: false, error: 'Unauthorized: Only Administrators and Investigators can restore archived cases.' };
    }

    const targetIdx = this.data.cases.findIndex((c) => c.id === id);
    if (targetIdx < 0) {
      return { success: false, error: `Case ${id} not found in database.` };
    }

    const currentCase = this.data.cases[targetIdx];
    const timestamp = new Date().toISOString();

    const changeEntry: CaseChangeRecord = {
      id: `CHG-${Date.now()}`,
      caseId: id,
      userId: actor.id,
      userName: actor.name,
      userRole: actor.role,
      action: 'CASE_RESTORED',
      fieldChanged: 'is_deleted',
      oldValue: 'true',
      newValue: 'false',
      timestamp,
      summary: `Case restored to active search registry by ${actor.name} (${actor.role}).`,
    };

    const updatedCase: MissingPerson = {
      ...currentCase,
      is_deleted: false,
      deleted_at: undefined,
      deleted_by: undefined,
      deleted_role: undefined,
      status: 'Active',
      publicStatusStage: 'REPORTED',
      archiveReason: undefined,
      updated_at: timestamp,
      changeHistory: [...(currentCase.changeHistory || []), changeEntry],
    };

    this.data.cases[targetIdx] = updatedCase;

    this.logAuditEntry({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'CASE_RESTORED',
      resourceType: 'MissingPerson',
      resourceId: id,
      caseId: id,
      outcome: 'SUCCESS',
      details: `Case dossier #${updatedCase.caseNumber} (${updatedCase.name}) restored to active status by ${actor.name} (${actor.role}).`,
      ipAddress: req?.ip,
    });

    this.persist();
    this.broadcastEvent('CASE_RESTORED', updatedCase);

    return { success: true, case: updatedCase };
  }

  // -------------------------------------------------------------
  // Audit Log Storage
  // -------------------------------------------------------------
  public logAuditEntry(entryData: Omit<AuditLogEntry, 'id' | 'timestamp'> & { timestamp?: string }) {
    const entry: AuditLogEntry = {
      id: `AUD-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`,
      timestamp: entryData.timestamp || new Date().toISOString(),
      actorId: entryData.actorId,
      actorName: entryData.actorName,
      actorRole: entryData.actorRole,
      action: entryData.action,
      resourceType: entryData.resourceType,
      resourceId: entryData.resourceId,
      caseId: entryData.caseId || entryData.case_id,
      case_id: entryData.caseId || entryData.case_id,
      userId: entryData.userId || entryData.actorId,
      user_id: entryData.userId || entryData.actorId,
      userRole: entryData.userRole || entryData.actorRole,
      user_role: entryData.userRole || entryData.actorRole,
      fieldChanged: entryData.fieldChanged || entryData.field_changed,
      field_changed: entryData.fieldChanged || entryData.field_changed,
      oldValue: entryData.oldValue || entryData.old_value,
      old_value: entryData.oldValue || entryData.old_value,
      newValue: entryData.newValue || entryData.new_value,
      new_value: entryData.newValue || entryData.new_value,
      outcome: entryData.outcome,
      details: entryData.details,
      ipAddress: entryData.ipAddress || '127.0.0.1',
    };

    this.data.auditLogs.unshift(entry);
    if (this.data.auditLogs.length > 500) {
      this.data.auditLogs.pop();
    }

    this.persist();
    return entry;
  }

  public getAuditLogs(options?: { caseId?: string; actorId?: string }): AuditLogEntry[] {
    const { caseId, actorId } = options || {};
    let logs = this.data.auditLogs;
    if (caseId) {
      logs = logs.filter((l) => l.caseId === caseId || l.resourceId === caseId);
    }
    if (actorId) {
      logs = logs.filter((l) => l.actorId === actorId);
    }
    return logs;
  }

  // -------------------------------------------------------------
  // Alerts Storage
  // -------------------------------------------------------------
  public getAlerts(): SystemAlert[] {
    return this.data.alerts;
  }

  public addAlert(alert: SystemAlert) {
    this.data.alerts.unshift(alert);
    if (this.data.alerts.length > 200) {
      this.data.alerts.pop();
    }
    this.persist();
  }
}

export const db = new DatabaseService();
