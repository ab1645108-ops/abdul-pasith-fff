import { MissingPerson, FoundConfirmationRecord, ReporterNotificationDelivery, SubjectCondition, ReunionStatus, CurrentUser } from '../types';
import { INITIAL_MISSING_PERSONS } from '../data/mockPersons';
import { getAuthHeaders } from './authService';

const STORAGE_KEY = 'findsafe_missing_cases_store_v2';

export function getLocalCases(): MissingPerson[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Failed to read cases from localStorage:', err);
  }
  return INITIAL_MISSING_PERSONS;
}

export function saveLocalCases(cases: MissingPerson[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cases));
  } catch (err) {
    console.warn('Failed to save cases to localStorage:', err);
  }
}

export async function fetchServerCases(): Promise<MissingPerson[] | null> {
  try {
    const res = await fetch('/api/cases', {
      headers: getAuthHeaders(),
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.cases)) {
        saveLocalCases(data.cases);
        return data.cases;
      }
    }
  } catch (err) {
    console.warn('Failed to fetch cases from server:', err);
  }
  return null;
}

export async function syncCaseCreation(newCase: MissingPerson): Promise<void> {
  try {
    await fetch('/api/cases', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(newCase),
    });
  } catch (err) {
    console.warn('Failed to sync case creation to server:', err);
  }
}

export async function syncCaseUpdate(updatedCase: MissingPerson): Promise<void> {
  try {
    await fetch(`/api/cases/${encodeURIComponent(updatedCase.id)}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updatedCase),
    });
  } catch (err) {
    console.warn('Failed to sync case update to server:', err);
  }
}

export async function syncCaseDeletion(caseId: string): Promise<void> {
  try {
    await fetch(`/api/cases/${encodeURIComponent(caseId)}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
  } catch (err) {
    console.warn('Failed to sync case deletion to server:', err);
  }
}

export interface ConfirmFoundPayload {
  foundLocation: string;
  foundAddress?: string;
  subjectCondition: SubjectCondition;
  reunionStatus: ReunionStatus;
  foundNotes: string;
  customNote?: string;
  notifyChannels?: {
    sms?: boolean;
    email?: boolean;
    inApp?: boolean;
  };
  caseData?: MissingPerson;
}

export interface ConfirmFoundResponse {
  success: boolean;
  case: MissingPerson;
  confirmation: FoundConfirmationRecord;
  notification: ReporterNotificationDelivery;
  message: string;
}

export async function confirmPersonFoundServer(
  caseId: string,
  payload: ConfirmFoundPayload,
  userOverride?: CurrentUser
): Promise<ConfirmFoundResponse> {
  const res = await fetch(`/api/cases/${encodeURIComponent(caseId)}/confirm-found`, {
    method: 'POST',
    headers: getAuthHeaders(userOverride),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to confirm case found (${res.status})`);
  }

  const data: ConfirmFoundResponse = await res.json();
  return data;
}

export async function fetchNotificationStatus(caseId: string): Promise<any> {
  const res = await fetch(`/api/cases/${encodeURIComponent(caseId)}/notification-status`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch notification status (${res.status})`);
  }
  return res.json();
}

export async function resendReporterNotificationServer(
  caseId: string,
  customNote?: string,
  userOverride?: CurrentUser
): Promise<{ success: boolean; case: MissingPerson; notification: ReporterNotificationDelivery; message: string }> {
  const res = await fetch(`/api/cases/${encodeURIComponent(caseId)}/resend-reporter-notification`, {
    method: 'POST',
    headers: getAuthHeaders(userOverride),
    body: JSON.stringify({ customNote }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to resend notification (${res.status})`);
  }

  return res.json();
}
