import {
  CurrentUser,
  AgeProgressionRecord,
  SystemAlert,
  DuplicateCaseFlag,
  AuditLogEntry,
  MissingPerson
} from '../types';

export const SYSTEM_USERS: CurrentUser[] = [
  {
    id: 'usr_investigator_1',
    name: 'Investigator',
    email: 'investigator@findsafe.ai',
    role: 'INVESTIGATOR',
    badgeNumber: 'INV-4108',
    agency: 'Special Investigations Unit',
  },
  {
    id: 'usr_admin_1',
    name: 'Admin',
    email: 'admin@findsafe.ai',
    role: 'ADMIN',
    badgeNumber: 'ADM-010',
    agency: 'Operations & Dispatch Command',
  },
  {
    id: 'usr_public_1',
    name: 'Public User',
    email: 'public@findsafe.ai',
    role: 'PUBLIC_USER',
    agency: 'Community Reporting Desk',
  },
];

export const INITIAL_AGE_PROGRESSIONS: AgeProgressionRecord[] = [];

export const INITIAL_SYSTEM_ALERTS: SystemAlert[] = [];

export const DUPLICATE_CANDIDATE_CASE: MissingPerson | null = null;

export const INITIAL_DUPLICATE_FLAGS: DuplicateCaseFlag[] = [];

export const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [];
