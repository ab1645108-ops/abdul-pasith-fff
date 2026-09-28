import React, { useState } from 'react';
import { MissingPerson, SightingLead, AlertType, CurrentUser } from '../types';
import { 
  Search, Filter, MapPin, Clock, AlertTriangle, HeartPulse, User, 
  ExternalLink, Printer, Eye, ShieldAlert, CheckCircle2, ChevronRight, Sparkles,
  ShieldCheck, BadgeCheck, Check, Lock, FileCheck, Eraser, X, Phone, Mail, UserCheck, Send
} from 'lucide-react';
import { ConfirmFoundModal } from './ConfirmFoundModal';

interface CaseRegistryProps {
  missingPersons: MissingPerson[];
  sightings: SightingLead[];
  onSelectPerson: (person: MissingPerson) => void;
  onScanForPerson: (personId: string) => void;
  onGenerateAlertsForPerson: (person: MissingPerson) => void;
  onPrintFlyer: (person: MissingPerson) => void;
  onMarkStatus: (personId: string, newStatus: 'Active' | 'Located Safe') => void;
  onAgeProgression?: (person: MissingPerson) => void;
  currentUser?: CurrentUser;
  onVerifyCase?: (personId: string, notes: string) => void;
  onUpdatePerson?: (updatedPerson: MissingPerson) => void;
}

export const CaseRegistry: React.FC<CaseRegistryProps> = ({
  missingPersons,
  sightings,
  onSelectPerson,
  onScanForPerson,
  onGenerateAlertsForPerson,
  onPrintFlyer,
  onMarkStatus,
  onAgeProgression,
  currentUser,
  onVerifyCase,
  onUpdatePerson,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [selectedCase, setSelectedCase] = useState<MissingPerson | null>(null);
  
  // Verification action modal state
  const [verifyingPerson, setVerifyingPerson] = useState<MissingPerson | null>(null);
  const [verificationNotesInput, setVerificationNotesInput] = useState('');

  // Found Confirmation & Reporter Notification modal state
  const [foundConfirmPerson, setFoundConfirmPerson] = useState<MissingPerson | null>(null);

  const filteredPersons = missingPersons.filter((p) => {
    const qLower = searchQuery.toLowerCase();
    const matchesQuery =
      p.name.toLowerCase().includes(qLower) ||
      p.caseNumber.toLowerCase().includes(qLower) ||
      p.lastSeenLocation.name.toLowerCase().includes(qLower) ||
      p.clothingLastSeen.toLowerCase().includes(qLower) ||
      (p.reporterPhone && p.reporterPhone.toLowerCase().includes(qLower)) ||
      (p.reporterEmail && p.reporterEmail.toLowerCase().includes(qLower)) ||
      (p.reportedByName && p.reportedByName.toLowerCase().includes(qLower)) ||
      (p.reporterContact && p.reporterContact.toLowerCase().includes(qLower));

    const matchesType = filterType === 'ALL' || p.alertType === filterType;
    return matchesQuery && matchesType;
  });

  const handleStartVerification = (person: MissingPerson) => {
    setVerifyingPerson(person);
    setVerificationNotesInput(person.verificationNotes || `Verified identity, family report corroboration, and initial search zone established by ${currentUser?.name || 'Investigator'}.`);
  };

  const handleConfirmVerification = () => {
    if (verifyingPerson && onVerifyCase) {
      onVerifyCase(verifyingPerson.id, verificationNotesInput);
      if (selectedCase && selectedCase.id === verifyingPerson.id) {
        setSelectedCase({
          ...selectedCase,
          isVerified: true,
          verifiedBy: `${currentUser?.name} (${currentUser?.badgeNumber || 'LEO'})`,
          verifiedAt: new Date().toISOString(),
          verificationNotes: verificationNotesInput,
        });
      }
    }
    // Clear notes so slate is empty for next verification
    setVerificationNotesInput('');
    setVerifyingPerson(null);
  };

  const handleFoundConfirmed = (updatedPerson: MissingPerson) => {
    if (onUpdatePerson) {
      onUpdatePerson(updatedPerson);
    }
    if (selectedCase && selectedCase.id === updatedPerson.id) {
      setSelectedCase(updatedPerson);
    }
    setFoundConfirmPerson(null);
  };

  const getAlertBadge = (type: AlertType) => {
    switch (type) {
      case 'AMBER':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase tracking-wider">
            AMBER ALERT
          </span>
        );
      case 'SILVER':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40 uppercase tracking-wider">
            SILVER ALERT (SENIOR)
          </span>
        );
      case 'CRITICAL_MEDICAL':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 uppercase tracking-wider">
            CRITICAL MEDICAL
          </span>
        );
      case 'ENDANGERED':
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 uppercase tracking-wider">
            ENDANGERED MISSING
          </span>
        );
    }
  };

  const getHoursMissing = (isoDate: string) => {
    const diffMs = Date.now() - new Date(isoDate).getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    if (hours < 1) return 'Under 1 hour';
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h ago`;
  };

  return (
    <div className="space-y-6">
      {/* Law Enforcement & SAR Command Clearance Banner */}
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-6 shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 text-[10px] font-bold font-mono uppercase bg-rose-500/20 text-rose-300 border border-rose-500/40 rounded-full flex items-center gap-1">
                <Lock className="w-3 h-3" />
                <span>CJIS RESTRICTED • SAR LAW ENFORCEMENT CENTER</span>
              </span>
              <span className="text-xs text-slate-400 font-mono hidden sm:inline">
                OFFICIAL USE ONLY
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Investigative Missing Persons Registry & Dossiers
            </h1>
            <p className="text-xs sm:text-sm text-slate-300">
              Complete law enforcement case files, confidential medical records, witness sighting history, and dispatch controls.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-mono">ACTIVE INVESTIGATOR:</span>
              <span className="font-bold text-white">{currentUser?.name || 'Authorized SAR Official'}</span>
              <span className="text-[10px] text-blue-400 ml-1.5 font-mono">[{currentUser?.badgeNumber || currentUser?.role || 'LEO'}]</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-2 rounded-xl bg-rose-600/20 text-rose-300 font-mono font-bold text-xs border border-rose-500/30">
                {missingPersons.filter((p) => p.status === 'Active').length} Active
              </span>
              <span className="px-3 py-2 rounded-xl bg-emerald-600/20 text-emerald-300 font-mono font-bold text-xs border border-emerald-500/30">
                {missingPersons.filter((p) => p.status === 'Located Safe').length} Located Safe
              </span>
            </div>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-12 gap-3 pt-4 border-t border-slate-800">
          <div className="sm:col-span-7 relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              id="input-case-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search confidential files by name, case #, clothing, location..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-10 py-2.5 text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-rose-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
                title="Clear search text"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="sm:col-span-5 flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500 shrink-0" />
            <select
              id="select-alert-filter"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-rose-500"
            >
              <option value="ALL">All Alert Types ({missingPersons.length})</option>
              <option value="AMBER">Amber Alert (Children)</option>
              <option value="SILVER">Silver Alert (Seniors / Dementia)</option>
              <option value="CRITICAL_MEDICAL">Critical Medical Dependent</option>
              <option value="ENDANGERED">Endangered Missing Adults</option>
            </select>
          </div>
        </div>
      </div>

      {/* Case Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredPersons.map((person) => {
          const personSightings = sightings.filter((s) => s.personId === person.id);
          const isLocated = person.status === 'Located Safe';

          return (
            <div
              key={person.id}
              className={`bg-slate-900 border rounded-2xl overflow-hidden transition-all duration-200 flex flex-col justify-between ${
                isLocated
                  ? 'border-emerald-800/60 opacity-80'
                  : 'border-slate-800 hover:border-slate-700 shadow-md'
              }`}
            >
              <div>
                {/* Photo & Badge Overlays */}
                <div className="relative aspect-[16/10] bg-slate-950 overflow-hidden">
                  <img
                    src={person.photoUrl}
                    alt={person.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-black/40" />

                  {/* Top Badges */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-1">
                    <div>{getAlertBadge(person.alertType)}</div>
                    <div className="flex items-center gap-1.5">
                      {person.isVerified ? (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/90 text-emerald-300 border border-emerald-600/50 flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-emerald-400" />
                          <span>VERIFIED</span>
                        </span>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartVerification(person);
                          }}
                          className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/90 text-amber-300 border border-amber-600/50 hover:bg-amber-900/90 flex items-center gap-1 transition"
                          title="Click to verify this case"
                        >
                          <AlertTriangle className="w-3 h-3 text-amber-400" />
                          <span>VERIFY NOW</span>
                        </button>
                      )}
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-black/70 text-slate-300 backdrop-blur-sm border border-slate-700">
                        #{person.caseNumber}
                      </span>
                    </div>
                  </div>

                  {/* Bottom Image Info */}
                  <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-white leading-tight drop-shadow">
                        {person.name}, {person.age}
                      </h3>
                      <p className="text-xs text-slate-300 flex items-center gap-1 mt-0.5 drop-shadow">
                        <MapPin className="w-3 h-3 text-rose-400" />
                        <span className="truncate max-w-[200px]">{person.lastSeenLocation.name}</span>
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40">
                        {getHoursMissing(person.missingSince)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Body Details */}
                <div className="p-4 space-y-3 text-xs">
                  {/* Verification & Investigator Footprint */}
                  {person.isVerified && (
                    <div className="p-2 rounded-xl bg-emerald-950/20 border border-emerald-900/40 flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1.5 text-emerald-300">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="truncate">Verified by {person.verifiedBy || 'Investigator'}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {person.verifiedAt ? new Date(person.verifiedAt).toLocaleDateString() : 'Verified'}
                      </span>
                    </div>
                  )}

                  {/* Medical Conditions Badges */}
                  {person.medicalConditions?.length > 0 && (
                    <div className="p-2.5 rounded-xl bg-rose-950/30 border border-rose-900/40 flex items-start gap-2">
                      <HeartPulse className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <span className="font-semibold text-rose-300 block text-[11px]">
                          CRITICAL MEDICAL CONDITION:
                        </span>
                        <p className="text-slate-300 text-[11px] leading-tight">
                          {person.medicalConditions.join(' • ')}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Clothing */}
                  <div>
                    <span className="text-slate-400 font-medium block mb-0.5">Clothing Last Seen:</span>
                    <p className="text-slate-200 line-clamp-2 leading-relaxed">
                      {person.clothingLastSeen}
                    </p>
                  </div>

                  {/* Physical Snapshot */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
                    <div>
                      Height/Weight: <span className="text-slate-200">{person.physicalDescription.height}, {person.physicalDescription.weight}</span>
                    </div>
                    <div>
                      Hair/Eyes: <span className="text-slate-200">{person.physicalDescription.hair}</span>
                    </div>
                  </div>

                  {/* Sighting Timeline Count */}
                  <div className="flex items-center justify-between text-[11px] pt-1 text-slate-400">
                    <span>Sightings Reported:</span>
                    <span className="font-semibold text-amber-400 font-mono">
                      {personSightings.length} Leads Logged
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons Footer */}
              <div className="p-4 pt-0 border-t border-slate-800/60 mt-3 flex items-center gap-1.5">
                <button
                  id={`btn-open-dossier-${person.id}`}
                  onClick={() => setSelectedCase(person)}
                  className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                >
                  <User className="w-3.5 h-3.5 text-blue-400" />
                  <span>Full Dossier & Actions</span>
                </button>

                <button
                  onClick={() => setFoundConfirmPerson(person)}
                  title={person.status === 'Located Safe' ? 'View/Resend Found Notification Delivery' : 'Confirm Person Found & Automatically Notify Reporter'}
                  className={`p-2 rounded-xl transition flex items-center gap-1 ${
                    person.status === 'Located Safe'
                      ? 'bg-emerald-900/40 text-emerald-300 border border-emerald-600/50 hover:bg-emerald-800/50'
                      : 'bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/60'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </button>

                {!person.isVerified && (
                  <button
                    onClick={() => handleStartVerification(person)}
                    title="Verify this case file"
                    className="p-2 rounded-xl bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 border border-amber-800/60 transition"
                  >
                    <ShieldCheck className="w-4 h-4" />
                  </button>
                )}

                <button
                  id={`btn-age-progression-${person.id}`}
                  onClick={() => onAgeProgression?.(person)}
                  title="Generate AI Age Progression for this person"
                  className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950/60 text-slate-300 hover:text-rose-300 border border-slate-700 transition"
                >
                  <Sparkles className="w-4 h-4 text-rose-400" />
                </button>

                <button
                  id={`btn-scan-match-${person.id}`}
                  onClick={() => onScanForPerson(person.id)}
                  title="Run AI Photo Match against this person"
                  className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950/60 text-slate-300 hover:text-rose-300 border border-slate-700 transition"
                >
                  <Eye className="w-4 h-4" />
                </button>

                <button
                  id={`btn-flyer-case-${person.id}`}
                  onClick={() => onPrintFlyer(person)}
                  title="Print Official Missing Person Poster"
                  className="p-2 rounded-xl bg-slate-800 hover:bg-amber-950/60 text-slate-300 hover:text-amber-300 border border-slate-700 transition"
                >
                  <Printer className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredPersons.length === 0 && (
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl">
          <ShieldAlert className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-white">
            {missingPersons.length === 0 ? 'No Registered Missing Persons' : 'No Matching Active Case Records'}
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            {missingPersons.length === 0
              ? 'All demo cases have been cleared from the project. Use "Report Missing Person" in the navigation to register a new case file.'
              : 'Try adjusting your search criteria or alert category filter.'}
          </p>
        </div>
      )}

      {/* Case Detail Modal / Dossier */}
      {selectedCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full p-6 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            {/* Close Button */}
            <button
              onClick={() => setSelectedCase(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800/80"
            >
              ✕
            </button>

            {/* Dossier Header */}
            <div className="flex flex-col sm:flex-row gap-5 items-start">
              <div className="w-32 h-36 rounded-xl overflow-hidden bg-slate-950 shrink-0 border border-slate-800">
                <img
                  src={selectedCase.photoUrl}
                  alt={selectedCase.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  {getAlertBadge(selectedCase.alertType)}
                  <span className="text-xs font-mono text-slate-400">
                    CASE FILE: {selectedCase.caseNumber}
                  </span>
                  {selectedCase.isVerified ? (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700 flex items-center gap-1 font-bold">
                      <ShieldCheck className="w-3 h-3 text-emerald-400" />
                      <span>OFFICIAL SAR VERIFIED</span>
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-700 flex items-center gap-1 font-bold">
                      <AlertTriangle className="w-3 h-3 text-amber-400" />
                      <span>UNVERIFIED REPORT</span>
                    </span>
                  )}
                </div>
                <h2 className="text-2xl font-black text-white">
                  {selectedCase.name}
                </h2>
                <p className="text-xs text-slate-300">
                  {selectedCase.age} Years Old • {selectedCase.gender} • Risk Level: <span className="text-rose-400 font-semibold">{selectedCase.riskLevel}</span>
                </p>
                <div className="flex flex-wrap gap-4 text-xs text-slate-400 pt-1">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    Missing since {new Date(selectedCase.missingSince).toLocaleString()}
                  </span>
                  <span className="flex items-center gap-1 text-rose-400">
                    <MapPin className="w-3.5 h-3.5" />
                    {selectedCase.lastSeenLocation.address}
                  </span>
                </div>
              </div>
            </div>

            {/* INVESTIGATOR ACTION & VERIFICATION WORKFLOW PANEL */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-700 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <BadgeCheck className="w-4 h-4 text-rose-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                    Investigator Actions & Case Verification
                  </span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">
                  ACTOR: {currentUser?.name} [{currentUser?.role}]
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* Verification Status */}
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5">
                  <span className="text-slate-400 font-medium block">Verification Status:</span>
                  {selectedCase.isVerified ? (
                    <div>
                      <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Verified Official Investigation</span>
                      </span>
                      <p className="text-[11px] text-slate-400 mt-1">
                        By {selectedCase.verifiedBy} • {selectedCase.verifiedAt ? new Date(selectedCase.verifiedAt).toLocaleDateString() : 'Active'}
                      </p>
                      {selectedCase.verificationNotes && (
                        <p className="text-[11px] text-slate-300 mt-1 italic">
                          "{selectedCase.verificationNotes}"
                        </p>
                      )}
                      <button
                        onClick={() => handleStartVerification(selectedCase)}
                        className="mt-2 text-[11px] text-blue-400 hover:underline flex items-center gap-1"
                      >
                        <FileCheck className="w-3.5 h-3.5" />
                        <span>Update Verification Notes</span>
                      </button>
                    </div>
                  ) : (
                    <div>
                      <span className="text-amber-400 font-bold flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-amber-400" />
                        <span>Pending Law Enforcement Verification</span>
                      </span>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Verify family identity and validate alert distribution criteria.
                      </p>
                      <button
                        onClick={() => handleStartVerification(selectedCase)}
                        className="mt-2 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs flex items-center gap-1.5 transition"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Verify Case with My Badge</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Case Status Controls & Found Resolution */}
                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-medium text-xs block">SAR Operational Status:</span>
                    <span className={`px-2.5 py-0.5 rounded-lg font-bold text-xs ${
                      selectedCase.status === 'Located Safe'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : 'bg-rose-950 text-rose-300 border border-rose-800'
                    }`}>
                      {selectedCase.status}
                    </span>
                  </div>

                  {selectedCase.status !== 'Located Safe' ? (
                    <div className="pt-1 space-y-2">
                      <p className="text-[11px] text-slate-400">
                        When subject is recovered, confirm resolution to trigger automated SMS/email alerts to the reporting party.
                      </p>
                      <button
                        onClick={() => setFoundConfirmPerson(selectedCase)}
                        className="w-full px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-950/40 transition active:scale-95"
                      >
                        <CheckCircle2 className="w-4 h-4 text-white" />
                        <span>Confirm Found & Notify Reporter</span>
                      </button>
                    </div>
                  ) : (
                    <div className="pt-1 space-y-2">
                      <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-800/60 text-emerald-200 text-xs space-y-1">
                        <div className="flex items-center justify-between font-semibold">
                          <span className="flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Subject Located Safe</span>
                          </span>
                          {selectedCase.reporterNotificationDetails && (
                            <span className="text-[10px] font-mono text-emerald-300">
                              {selectedCase.reporterNotificationDetails.smsStatus}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-emerald-300/80">
                          Found: <strong>{selectedCase.foundLocation || selectedCase.lastSeenLocation.name}</strong> • Condition: <strong>{selectedCase.foundCondition || 'Safe & Stable'}</strong>
                        </p>
                        {selectedCase.reporterNotificationDetails && (
                          <p className="text-[10px] font-mono text-slate-400 pt-0.5">
                            Notice Receipt: #{selectedCase.reporterNotificationDetails.notificationId}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setFoundConfirmPerson(selectedCase)}
                          className="flex-1 px-3 py-1.5 rounded-lg bg-emerald-700/40 hover:bg-emerald-700/60 text-emerald-200 font-semibold text-xs border border-emerald-600/40 flex items-center justify-center gap-1 transition"
                        >
                          <Send className="w-3 h-3" />
                          <span>Re-dispatch Notice</span>
                        </button>
                        <button
                          onClick={() => {
                            onMarkStatus(selectedCase.id, 'Active');
                            setSelectedCase({ ...selectedCase, status: 'Active' });
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition"
                          title="Revert back to active search"
                        >
                          Reopen
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Summary Narrative */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-xs font-semibold text-slate-300 block">
                INCIDENT SUMMARY & INVESTIGATIVE NOTES:
              </span>
              <p className="text-xs text-slate-300 leading-relaxed">
                {selectedCase.summary}
              </p>
            </div>

            {/* Physical & Clothing Dossier */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="font-semibold text-slate-300 block">Physical Identifiers:</span>
                <ul className="space-y-1 text-slate-400">
                  <li>Height / Weight: <strong className="text-slate-200">{selectedCase.physicalDescription.height}, {selectedCase.physicalDescription.weight}</strong></li>
                  <li>Hair / Eyes: <strong className="text-slate-200">{selectedCase.physicalDescription.hair} / {selectedCase.physicalDescription.eyes}</strong></li>
                  <li>Distinguishing Marks: <strong className="text-slate-200">{selectedCase.physicalDescription.distinguishingMarks}</strong></li>
                </ul>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="font-semibold text-slate-300 block">Clothing & Personal Items:</span>
                <p className="text-slate-300 leading-relaxed">
                  {selectedCase.clothingLastSeen}
                </p>
                {selectedCase.medicalConditions?.length > 0 && (
                  <div className="pt-2 text-rose-300">
                    <strong>Medical:</strong> {selectedCase.medicalConditions.join(', ')}
                  </div>
                )}
              </div>
            </div>

            {/* Reporting Party & Contact Information */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-rose-400" />
                  <span>Reporting Party & Contact Information:</span>
                </span>
                {selectedCase.publicTrackingCode && (
                  <span className="font-mono text-[10px] text-slate-400 px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                    Track Ref: {selectedCase.publicTrackingCode}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 block font-mono">REPORTER / GUARDIAN:</span>
                  <span className="text-white font-medium">{selectedCase.reportedByName || 'Citizen Submitter'}</span>
                  {selectedCase.reporterRelation && (
                    <span className="text-[11px] text-slate-400 block">({selectedCase.reporterRelation})</span>
                  )}
                </div>

                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 block font-mono flex items-center gap-1">
                    <Phone className="w-3 h-3 text-rose-400" />
                    <span>CONTACT MOBILE NUMBER:</span>
                  </span>
                  {selectedCase.reporterPhone ? (
                    <span className="text-rose-300 font-mono font-bold text-xs">{selectedCase.reporterPhone}</span>
                  ) : (
                    <span className="text-slate-300 text-xs">{selectedCase.reporterContact || 'On file with dispatch'}</span>
                  )}
                </div>

                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 block font-mono flex items-center gap-1">
                    <Mail className="w-3 h-3 text-slate-400" />
                    <span>EMAIL ADDRESS:</span>
                  </span>
                  {selectedCase.reporterEmail || selectedCase.reportedByUserEmail ? (
                    <span className="text-slate-300 text-xs font-mono">{selectedCase.reporterEmail || selectedCase.reportedByUserEmail}</span>
                  ) : (
                    <span className="text-slate-500 italic text-xs">Not provided (Optional)</span>
                  )}
                </div>
              </div>
            </div>

            {/* Law Enforcement Agency Information */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div>
                <span className="text-slate-400 block font-mono text-[11px]">LEAD INVESTIGATING AGENCY:</span>
                <span className="text-white font-semibold text-sm">{selectedCase.investigatingAgency}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 font-mono text-xs">
                  Case Record: {selectedCase.caseNumber}
                </span>
              </div>
            </div>

            {/* Modal Bottom Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleStartVerification(selectedCase)}
                  className="text-xs px-3.5 py-2 rounded-xl font-semibold bg-blue-600 hover:bg-blue-500 text-white transition flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{selectedCase.isVerified ? 'Edit Case Verification' : 'Verify Case'}</span>
                </button>

                <button
                  onClick={() => setFoundConfirmPerson(selectedCase)}
                  className="text-xs px-3.5 py-2 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition flex items-center gap-1.5 shadow-md shadow-emerald-950/40 active:scale-95"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{selectedCase.status === 'Located Safe' ? 'View/Resend Found Notice' : 'Confirm Found & Notify'}</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    onAgeProgression?.(selectedCase);
                    setSelectedCase(null);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-rose-400" />
                  <span>Age Progression</span>
                </button>

                <button
                  onClick={() => {
                    onScanForPerson(selectedCase.id);
                    setSelectedCase(null);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5 text-rose-400" />
                  <span>Scan Sightings</span>
                </button>

                <button
                  onClick={() => {
                    onPrintFlyer(selectedCase);
                    setSelectedCase(null);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Missing Poster</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Official Law Enforcement Case Verification Dialog */}
      {verifyingPerson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  Law Enforcement Case Verification Stamp
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Verify {verifyingPerson.name} (#{verifyingPerson.caseNumber}) as an official verified SAR case.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1 text-xs">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                ATTESTATION BY SWORN INVESTIGATOR:
              </span>
              <p className="text-white font-semibold">
                {currentUser?.name || 'Sworn Detective'}
              </p>
              <p className="text-slate-400 text-[11px]">
                Badge: {currentUser?.badgeNumber || 'SAR-4108'} • Agency: {currentUser?.agency || 'Special Investigations Unit'}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300 block">
                  Verification Findings & Dispatch Notes:
                </label>
                {verificationNotesInput && (
                  <button
                    type="button"
                    onClick={() => setVerificationNotesInput('')}
                    className="text-[11px] text-slate-400 hover:text-emerald-400 flex items-center gap-1 transition"
                    title="Clear old notes to type new details"
                  >
                    <Eraser className="w-3 h-3" />
                    <span>Clear Slate</span>
                  </button>
                )}
              </div>
              <textarea
                rows={3}
                value={verificationNotesInput}
                onChange={(e) => setVerificationNotesInput(e.target.value)}
                placeholder="Enter verification notes (e.g. Confirmed with reporting family; corroborating camera footage checked; dispatch grid active)..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setVerificationNotesInput('')}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-white text-xs font-medium flex items-center gap-1.5 transition"
                title="Wipe notes clean"
              >
                <Eraser className="w-3.5 h-3.5 text-emerald-400" />
                <span>Clear Notes</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setVerificationNotesInput('');
                    setVerifyingPerson(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmVerification}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-lg shadow-emerald-950/40"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Confirm & Stamp Verification</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Found Confirmation & Automatic Reporter Notification Modal */}
      {foundConfirmPerson && (
        <ConfirmFoundModal
          isOpen={Boolean(foundConfirmPerson)}
          person={foundConfirmPerson}
          currentUser={currentUser}
          onClose={() => setFoundConfirmPerson(null)}
          onConfirmed={handleFoundConfirmed}
        />
      )}
    </div>
  );
};
