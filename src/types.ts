export type AlertType = 'AMBER' | 'SILVER' | 'ENDANGERED' | 'CRITICAL_MEDICAL';

export interface MissingPerson {
  id: string;
  name: string;
  age: number;
  gender: 'Female' | 'Male' | 'Non-Binary' | 'Other';
  alertType: AlertType;
  missingSince: string; // ISO date string
  lastSeenLocation: {
    name: string;
    lat: number;
    lng: number;
    address: string;
  };
  photoUrl: string;
  clothingLastSeen: string;
  physicalDescription: {
    height: string;
    weight: string;
    hair: string;
    eyes: string;
    distinguishingMarks: string;
  };
  medicalConditions: string[];
  riskLevel: 'Extreme' | 'High' | 'Moderate';
  caseNumber: string;
  investigatingAgency: string;
  emergencyContact: string;
  summary: string;
  searchRadiusKm: number;
  status: 'Active' | 'Located Safe' | 'Investigating' | 'Archived';
  isVerified?: boolean;
  verifiedBy?: string;
  verifiedAt?: string;
  verificationNotes?: string;
  reportedByRole?: UserRole;
  reportedByName?: string;
  reportedByUserId?: string;
  reportedByUserEmail?: string;
  reporterContact?: string;
  reporterPhone?: string;
  reporterEmail?: string;
  reporterRelation?: string;
  publicTrackingCode?: string;
  publicStatusStage?: 'REPORTED' | 'VERIFIED' | 'SEARCH_IN_PROGRESS' | 'LOCATED_SAFE' | 'ARCHIVED';
  isPubliclyDispatched?: boolean;
  foundConfirmation?: FoundConfirmationRecord;
  foundAt?: string;
  foundLocation?: string;
  foundCondition?: SubjectCondition;
  foundReunionStatus?: ReunionStatus;
  foundNotes?: string;
  reporterNotified?: boolean;
  reporterNotificationDetails?: ReporterNotificationDelivery;
  // Audit, Assignment & Soft-Delete Persistence Fields
  created_at?: string;
  updated_at?: string;
  last_edited_by?: string;
  last_edited_role?: UserRole;
  is_deleted?: boolean;
  deleted_at?: string;
  deleted_by?: string;
  deleted_role?: UserRole;
  archiveReason?: string;
  assignedInvestigatorId?: string;
  assignedInvestigatorName?: string;
  assignedBadgeNumber?: string;
  hasUnreadCitizenUpdate?: boolean;
  recentChangesSummary?: string[];
  changeHistory?: CaseChangeRecord[];
}

export type SubjectCondition = 
  | 'Safe & Stable' 
  | 'Uninjured & Healthy' 
  | 'Minor Injuries / Treated' 
  | 'Hospitalized' 
  | 'Critical Care';

export type ReunionStatus = 
  | 'Reunited with Family' 
  | 'At Medical Facility' 
  | 'In Protective Custody' 
  | 'En Route to Family';

export interface ReporterNotificationDelivery {
  notificationId: string;
  recipientName: string;
  recipientPhone?: string;
  recipientEmail?: string;
  channelsAttempted: Array<'SMS' | 'EMAIL' | 'IN_APP_PUSH' | 'SYSTEM_ALERT'>;
  channelsSucceeded: Array<'SMS' | 'EMAIL' | 'IN_APP_PUSH' | 'SYSTEM_ALERT'>;
  smsStatus: 'DELIVERED' | 'SENT' | 'SIMULATED' | 'FAILED' | 'SKIPPED';
  smsMessage: string;
  smsProvider: 'TWILIO' | 'MSG91' | 'MOCK_GATEWAY' | 'CUSTOM';
  smsMessageId?: string;
  emailStatus: 'DELIVERED' | 'SENT' | 'SIMULATED' | 'FAILED' | 'SKIPPED';
  emailSubject?: string;
  emailMessage?: string;
  emailMessageId?: string;
  inAppStatus: 'DELIVERED' | 'FAILED' | 'SKIPPED';
  timestamp: string;
  errorDetails?: string;
}

export interface FoundConfirmationRecord {
  id: string;
  personId: string;
  caseNumber: string;
  confirmedBy: string;
  confirmedByRole: UserRole;
  confirmedAt: string;
  foundLocation: string;
  foundAddress?: string;
  subjectCondition: SubjectCondition;
  reunionStatus: ReunionStatus;
  foundNotes: string;
  reporterNotification: ReporterNotificationDelivery;
}

export interface SightingLead {
  id: string;
  personId?: string;
  personName?: string;
  timestamp: string;
  locationName: string;
  lat: number;
  lng: number;
  notes: string;
  photoUrl?: string;
  confidenceScore?: number;
  reporterRole?: UserRole;
  publicTrackingCode?: string;
  isFoundPersonReport?: boolean;
  matchAnalysis?: {
    overallConfidence: number;
    facialMatchAssessment: string;
    clothingMatchAssessment: string;
    demographicMatch: string;
    distinguishingFeaturesFound: string[];
    riskAssessment: string;
    suggestedAction: string;
  };
  status: 'Pending Review' | 'Verified Match' | 'Dismissed' | 'High Priority';
  reportedBy: string;
  contactNumber?: string;
  contactEmail?: string;
}

export interface AlertPackage {
  broadcastScript: string;
  socialMediaPost: string;
  smsNotification: string;
  volunteerBriefing: string;
  printableFlyerSummary: {
    headline: string;
    urgentCallToAction: string;
    vitalStats: string[];
    contactNumbers?: string[];
  };
}

// FEATURE 6 & MODULE 1: Role-Based Access Control (RBAC) & User Types
export type UserRole = 'CITIZEN' | 'PUBLIC_USER' | 'INVESTIGATOR' | 'ADMIN';
export type AccountStatus = 'active' | 'inactive' | 'suspended';

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status?: AccountStatus;
  badgeNumber?: string;
  agency?: string;
  organization?: string;
  phone?: string;
  created_at?: string;
  updated_at?: string;
  last_login?: string | null;
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: AccountStatus;
  badgeNumber?: string;
  agency?: string;
  organization?: string;
  phone?: string;
  created_at: string;
  updated_at: string;
  last_login: string | null;
}

export interface AuthSession {
  token: string;
  user: UserAccount;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  action: string;
  resourceType: string;
  resourceId?: string;
  caseId?: string;
  case_id?: string;
  userId?: string;
  user_id?: string;
  userRole?: UserRole;
  user_role?: UserRole;
  fieldChanged?: string;
  field_changed?: string;
  oldValue?: string;
  old_value?: string;
  newValue?: string;
  new_value?: string;
  outcome: 'SUCCESS' | 'FORBIDDEN' | 'FAILED';
  details: string;
  ipAddress?: string;
}

export interface CaseChangeRecord {
  id: string;
  caseId: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action:
    | 'CASE_CREATED'
    | 'CASE_UPDATED'
    | 'CASE_ARCHIVED'
    | 'CASE_RESTORED'
    | 'STATUS_CHANGED'
    | 'CASE_VERIFIED'
    | 'PERSON_FOUND'
    | 'INVESTIGATOR_ASSIGNED'
    | 'NOTIFICATION_SENT';
  fieldChanged?: string;
  oldValue?: string;
  newValue?: string;
  timestamp: string;
  summary: string;
}

// FEATURE 1: AI Age Progression
export interface MorphologicalAnalysis {
  facialBoneChanges: string;
  skinTextureChanges: string;
  hairChanges: string;
  hereditaryFactors: string;
  confidenceScore: number;
}

export interface AgeProgressionRecord {
  id: string;
  personId: string;
  personName?: string;
  currentAge: number;
  targetAge: number;
  yearsProgressed: number;
  originalPhotoUrl: string;
  progressedPhotoUrl: string;
  agedPhotoUrl?: string;
  promptNotes?: string;
  morphologicalAnalysis: MorphologicalAnalysis;
  createdAt: string;
  createdBy: string;
}

// Real-Time Alerts & Notification Hub
export type SystemAlertType = 
  | 'AMBER_ALERT' 
  | 'SILVER_ALERT' 
  | 'HIGH_CONFIDENCE_SIGHTING' 
  | 'CASE_UPDATE'
  | 'PERSON_FOUND_RESOLVED'
  | 'REPORTER_FOUND_NOTIFICATION';

export interface SystemAlert {
  id: string;
  type: SystemAlertType;
  severity: 'CRITICAL' | 'HIGH' | 'INFO';
  title: string;
  message: string;
  personId?: string;
  personName?: string;
  locationName?: string;
  timestamp: string;
  isRead: boolean;
  broadcastChannels?: string[];
  targetAudience?: 'PUBLIC' | 'FIRST_RESPONDERS' | 'INVESTIGATORS';
}

// FEATURE 5: Duplicate Case Detection
export interface DuplicateCaseFlag {
  id: string;
  primaryCaseId: string;
  candidateCaseId: string;
  primaryCase: MissingPerson;
  candidateCase: MissingPerson;
  similarityScore: number;
  matchReasons: string[];
  discrepancies: {
    field: string;
    primaryValue: string;
    candidateValue: string;
  }[];
  status: 'PENDING_REVIEW' | 'CONFIRMED_DUPLICATE' | 'RESOLVED_MERGED' | 'DISMISSED_DISTINCT';
  flaggedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

