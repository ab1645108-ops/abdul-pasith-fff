import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, ShieldAlert, PlusCircle, Camera, Search, MapPin, 
  Clock, CheckCircle2, AlertTriangle, FileText, ArrowRight, 
  ExternalLink, Printer, Lock, Info, HeartHandshake, Eye, Sparkles, UserCheck,
  Eraser, X, User, Scan, Edit3, Trash2, FolderLock, Smartphone
} from 'lucide-react';
import { MissingPerson, SightingLead, CurrentUser, AlertType } from '../types';
import { SightingScanner } from './SightingScanner';
import { EditCaseModal } from './EditCaseModal';
import { DeleteConfirmModal } from './DeleteConfirmModal';

interface PublicPortalProps {
  missingPersons: MissingPerson[];
  sightings?: SightingLead[];
  onOpenReportModal: () => void;
  onOpenSightingModal: (preselectedPersonId?: string) => void;
  onOpenPrintFlyer: (person: MissingPerson) => void;
  currentUser: CurrentUser;
  onSwitchToOfficial: () => void;
  onLeadVerified?: (lead: SightingLead) => void;
  activeTab?: 'scanner' | 'cases' | 'alerts' | 'duplicates' | 'assistant' | 'users';
  onTabChange?: (tab: 'scanner' | 'cases' | 'alerts' | 'duplicates' | 'assistant' | 'users') => void;
  preselectedPersonId?: string;
  onUpdatePerson?: (updatedPerson: MissingPerson) => void;
  onDeletePerson?: (personId: string) => void;
}

export const PublicPortal: React.FC<PublicPortalProps> = ({
  missingPersons,
  sightings = [],
  onOpenReportModal,
  onOpenSightingModal,
  onOpenPrintFlyer,
  currentUser,
  onSwitchToOfficial,
  onLeadVerified,
  activeTab,
  onTabChange,
  preselectedPersonId,
  onUpdatePerson,
  onDeletePerson,
}) => {
  const [activeSection, setActiveSection] = useState<'overview' | 'myreports' | 'track' | 'bulletins' | 'aimatch'>(
    activeTab === 'scanner' ? 'aimatch' : 'overview'
  );
  const [publicScannerPersonId, setPublicScannerPersonId] = useState<string | undefined>(preselectedPersonId);
  const [searchOption, setSearchOption] = useState<'NAME' | 'CODE' | 'REPORTER' | 'ALL'>('NAME');
  const [searchTrackingCode, setSearchTrackingCode] = useState('');
  const [trackedCase, setTrackedCase] = useState<MissingPerson | null>(null);
  const [matchedCases, setMatchedCases] = useState<MissingPerson[]>([]);
  const [trackError, setTrackError] = useState<string | null>(null);

  // Edit & Delete state
  const [editingPerson, setEditingPerson] = useState<MissingPerson | null>(null);
  const [deletingPerson, setDeletingPerson] = useState<MissingPerson | null>(null);
  const [bulletinFilter, setBulletinFilter] = useState<'ALL' | 'MY_REPORTS'>('ALL');

  // Determine if a case was reported by this user / citizen session
  const isUserReport = (p: MissingPerson): boolean => {
    if (p.reportedByUserId && currentUser?.id && p.reportedByUserId === currentUser.id) return true;
    if (p.reportedByUserEmail && currentUser?.email && p.reportedByUserEmail.toLowerCase() === currentUser.email.toLowerCase()) return true;
    if (p.reportedByName && currentUser?.name && p.reportedByName.toLowerCase() === currentUser.name.toLowerCase()) return true;
    if ((currentUser?.role === 'CITIZEN' || currentUser?.role === 'PUBLIC_USER') &&
        (p.reportedByRole === 'CITIZEN' || p.reportedByRole === 'PUBLIC_USER')) {
      return true;
    }
    return false;
  };

  const myReportedCases = missingPersons.filter(isUserReport);

  const handleSaveEdit = (updated: MissingPerson) => {
    if (onUpdatePerson) {
      onUpdatePerson(updated);
    }
    if (trackedCase && trackedCase.id === updated.id) {
      setTrackedCase(updated);
    }
    setEditingPerson(null);
  };

  const handleConfirmDelete = (personId: string) => {
    if (onDeletePerson) {
      onDeletePerson(personId);
    }
    if (trackedCase && trackedCase.id === personId) {
      setTrackedCase(null);
    }
    setDeletingPerson(null);
  };

  useEffect(() => {
    if (activeTab === 'scanner') {
      setActiveSection('aimatch');
    }
  }, [activeTab]);

  useEffect(() => {
    if (preselectedPersonId) {
      setPublicScannerPersonId(preselectedPersonId);
    }
  }, [preselectedPersonId]);

  // Active public broadcast bulletins (cleared for public viewing only - basic flyer stats)
  const publicBulletins = missingPersons.filter(p => p.status === 'Active');

  const handleClearTrack = () => {
    setSearchTrackingCode('');
    setTrackedCase(null);
    setMatchedCases([]);
    setTrackError(null);
  };

  const handleTrackSubmit = (
    e?: React.FormEvent,
    overrideQuery?: string,
    overrideOption?: 'NAME' | 'CODE' | 'REPORTER' | 'ALL'
  ) => {
    if (e) e.preventDefault();
    setTrackError(null);

    const query = (overrideQuery !== undefined ? overrideQuery : searchTrackingCode).trim();
    const opt = overrideOption || searchOption;

    if (!query) {
      setTrackError(
        opt === 'NAME'
          ? 'Please enter a missing person name to search.'
          : opt === 'CODE'
          ? 'Please enter a tracking code or case reference number.'
          : opt === 'REPORTER'
          ? 'Please enter a reporter or submitter name.'
          : 'Please enter a search keyword.'
      );
      setTrackedCase(null);
      setMatchedCases([]);
      return;
    }

    const qLower = query.toLowerCase();
    const qUpper = query.toUpperCase();

    let matches: MissingPerson[] = [];

    if (opt === 'NAME') {
      matches = missingPersons.filter(p =>
        p.name.toLowerCase().includes(qLower)
      );
    } else if (opt === 'CODE') {
      matches = missingPersons.filter(p =>
        (p.publicTrackingCode && p.publicTrackingCode.toUpperCase().includes(qUpper)) ||
        p.caseNumber.toUpperCase().includes(qUpper) ||
        p.id.toUpperCase().includes(qUpper)
      );
    } else if (opt === 'REPORTER') {
      matches = missingPersons.filter(p =>
        (p.reportedByName && p.reportedByName.toLowerCase().includes(qLower)) ||
        (p.reporterContact && p.reporterContact.toLowerCase().includes(qLower)) ||
        (p.reporterPhone && p.reporterPhone.toLowerCase().includes(qLower)) ||
        (p.reporterEmail && p.reporterEmail.toLowerCase().includes(qLower)) ||
        (p.verifiedBy && p.verifiedBy.toLowerCase().includes(qLower))
      );
    } else {
      // ALL
      matches = missingPersons.filter(p =>
        p.name.toLowerCase().includes(qLower) ||
        (p.publicTrackingCode && p.publicTrackingCode.toUpperCase().includes(qUpper)) ||
        p.caseNumber.toUpperCase().includes(qUpper) ||
        p.id.toUpperCase().includes(qUpper) ||
        p.lastSeenLocation.name.toLowerCase().includes(qLower) ||
        p.lastSeenLocation.address.toLowerCase().includes(qLower) ||
        (p.clothingLastSeen && p.clothingLastSeen.toLowerCase().includes(qLower)) ||
        (p.reportedByName && p.reportedByName.toLowerCase().includes(qLower)) ||
        (p.reporterPhone && p.reporterPhone.toLowerCase().includes(qLower)) ||
        (p.reporterEmail && p.reporterEmail.toLowerCase().includes(qLower)) ||
        (p.summary && p.summary.toLowerCase().includes(qLower))
      );
    }

    if (matches.length === 0) {
      setTrackedCase(null);
      setMatchedCases([]);
      const label =
        opt === 'NAME'
          ? 'person name'
          : opt === 'CODE'
          ? 'tracking code or case #'
          : opt === 'REPORTER'
          ? 'reporter / submitter'
          : 'case details query';
      setTrackError(`No case record found matching ${label} "${query}". Check spelling or select "All Case & Report Details".`);
    } else if (matches.length === 1) {
      setTrackedCase(matches[0]);
      setMatchedCases(matches);
      setTrackError(null);
    } else {
      setMatchedCases(matches);
      setTrackedCase(matches[0]);
      setTrackError(null);
    }
  };

  const handleQuickNameSearch = (name: string) => {
    setSearchOption('NAME');
    setSearchTrackingCode(name);
    handleTrackSubmit(undefined, name, 'NAME');
  };

  const getAlertBadge = (type: AlertType) => {
    switch (type) {
      case 'AMBER':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase tracking-wider">
            AMBER ALERT • CHILD
          </span>
        );
      case 'SILVER':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40 uppercase tracking-wider">
            SILVER ALERT • SENIOR
          </span>
        );
      case 'CRITICAL_MEDICAL':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 uppercase tracking-wider">
            CRITICAL MEDICAL ALERT
          </span>
        );
      case 'ENDANGERED':
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 uppercase tracking-wider">
            ENDANGERED MISSING
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Civilian Privacy Notice Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-700/80 p-4 sm:p-5 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0 mt-0.5">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-300 font-mono">
                PUBLIC CITIZEN ACCESS PORTAL
              </span>
              <span className="text-[10px] px-2 py-0.2 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                DATA PRIVACY ACTIVE
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Confidential law enforcement dossiers, internal witness leads, and SAR telemetry are restricted to verified Investigators & Dispatch Administrators. Public citizens can submit missing reports, provide sighting tips, and track their own registered cases.
            </p>
          </div>
        </div>

        <button
          onClick={onSwitchToOfficial}
          className="shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-600 text-xs font-semibold hover:border-slate-500 transition shadow-sm"
        >
          <UserCheck className="w-4 h-4 text-emerald-400" />
          <span>Switch to Investigator / Admin</span>
        </button>
      </div>

      {/* Hero Welcome & Emergency Action Cards */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-rose-950/40 border border-slate-800 p-6 sm:p-10 shadow-2xl">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            <span>24/7 Community Search & Rescue Network</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
            FindSafe Public Safety <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-amber-300 to-rose-300">
              Community Reporting Hub
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
            If someone you know is missing, or you have seen a person matching a public alert, report immediately. Every second matters. All submissions are triaged by sworn law enforcement and dispatch SAR units.
          </p>
        </div>

        {/* Big Action Buttons */}
        <div className="relative z-10 mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Report Missing */}
          <div 
            onClick={onOpenReportModal}
            className="group cursor-pointer rounded-2xl bg-gradient-to-b from-rose-900/60 to-rose-950/90 border border-rose-700/60 hover:border-rose-500 p-5 transition-all duration-200 hover:shadow-xl hover:shadow-rose-950/50 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                <PlusCircle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white group-hover:text-rose-200 transition">
                Report a Missing Person
              </h3>
              <p className="text-xs text-rose-200/80 leading-relaxed">
                Submit an urgent missing report for a family member, child, or endangered person. Generates a private reference code.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-rose-800/60 flex items-center justify-between text-xs font-bold text-rose-300 group-hover:text-white">
              <span>Start Emergency Report</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 2: AI Match Operation */}
          <div 
            onClick={() => {
              setActiveSection('aimatch');
              onTabChange?.('scanner');
            }}
            className="group cursor-pointer rounded-2xl bg-gradient-to-b from-purple-950/50 via-slate-900 to-rose-950/40 border border-purple-700/60 hover:border-purple-400 p-5 transition-all duration-200 hover:shadow-xl hover:shadow-purple-950/40 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-rose-600 text-white flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                <Sparkles className="w-6 h-6 text-amber-200" />
              </div>
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40">
                    AI VISION MATCH
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white group-hover:text-purple-200 transition">
                  AI Match Operation
                </h3>
              </div>
              <p className="text-xs text-purple-200/80 leading-relaxed">
                Spotted someone? Use camera or photo upload to cross-reference against active missing bulletins with biometric AI.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-purple-800/50 flex items-center justify-between text-xs font-bold text-purple-300 group-hover:text-white">
              <span>Launch AI Matcher</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 3: Submit Sighting / Found Person */}
          <div 
            onClick={() => onOpenSightingModal()}
            className="group cursor-pointer rounded-2xl bg-gradient-to-b from-amber-950/40 to-slate-900 border border-amber-700/50 hover:border-amber-500 p-5 transition-all duration-200 hover:shadow-xl hover:shadow-amber-950/30 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                <Camera className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white group-hover:text-amber-200 transition">
                Report Sighting / Found Person
              </h3>
              <p className="text-xs text-amber-200/80 leading-relaxed">
                Spotted someone or located a lost child/elderly person? Submit photos, location coordinates, and eyewitness notes directly to SAR investigators.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-amber-800/40 flex items-center justify-between text-xs font-bold text-amber-300 group-hover:text-white">
              <span>Submit Eyewitness Tip</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 4: Our / My Reported Cases & Tracking */}
          <div 
            onClick={() => setActiveSection('myreports')}
            className="group cursor-pointer rounded-2xl bg-gradient-to-b from-blue-950/40 to-slate-900 border border-blue-700/50 hover:border-blue-500 p-5 transition-all duration-200 hover:shadow-xl hover:shadow-blue-950/30 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                  <FolderLock className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40 font-bold">
                  {myReportedCases.length} REPORTED
                </span>
              </div>
              <h3 className="text-lg font-bold text-white group-hover:text-blue-200 transition">
                Our Reported Cases & Edits
              </h3>
              <p className="text-xs text-blue-200/80 leading-relaxed">
                View only your submitted cases. Edit details, change clothing/photos, or delete reports with immediate sync to investigators.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-blue-800/40 flex items-center justify-between text-xs font-bold text-blue-300 group-hover:text-white">
              <span>Manage My Submissions</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>

        {/* Ambient background glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Navigation Sub-Tabs for Public Page */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 flex-wrap">
        <button
          onClick={() => {
            setActiveSection('overview');
            onTabChange?.('cases');
          }}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition ${
            activeSection === 'overview'
              ? 'bg-rose-600 text-white shadow-md shadow-rose-900/40'
              : 'text-slate-400 hover:text-white hover:bg-slate-850'
          }`}
        >
          Public Safety Bulletins ({publicBulletins.length})
        </button>

        <button
          onClick={() => {
            setActiveSection('myreports');
            onTabChange?.('cases');
          }}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition flex items-center gap-1.5 ${
            activeSection === 'myreports'
              ? 'bg-rose-600 text-white shadow-md shadow-rose-900/40 ring-1 ring-rose-400/50'
              : 'text-slate-400 hover:text-white hover:bg-slate-850'
          }`}
        >
          <FolderLock className="w-4 h-4 text-amber-300" />
          <span>Our Reported Cases</span>
          <span className="px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-slate-800 text-slate-200 border border-slate-700">
            {myReportedCases.length}
          </span>
        </button>

        <button
          onClick={() => {
            setActiveSection('aimatch');
            onTabChange?.('scanner');
          }}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition flex items-center gap-1.5 ${
            activeSection === 'aimatch'
              ? 'bg-rose-600 text-white shadow-md shadow-rose-900/40 ring-1 ring-rose-400/50'
              : 'text-slate-400 hover:text-white hover:bg-slate-850'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>AI Match Operation</span>
          <span className="px-1.5 py-0.2 text-[9px] font-bold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
            MULTIMODAL
          </span>
        </button>

        <button
          onClick={() => {
            setActiveSection('track');
            onTabChange?.('cases');
          }}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition flex items-center gap-1.5 ${
            activeSection === 'track'
              ? 'bg-rose-600 text-white shadow-md shadow-rose-900/40'
              : 'text-slate-400 hover:text-white hover:bg-slate-850'
          }`}
        >
          <Search className="w-4 h-4" />
          <span>Track My Case / Report</span>
        </button>
      </div>

      {/* SECTION 1: PUBLIC AWARENESS BULLETINS & FLYERS */}
      {activeSection === 'overview' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <span>Active Public Awareness Bulletins</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                  {publicBulletins.length} Active
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Official community notices released for urgent public assistance. Sensitive medical dossiers and private witness leads remain confidential.
              </p>
            </div>
          </div>

          {publicBulletins.length === 0 ? (
            <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl shadow-sm">
              <ShieldCheck className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-white">No Active Missing Person Bulletins</h3>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-md mx-auto">
                There are currently no active public missing persons bulletins in the system.
              </p>
              <button
                onClick={() => onOpenReportModal()}
                className="mt-5 px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-2 transition shadow-lg shadow-rose-950/50"
              >
                <User className="w-4 h-4" />
                <span>Report a Missing Person</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {publicBulletins.map((person) => (
              <div
                key={person.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-md flex flex-col justify-between hover:border-slate-700 transition"
              >
                <div>
                  {/* Photo & Badges */}
                  <div className="relative aspect-[16/10] bg-slate-950 overflow-hidden">
                    <img
                      src={person.photoUrl}
                      alt={person.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-black/40" />

                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                      {getAlertBadge(person.alertType)}
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/70 text-slate-300 border border-slate-700">
                        REF #{person.caseNumber}
                      </span>
                    </div>

                    <div className="absolute bottom-3 left-3 right-3">
                      <h3 className="text-lg font-bold text-white leading-tight drop-shadow">
                        {person.name}, {person.age}
                      </h3>
                      <p className="text-xs text-slate-300 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-rose-400 shrink-0" />
                        <span className="truncate">{person.lastSeenLocation.name}</span>
                      </p>
                    </div>
                  </div>

                  {/* Public Bulletin Information */}
                  <div className="p-4 space-y-3 text-xs">
                    <div>
                      <span className="text-[11px] font-medium text-slate-400 block mb-0.5">
                        Apparel / Last Seen Wearing:
                      </span>
                      <p className="text-slate-200 line-clamp-2 leading-relaxed">
                        {person.clothingLastSeen}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                      <div>
                        Height/Weight: <span className="text-slate-200">{person.physicalDescription.height}, {person.physicalDescription.weight}</span>
                      </div>
                      <div>
                        Hair: <span className="text-slate-200">{person.physicalDescription.hair}</span>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-300">
                      <span className="font-semibold text-amber-400 block text-[10px] uppercase tracking-wide">
                        Investigating Agency:
                      </span>
                      <span className="font-medium text-white">{person.investigatingAgency}</span>
                    </div>
                  </div>
                </div>

                {/* Public Actions */}
                <div className="p-4 pt-0 border-t border-slate-800/80 mt-2 flex items-center gap-2">
                  <button
                    onClick={() => {
                      setPublicScannerPersonId(person.id);
                      setActiveSection('aimatch');
                      onTabChange?.('scanner');
                    }}
                    className="flex-1 py-2 px-2 rounded-xl bg-rose-600/25 hover:bg-rose-600 text-rose-200 hover:text-white border border-rose-500/40 text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-sm"
                    title="Run AI Photo Match against this person"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>AI Match</span>
                  </button>

                  <button
                    onClick={() => onOpenSightingModal(person.id)}
                    className="flex-1 py-2 px-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Tip</span>
                  </button>

                  <button
                    onClick={() => onOpenPrintFlyer(person)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition"
                    title="Download / Print Public Missing Poster"
                  >
                    <Printer className="w-4 h-4 text-slate-300" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          )}
        </div>
      )}

      {/* SECTION: OUR REPORTED CASES */}
      {activeSection === 'myreports' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <FolderLock className="w-5 h-5 text-amber-400" />
                <span>Our Registered Case Reports</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                  {myReportedCases.length} Dossier{myReportedCases.length === 1 ? '' : 's'}
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Cases submitted by your account or public reporting session. Your registered contact mobile numbers are stored for urgent rescue dispatch.
              </p>
            </div>
            <button
              onClick={() => onOpenReportModal()}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-2 transition shadow-md shadow-rose-950/40"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Report Another Person</span>
            </button>
          </div>

          {myReportedCases.length === 0 ? (
            <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl shadow-sm">
              <User className="w-12 h-12 text-slate-500 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-white">No Cases Reported Yet</h3>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-md mx-auto">
                You haven't submitted any missing person reports in this session yet. When you submit a report with your contact mobile number, it will appear here.
              </p>
              <button
                onClick={() => onOpenReportModal()}
                className="mt-5 px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-2 transition shadow-lg shadow-rose-950/50"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Submit Missing Person Report</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {myReportedCases.map((person) => (
                <div
                  key={person.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-md flex flex-col justify-between hover:border-slate-700 transition"
                >
                  <div>
                    <div className="relative aspect-[16/10] bg-slate-950 overflow-hidden">
                      <img
                        src={person.photoUrl}
                        alt={person.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-black/40" />

                      <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                        {getAlertBadge(person.alertType)}
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/70 text-slate-300 border border-slate-700">
                          {person.publicTrackingCode || person.caseNumber}
                        </span>
                      </div>

                      <div className="absolute bottom-3 left-3 right-3">
                        <h3 className="text-lg font-bold text-white leading-tight drop-shadow">
                          {person.name}, {person.age}
                        </h3>
                        <p className="text-xs text-slate-300 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-rose-400 shrink-0" />
                          <span className="truncate">{person.lastSeenLocation.name}</span>
                        </p>
                      </div>
                    </div>

                    <div className="p-4 space-y-2.5 text-xs">
                      {/* Reporter Contact Info Card */}
                      <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                        <span className="text-[10px] uppercase font-mono text-slate-400 block font-semibold">
                          Registered Reporter Details:
                        </span>
                        <div className="flex flex-col gap-0.5 text-slate-300">
                          <div className="flex items-center gap-1.5">
                            <UserCheck className="w-3 h-3 text-rose-400 shrink-0" />
                            <span>{person.reportedByName || 'Citizen Reporter'}</span>
                            {person.reporterRelation && (
                              <span className="text-[10px] text-slate-400">({person.reporterRelation})</span>
                            )}
                          </div>
                          {person.reporterPhone && (
                            <div className="flex items-center gap-1.5 font-mono text-rose-300">
                              <span className="text-[10px]">📱 Mobile:</span>
                              <span className="font-semibold">{person.reporterPhone}</span>
                            </div>
                          )}
                          {person.reporterEmail ? (
                            <div className="flex items-center gap-1.5 font-mono text-slate-400 text-[11px]">
                              <span>✉️ Email:</span>
                              <span>{person.reporterEmail}</span>
                            </div>
                          ) : (
                            <div className="text-[10px] text-slate-500 italic">
                              ✉️ Email: Not provided (Optional)
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">Status:</span>
                        <span className={`px-2 py-0.5 rounded font-bold ${
                          person.status === 'Located Safe'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : 'bg-rose-950 text-rose-300 border border-rose-800'
                        }`}>
                          {person.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 pt-0 border-t border-slate-800/80 mt-2 flex items-center gap-2">
                    <button
                      onClick={() => {
                        setTrackedCase(person);
                        setActiveSection('track');
                      }}
                      className="flex-1 py-2 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                    >
                      <Search className="w-3.5 h-3.5 text-blue-400" />
                      <span>Track Details</span>
                    </button>

                    {onUpdatePerson && (
                      <button
                        onClick={() => setEditingPerson(person)}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs transition"
                        title="Edit Case"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-slate-300" />
                      </button>
                    )}

                    <button
                      onClick={() => onOpenPrintFlyer(person)}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition"
                      title="Print Poster"
                    >
                      <Printer className="w-3.5 h-3.5 text-slate-300" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SECTION 2: TRACK MY SUBMISSION */}
      {activeSection === 'track' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Search className="w-5 h-5 text-rose-400" />
              <span>Track Registered Case or Sighting Report</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Look up case details name-wise by person's name, or search using your official tracking code, case number, or submitter details. Choose your preferred search option below:
            </p>

            {/* Choose Search Option Buttons */}
            <div className="mt-4 pt-3 border-t border-slate-800">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider font-mono">
                  Select Search Option:
                </span>
                <span className="text-[11px] text-rose-400 font-medium">
                  {searchOption === 'NAME' && 'Active: Name-Wise Search'}
                  {searchOption === 'CODE' && 'Active: Tracking Code / Case #'}
                  {searchOption === 'REPORTER' && 'Active: Reporter / Submitter'}
                  {searchOption === 'ALL' && 'Active: All Case & Report Details'}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSearchOption('NAME');
                    if (searchTrackingCode.trim()) handleTrackSubmit(undefined, searchTrackingCode, 'NAME');
                  }}
                  className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition ${
                    searchOption === 'NAME'
                      ? 'bg-rose-600/25 border-rose-500 text-rose-200 shadow-md ring-1 ring-rose-500/40'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                  }`}
                >
                  <User className="w-3.5 h-3.5 text-rose-400" />
                  <span>Person Name (Name-Wise)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSearchOption('CODE');
                    if (searchTrackingCode.trim()) handleTrackSubmit(undefined, searchTrackingCode, 'CODE');
                  }}
                  className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition ${
                    searchOption === 'CODE'
                      ? 'bg-rose-600/25 border-rose-500 text-rose-200 shadow-md ring-1 ring-rose-500/40'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                  }`}
                >
                  <Search className="w-3.5 h-3.5 text-blue-400" />
                  <span>Tracking Code / Case #</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSearchOption('REPORTER');
                    if (searchTrackingCode.trim()) handleTrackSubmit(undefined, searchTrackingCode, 'REPORTER');
                  }}
                  className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition ${
                    searchOption === 'REPORTER'
                      ? 'bg-rose-600/25 border-rose-500 text-rose-200 shadow-md ring-1 ring-rose-500/40'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5 text-amber-400" />
                  <span>Reporter / Submitter</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSearchOption('ALL');
                    if (searchTrackingCode.trim()) handleTrackSubmit(undefined, searchTrackingCode, 'ALL');
                  }}
                  className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition ${
                    searchOption === 'ALL'
                      ? 'bg-rose-600/25 border-rose-500 text-rose-200 shadow-md ring-1 ring-rose-500/40'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5 text-emerald-400" />
                  <span>All Case & Report Details</span>
                </button>
              </div>
            </div>

            {/* Quick Name-Wise Search Pills */}
            <div className="mt-3.5 flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-slate-400 text-[11px] font-medium mr-1">Quick Name Suggestions:</span>
              {missingPersons.slice(0, 5).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleQuickNameSearch(p.name)}
                  className={`px-2.5 py-1 rounded-lg text-xs transition border flex items-center gap-1 ${
                    trackedCase?.id === p.id && searchOption === 'NAME'
                      ? 'bg-rose-950/80 border-rose-600 text-rose-200 font-semibold'
                      : 'bg-slate-950 hover:bg-slate-800 border-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  <User className="w-3 h-3 text-slate-400" />
                  <span>{p.name}</span>
                </button>
              ))}
            </div>

            <form onSubmit={handleTrackSubmit} className="mt-4 flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={searchTrackingCode}
                  onChange={(e) => setSearchTrackingCode(e.target.value)}
                  placeholder={
                    searchOption === 'NAME'
                      ? "Search name-wise: e.g. First and last name..."
                      : searchOption === 'CODE'
                      ? "Enter tracking code or case #: e.g. MP-PUB-XXXXX or case ID..."
                      : searchOption === 'REPORTER'
                      ? "Enter reporter or submitter name..."
                      : "Search by any detail: name, location, case number, or clothing..."
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-10 py-2.5 text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-rose-500"
                />
                {searchTrackingCode && (
                  <button
                    type="button"
                    onClick={handleClearTrack}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
                    title="Clear search text"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                {searchTrackingCode && (
                  <button
                    type="button"
                    onClick={handleClearTrack}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 text-xs sm:text-sm font-semibold transition flex items-center justify-center gap-1.5"
                    title="Wipe search and clear results"
                  >
                    <Eraser className="w-4 h-4 text-rose-400" />
                    <span>Clear Slate</span>
                  </button>
                )}
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs sm:text-sm transition flex items-center justify-center gap-2 shrink-0 shadow-md shadow-rose-950/40"
                >
                  <Search className="w-4 h-4" />
                  <span>
                    {searchOption === 'NAME' ? 'Search by Name' : 'Look Up Status'}
                  </span>
                </button>
              </div>
            </form>

            {trackError && (
              <div className="mt-4 p-3 rounded-xl bg-rose-950/40 border border-rose-800 text-xs text-rose-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{trackError}</span>
              </div>
            )}

            {/* Multiple Matching Cases Option List */}
            {matchedCases.length > 1 && (
              <div className="mt-4 p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-200">
                    Found <strong className="text-rose-400">{matchedCases.length}</strong> cases matching your search:
                  </span>
                  <span className="text-slate-400 text-[11px]">Click a case to inspect full details</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {matchedCases.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setTrackedCase(c)}
                      className={`p-3 rounded-xl border text-left flex items-center gap-3 transition ${
                        trackedCase?.id === c.id
                          ? 'bg-rose-950/50 border-rose-500 text-white shadow-md ring-1 ring-rose-500/50'
                          : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-950 border border-slate-800 shrink-0">
                        <img src={c.photoUrl} alt={c.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-xs text-white truncate flex items-center gap-1.5">
                          <span>{c.name}</span>
                          <span className="text-[10px] text-slate-400 font-normal">({c.age} y/o)</span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono truncate">
                          {c.publicTrackingCode || c.caseNumber}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">{c.lastSeenLocation.name}</div>
                      </div>
                      {trackedCase?.id === c.id ? (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/30 text-rose-300 font-bold shrink-0">
                          Viewing
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-500 hover:text-white shrink-0">
                          Select →
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Tracked Case Details Card */}
          {trackedCase && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 shrink-0">
                    <img
                      src={trackedCase.photoUrl}
                      alt={trackedCase.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        TRACKING: {trackedCase.publicTrackingCode || trackedCase.caseNumber}
                      </span>
                      {getAlertBadge(trackedCase.alertType)}
                    </div>
                    <h3 className="text-xl font-bold text-white mt-1">
                      {trackedCase.name}, {trackedCase.age}
                    </h3>
                    <p className="text-xs text-slate-400 flex flex-wrap items-center gap-1.5 mt-0.5">
                      <span>Reported by: <span className="text-slate-200">{trackedCase.reportedByName || 'Citizen Submitter'}</span></span>
                      {trackedCase.reporterPhone && (
                        <span className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 font-mono text-[10px]">
                          📱 {trackedCase.reporterPhone}
                        </span>
                      )}
                      {trackedCase.reporterEmail && (
                        <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">
                          ✉️ {trackedCase.reporterEmail}
                        </span>
                      )}
                      <span>• {new Date(trackedCase.missingSince).toLocaleDateString()}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1.5 rounded-xl font-bold text-xs border ${
                    trackedCase.status === 'Located Safe'
                      ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700'
                      : 'bg-amber-950/80 text-amber-300 border-amber-700'
                  }`}>
                    {trackedCase.status === 'Located Safe' ? '✓ LOCATED SAFE & RESOLVED' : '• ACTIVE SAR OPERATION'}
                  </span>
                </div>
              </div>

              {/* Official Safe Resolution & Automated Reporter Notification Banner */}
              {trackedCase.status === 'Located Safe' && (
                <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/50 space-y-3 shadow-lg">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-emerald-300 font-bold text-sm">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      <span>Case Resolution Notice: Person Confirmed Located Safe</span>
                    </span>
                    <span className="px-2.5 py-0.5 rounded bg-emerald-900/60 text-emerald-200 border border-emerald-700 text-[10px] font-mono font-bold">
                      OFFICIAL SAR RESOLUTION
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                    <div className="p-2.5 rounded-lg bg-slate-950/80 border border-emerald-900/60">
                      <span className="text-[10px] text-slate-400 font-mono block">SAFE HARBOR LOCATION</span>
                      <span className="text-white font-semibold">
                        {trackedCase.foundLocation || trackedCase.foundConfirmation?.foundLocation || 'Safe Harbor Facility'}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-950/80 border border-emerald-900/60">
                      <span className="text-[10px] text-slate-400 font-mono block">SUBJECT CONDITION</span>
                      <span className="text-emerald-300 font-semibold">
                        {trackedCase.foundCondition || trackedCase.foundConfirmation?.subjectCondition || 'Safe & Stable'}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-950/80 border border-emerald-900/60">
                      <span className="text-[10px] text-slate-400 font-mono block">FAMILY REUNION STATUS</span>
                      <span className="text-white font-semibold">
                        {trackedCase.foundReunionStatus || trackedCase.foundConfirmation?.reunionStatus || 'Reunited with Family'}
                      </span>
                    </div>
                  </div>

                  {/* Reporter Notification Confirmation */}
                  <div className="p-3 rounded-lg bg-slate-950/90 border border-emerald-900/60 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-emerald-300">
                      <Smartphone className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>
                        Automated confirmation dispatch sent to original reporter <strong>{trackedCase.reportedByName || 'Citizen Reporter'}</strong>
                        {trackedCase.reporterPhone && ` (SMS: ${trackedCase.reporterPhone})`}.
                      </span>
                    </div>
                    {trackedCase.reporterNotificationDetails?.notificationId && (
                      <span className="font-mono text-[10px] text-emerald-400 shrink-0 bg-slate-900 px-2 py-0.5 rounded border border-emerald-800/40">
                        Dispatch Ref: #{trackedCase.reporterNotificationDetails.notificationId}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Status Progress Stepper */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                  Official Verification & Deployment Lifecycle
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  {/* Step 1 */}
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-emerald-800/60 flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs font-bold text-white block">1. Report Logged</span>
                      <p className="text-[11px] text-slate-400 mt-0.5">Submission received by regional intake.</p>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className={`p-3.5 rounded-xl bg-slate-950 border flex items-start gap-2.5 ${
                    trackedCase.isVerified ? 'border-emerald-800/60' : 'border-amber-800/60'
                  }`}>
                    {trackedCase.isVerified ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <span className="text-xs font-bold text-white block">2. Detective Verified</span>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {trackedCase.isVerified ? `Verified by ${trackedCase.verifiedBy || 'Investigator'}` : 'Under detective triage review'}
                      </p>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className={`p-3.5 rounded-xl bg-slate-950 border flex items-start gap-2.5 ${
                    trackedCase.status === 'Active' ? 'border-rose-800/60 bg-rose-950/20' : 'border-slate-800'
                  }`}>
                    <span className="w-4 h-4 rounded-full bg-rose-500/20 border border-rose-500/50 flex items-center justify-center text-[10px] font-bold text-rose-300 shrink-0 mt-0.5">
                      3
                    </span>
                    <div>
                      <span className="text-xs font-bold text-white block">3. SAR Field Teams</span>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Active geofence & community search deployed.
                      </p>
                    </div>
                  </div>

                  {/* Step 4 */}
                  <div className={`p-3.5 rounded-xl bg-slate-950 border flex items-start gap-2.5 ${
                    trackedCase.status === 'Located Safe' ? 'border-emerald-800/60 bg-emerald-950/20' : 'border-slate-800'
                  }`}>
                    <span className="w-4 h-4 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-400 shrink-0 mt-0.5">
                      4
                    </span>
                    <div>
                      <span className="text-xs font-bold text-white block">4. Safe Resolution</span>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {trackedCase.status === 'Located Safe' ? 'Subject verified located safe.' : 'Search operations ongoing.'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Physical Markers & Last Seen Details */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-rose-400" />
                  <span>Physical Profile & Disappearance Circumstances</span>
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/80">
                    <span className="text-slate-500 block text-[10px] uppercase font-mono">Height / Weight</span>
                    <span className="text-slate-200 font-semibold">{trackedCase.physicalDescription.height} • {trackedCase.physicalDescription.weight}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/80">
                    <span className="text-slate-500 block text-[10px] uppercase font-mono">Hair / Eyes</span>
                    <span className="text-slate-200 font-semibold">{trackedCase.physicalDescription.hair} • {trackedCase.physicalDescription.eyes}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/80 col-span-2">
                    <span className="text-slate-500 block text-[10px] uppercase font-mono">Last Seen Location</span>
                    <span className="text-slate-200 font-semibold">{trackedCase.lastSeenLocation.name}</span>
                    <span className="text-slate-400 text-[11px] block">{trackedCase.lastSeenLocation.address}</span>
                  </div>
                </div>

                <div className="text-xs space-y-1 pt-1">
                  <span className="text-slate-400 font-semibold block">Clothing & Accessories:</span>
                  <p className="text-slate-300 leading-relaxed bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/60">
                    {trackedCase.clothingLastSeen}
                  </p>
                </div>

                {trackedCase.medicalConditions && trackedCase.medicalConditions.length > 0 && (
                  <div className="text-xs space-y-1 pt-1">
                    <span className="text-rose-400 font-semibold flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                      <span>Critical Medical Vulnerabilities:</span>
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {trackedCase.medicalConditions.map((med, idx) => (
                        <span key={idx} className="px-2.5 py-0.5 rounded-md bg-rose-950/60 border border-rose-800 text-rose-300 text-xs">
                          {med}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Public Official Notes from Investigator */}
              {trackedCase.verificationNotes && (
                <div className="p-4 rounded-xl bg-blue-950/20 border border-blue-900/40 space-y-1">
                  <div className="flex items-center gap-1.5 text-blue-300 text-xs font-bold">
                    <ShieldCheck className="w-4 h-4 text-blue-400" />
                    <span>Official Law Enforcement Case Status Notice:</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {trackedCase.verificationNotes}
                  </p>
                  {trackedCase.verifiedAt && (
                    <span className="text-[10px] text-slate-500 font-mono block pt-1">
                      Updated: {new Date(trackedCase.verifiedAt).toLocaleString()}
                    </span>
                  )}
                </div>
              )}

              {/* Associated Sighting Reports & Field Clues */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider font-mono">
                    <Camera className="w-4 h-4 text-amber-400" />
                    <span>
                      Associated Sighting Reports ({sightings.filter(s => s.personId === trackedCase.id).length})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onOpenSightingModal(trackedCase.id)}
                    className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-semibold"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Report Eyewitness Sighting</span>
                  </button>
                </div>

                {sightings.filter(s => s.personId === trackedCase.id).length > 0 ? (
                  <div className="space-y-2">
                    {sightings
                      .filter(s => s.personId === trackedCase.id)
                      .map((s) => (
                        <div
                          key={s.id}
                          className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs space-y-1.5"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="font-semibold text-white flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-rose-400" />
                              <span>{s.locationName}</span>
                            </span>
                            <div className="flex items-center gap-2 text-[10px]">
                              <span className="font-mono text-slate-400">
                                {new Date(s.timestamp).toLocaleDateString()} {new Date(s.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              <span className={`px-2 py-0.5 rounded font-bold ${
                                s.status === 'Verified Match'
                                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                  : 'bg-amber-950 text-amber-300 border border-amber-800'
                              }`}>
                                {s.status}
                              </span>
                            </div>
                          </div>
                          <p className="text-slate-300 text-xs leading-relaxed">{s.notes}</p>
                          <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500">
                            <span>Reported by: {s.reportedBy}</span>
                            {s.confidenceScore && (
                              <span className="font-mono text-emerald-400 font-semibold">
                                AI Match: {s.confidenceScore}%
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-lg bg-slate-900/60 border border-dashed border-slate-800 text-center text-xs text-slate-400">
                    <span>No public sighting reports recorded yet for this case. Have you seen this person? </span>
                    <button
                      type="button"
                      onClick={() => onOpenSightingModal(trackedCase.id)}
                      className="text-amber-400 underline hover:text-amber-300 font-semibold ml-1"
                    >
                      Submit a Sighting Tip
                    </button>
                  </div>
                )}
              </div>

              {/* Actions & Agency Channel */}
              <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div className="text-slate-400">
                  <span>Assigned Agency: </span>
                  <strong className="text-white">{trackedCase.investigatingAgency}</strong>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => onOpenPrintFlyer(trackedCase)}
                    className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold flex items-center justify-center gap-2 transition"
                  >
                    <Printer className="w-4 h-4 text-slate-300" />
                    <span>Print Public Poster</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenSightingModal(trackedCase.id)}
                    className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold flex items-center justify-center gap-2 transition shadow-md shadow-blue-950/40"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Submit Sighting Lead</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SECTION 3: COMMUNITY AI SIGHTING MATCH OPERATION */}
      {activeSection === 'aimatch' && (
        <div className="space-y-6">
          <SightingScanner
            missingPersons={missingPersons}
            onLeadVerified={(lead) => {
              if (onLeadVerified) {
                onLeadVerified(lead);
              }
            }}
            onSelectPerson={(person) => {
              setTrackedCase(person);
              setActiveSection('track');
            }}
            preselectedPersonId={publicScannerPersonId}
            isPublicCitizen={true}
            currentUser={currentUser}
          />
        </div>
      )}

      {/* Digital Public Incident Desk Notice */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center sm:text-left text-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase text-slate-400 block">DIGITAL INTAKE ONLY</span>
            <span className="text-xs sm:text-sm font-bold text-white">Direct Online Submissions</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <HeartHandshake className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase text-slate-400 block">NO TELEPHONE DISPATCH</span>
            <span className="text-xs sm:text-sm font-bold text-white">Secure Encrypted Portal</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase text-slate-400 block">SAR FIELD DISPATCH</span>
            <span className="text-xs sm:text-sm font-bold text-white">Active Triage Queue</span>
          </div>
        </div>
      </div>
    </div>
  );
};
