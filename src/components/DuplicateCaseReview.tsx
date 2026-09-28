import React, { useState, useEffect } from 'react';
import { DuplicateCaseFlag, MissingPerson, CurrentUser } from '../types';
import { 
  GitMerge, CheckCircle2, XCircle, AlertTriangle, Search, 
  ArrowRight, ShieldCheck, Lock, RefreshCw, Layers, FileText,
  ChevronDown, ChevronUp, Sparkles, FolderCheck
} from 'lucide-react';

interface DuplicateCaseReviewProps {
  missingPersons: MissingPerson[];
  currentUser: CurrentUser;
  onCasesMerged?: (primaryId: string, candidateId: string) => void;
  onUpdateCases?: (updated: MissingPerson[]) => void;
}

export const DuplicateCaseReview: React.FC<DuplicateCaseReviewProps> = ({
  missingPersons,
  currentUser,
  onCasesMerged,
  onUpdateCases,
}) => {
  // Pending duplicate cases requiring investigation review
  const [flags, setFlags] = useState<DuplicateCaseFlag[]>([]);
  // Resolved cases archive (kept separate so resolved cases do not repeat in active queue)
  const [resolvedFlags, setResolvedFlags] = useState<DuplicateCaseFlag[]>([]);
  const [showResolvedArchive, setShowResolvedArchive] = useState<boolean>(false);

  const [selectedFlag, setSelectedFlag] = useState<DuplicateCaseFlag | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [resolutionNotes, setResolutionNotes] = useState<string>('');
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [forbiddenMessage, setForbiddenMessage] = useState<string | null>(null);
  const [lastScanSummary, setLastScanSummary] = useState<string | null>(null);

  const isAuthorized = currentUser.role !== 'PUBLIC_USER';

  useEffect(() => {
    if (isAuthorized) {
      loadDuplicateFlags();
    }
  }, [currentUser.role, isAuthorized]);

  const loadDuplicateFlags = async () => {
    try {
      const res = await fetch('/api/cases/duplicates?all=true', {
        headers: {
          'x-user-role': currentUser.role,
          'x-user-name': currentUser.name,
          'x-user-id': currentUser.id,
        },
      });

      if (res.status === 403) {
        setForbiddenMessage('Access Denied (HTTP 403): Duplicate case detection is restricted to authorized investigators.');
        return;
      }

      if (res.ok) {
        const data = await res.json();
        const pending = (data.duplicateFlags || []).filter(
          (f: DuplicateCaseFlag) => f.status === 'PENDING_REVIEW'
        );
        const resolved = (data.duplicateFlags || []).filter(
          (f: DuplicateCaseFlag) => f.status !== 'PENDING_REVIEW'
        );

        setFlags(pending);
        setResolvedFlags(resolved);

        // If pending cases exist, select the first; otherwise return to scan option
        if (pending.length > 0) {
          setSelectedFlag((prev) => 
            prev && pending.some((f: DuplicateCaseFlag) => f.id === prev.id) ? prev : pending[0]
          );
        } else {
          setSelectedFlag(null);
        }
      }
    } catch (err) {
      console.error('Failed to load duplicate flags:', err);
    }
  };

  const handleRunDuplicateScan = async () => {
    if (!isAuthorized) return;
    setIsScanning(true);
    setActionSuccessMsg(null);
    setForbiddenMessage(null);
    setLastScanSummary(null);

    try {
      const res = await fetch('/api/cases/scan-registry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': currentUser.role,
          'x-user-name': currentUser.name,
          'x-user-id': currentUser.id,
        },
        body: JSON.stringify({
          cases: missingPersons,
        }),
      });

      if (res.status === 403) {
        const err = await res.json();
        setForbiddenMessage(err.message || 'Access Forbidden: Insufficient role permissions.');
        return;
      }

      if (res.ok) {
        const data = await res.json();
        const pending = (data.duplicateFlags || []).filter(
          (f: DuplicateCaseFlag) => f.status === 'PENDING_REVIEW'
        );
        setFlags(pending);

        if (data.newMatchesFound > 0) {
          setActionSuccessMsg(`Registry cross-reference scan complete: Found ${data.newMatchesFound} potential duplicate case(s) requiring review.`);
          setLastScanSummary(`Detected ${data.newMatchesFound} new duplicate match pair(s).`);
          if (pending.length > 0) {
            setSelectedFlag(pending[0]);
          }
        } else {
          setActionSuccessMsg('Registry scan complete: 0 duplicate cases detected. All active dossiers are verified unique.');
          setLastScanSummary('Registry verified: 0 duplicates found.');
          setSelectedFlag(null);
        }
      }
    } catch (err) {
      console.error('Duplicate scan error:', err);
    } finally {
      setIsScanning(false);
    }
  };


  const handleResolveFlag = async (resolution: 'MERGE' | 'DISMISS') => {
    if (!selectedFlag) return;
    setForbiddenMessage(null);
    const flagToResolve = selectedFlag;

    try {
      const res = await fetch('/api/cases/resolve-duplicate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': currentUser.role,
          'x-user-name': currentUser.name,
          'x-user-id': currentUser.id,
        },
        body: JSON.stringify({
          flagId: flagToResolve.id,
          resolution,
          notes: resolutionNotes || (resolution === 'MERGE' ? 'Consolidated duplicate citizen reports.' : 'Verified as distinct individual.'),
        }),
      });

      if (res.status === 403) {
        const err = await res.json();
        setForbiddenMessage(err.message || 'Access Forbidden: Insufficient role permissions.');
        return;
      }

      if (res.ok) {
        setActionSuccessMsg(
          resolution === 'MERGE'
            ? `Case #${flagToResolve.candidateCaseId} (${flagToResolve.candidateCase.name}) merged into Primary Dossier #${flagToResolve.primaryCaseId}. Previous case removed from duplicate queue.`
            : `Case #${flagToResolve.candidateCaseId} (${flagToResolve.candidateCase.name}) verified as distinct independent investigation. Previous case removed from duplicate queue.`
        );

        if (resolution === 'MERGE') {
          onCasesMerged?.(flagToResolve.primaryCaseId, flagToResolve.candidateCaseId);
        }

        // Archive this resolved record
        const resolvedEntry: DuplicateCaseFlag = {
          ...flagToResolve,
          status: resolution === 'MERGE' ? 'RESOLVED_MERGED' : 'DISMISSED_DISTINCT',
          reviewedBy: `${currentUser.name} (${currentUser.role})`,
          reviewedAt: new Date().toISOString(),
        };
        setResolvedFlags((prev) => [resolvedEntry, ...prev.filter((f) => f.id !== flagToResolve.id)]);

        // Remove previous case so it does NOT show again in the pending queue
        const remaining = flags.filter((f) => f.id !== flagToResolve.id);
        setFlags(remaining);
        setResolutionNotes('');

        // If other duplicate cases exist, show only those other cases;
        // else return to the scan option view until a new scan is run!
        if (remaining.length > 0) {
          setSelectedFlag(remaining[0]);
        } else {
          setSelectedFlag(null);
        }
      }
    } catch (err) {
      console.error('Resolution error:', err);
    }
  };

  if (!isAuthorized) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center space-y-4 shadow-sm max-w-2xl mx-auto my-12">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto">
          <Lock className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-white">
          Duplicate Case Resolution Restricted
        </h2>
        <p className="text-xs text-slate-300 leading-relaxed max-w-md mx-auto">
          Case deduplication, forensic identity merging, and official record consolidation require certified law enforcement analyst clearance.
        </p>
        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400 font-mono inline-block">
          HTTP 403 FORBIDDEN — Active Role: <span className="text-amber-400 font-bold">{currentUser.role}</span>
        </div>
        <p className="text-[11px] text-slate-500">
          Switch role to <strong>Investigator</strong> or <strong>Admin</strong> in the header to evaluate case merging.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30">
                <GitMerge className="w-5 h-5" />
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Duplicate Case Detection & Merge Workbench
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                SAR DEDUPLICATION
              </span>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              Fuzzy algorithmic matching, side-by-side discrepancy analysis, and certified dossier unification.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRunDuplicateScan}
              disabled={isScanning}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white text-xs font-bold shadow-md shadow-rose-900/30 transition disabled:opacity-50 active:scale-95"
            >
              <Search className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
              <span>{isScanning ? 'Scanning Active Registry...' : 'Scan Registry for Duplicates'}</span>
            </button>
          </div>
        </div>
      </div>

      {actionSuccessMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-950/70 border border-emerald-800 text-emerald-200 text-xs flex items-center justify-between shadow-sm animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-medium">{actionSuccessMsg}</span>
          </div>
          <button 
            onClick={() => setActionSuccessMsg(null)} 
            className="text-emerald-400 hover:text-white font-mono p-1 rounded hover:bg-emerald-900/50"
          >
            ✕
          </button>
        </div>
      )}

      {forbiddenMessage && (
        <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-200 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{forbiddenMessage}</span>
        </div>
      )}

      {/* Main Grid: Flags Queue vs Side-by-Side Comparison / Scan Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Queue of Duplicate Flags (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-sm">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  Pending Duplicate Queue ({flags.length})
                </span>
                {flags.length > 0 && (
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                )}
              </div>
              <button
                onClick={loadDuplicateFlags}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
                title="Refresh duplicate flags"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
              {flags.map((flag) => {
                const isSelected = selectedFlag?.id === flag.id;

                return (
                  <div
                    key={flag.id}
                    onClick={() => setSelectedFlag(flag)}
                    className={`p-3 rounded-xl border transition cursor-pointer text-xs space-y-2 ${
                      isSelected
                        ? 'bg-purple-950/50 border-purple-500 shadow-md ring-1 ring-purple-500/50 text-white'
                        : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] text-slate-400">ID: {flag.id}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                        PENDING REVIEW
                      </span>
                    </div>

                    <div>
                      <span className="font-bold text-white block truncate">
                        {flag.primaryCase.name} ↔ {flag.candidateCase.name}
                      </span>
                      <div className="flex items-center justify-between mt-1 text-[11px] text-slate-400">
                        <span>Similarity Score:</span>
                        <strong className="text-purple-300 font-mono font-bold">{flag.similarityScore}%</strong>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-1 border-t border-slate-900">
                      <span>Flagged: {new Date(flag.flaggedAt).toLocaleDateString()}</span>
                      <span className="text-rose-400 flex items-center gap-0.5 font-sans">
                        Inspect →
                      </span>
                    </div>
                  </div>
                );
              })}

              {flags.length === 0 && (
                <div className="p-6 text-center text-xs text-slate-400 space-y-2.5 border border-dashed border-slate-800 rounded-xl bg-slate-950/50">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-200 block text-xs">Queue Clear</span>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                      All flagged duplicate cases have been reviewed. Previous cases are consolidated.
                    </p>
                  </div>
                  <button
                    onClick={handleRunDuplicateScan}
                    disabled={isScanning}
                    className="w-full py-2 px-3 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>Run Registry Scan</span>
                  </button>
                </div>
              )}
            </div>

            {/* Resolved Archive Accordion */}
            {resolvedFlags.length > 0 && (
              <div className="pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowResolvedArchive(!showResolvedArchive)}
                  className="w-full py-2 px-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 flex items-center justify-between transition"
                >
                  <span className="flex items-center gap-1.5 font-mono text-[11px]">
                    <FolderCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Resolved Archive ({resolvedFlags.length})</span>
                  </span>
                  {showResolvedArchive ? (
                    <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </button>

                {showResolvedArchive && (
                  <div className="mt-2 space-y-2 max-h-48 overflow-y-auto pr-1">
                    {resolvedFlags.map((rf) => (
                      <div
                        key={rf.id}
                        className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/80 text-[11px] space-y-1 opacity-80 hover:opacity-100 transition"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[10px] text-slate-500">{rf.id}</span>
                          <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold ${
                            rf.status === 'RESOLVED_MERGED'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : 'bg-slate-800 text-slate-400'
                          }`}>
                            {rf.status.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="font-medium text-slate-300 truncate">
                          {rf.primaryCase.name} ↔ {rf.candidateCase.name}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          By: {rf.reviewedBy || 'Investigator'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Active Flag Review OR Clean Scan Option Workspace (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {selectedFlag ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-sm">
              {/* Score & Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      FLAG ID: {selectedFlag.id}
                    </span>
                    <span className="text-xs font-bold text-white font-mono uppercase tracking-wider">
                      Cross-Referencing Analysis
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Evaluate candidate duplicate report against verified primary missing dossier.
                  </p>
                </div>

                <div className="flex items-center gap-3 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block uppercase font-mono tracking-wider">Similarity Index</span>
                    <span className="text-2xl font-bold font-mono text-purple-400">
                      {selectedFlag.similarityScore}%
                    </span>
                  </div>
                  <div className="w-12 h-12 rounded-full border-4 border-purple-500/30 border-t-purple-500 flex items-center justify-center font-bold font-mono text-xs text-white">
                    {selectedFlag.similarityScore}
                  </div>
                </div>
              </div>

              {/* Match Factors & Discrepancies Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-800/50 space-y-1.5">
                  <span className="font-bold text-emerald-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Corroborated Match Factors ({selectedFlag.matchReasons.length})
                  </span>
                  <ul className="space-y-1 text-[11px] text-slate-300">
                    {selectedFlag.matchReasons.map((r, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-emerald-400 shrink-0">•</span>
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-800/50 space-y-1.5">
                  <span className="font-bold text-amber-300 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    Field Discrepancies ({selectedFlag.discrepancies?.length || 0})
                  </span>
                  <ul className="space-y-1 text-[11px] text-slate-300">
                    {selectedFlag.discrepancies?.map((d, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-amber-400 shrink-0">•</span>
                        <span><strong>{d.field}:</strong> "{d.primaryValue}" vs "{d.candidateValue}"</span>
                      </li>
                    ))}
                    {(!selectedFlag.discrepancies || selectedFlag.discrepancies.length === 0) && (
                      <li className="text-slate-400 italic">No significant conflicting data points detected.</li>
                    )}
                  </ul>
                </div>
              </div>

              {/* Side-by-Side Comparison Columns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Primary Case Column */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 font-mono text-[10px] font-bold">
                      PRIMARY DOSSIER (ACTIVE)
                    </span>
                    <span className="font-mono text-slate-400 text-[11px]">#{selectedFlag.primaryCase.caseNumber}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <img
                      src={selectedFlag.primaryCase.photoUrl}
                      alt={selectedFlag.primaryCase.name}
                      className="w-16 h-16 rounded-xl object-cover bg-slate-900 border border-slate-800 shrink-0"
                    />
                    <div>
                      <h4 className="text-sm font-bold text-white">{selectedFlag.primaryCase.name}</h4>
                      <p className="text-slate-400 text-[11px]">{selectedFlag.primaryCase.age} Years Old • {selectedFlag.primaryCase.gender}</p>
                      <span className="text-rose-400 font-mono text-[10px]">{selectedFlag.primaryCase.alertType} ALERT</span>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-[11px] text-slate-300 pt-2 border-t border-slate-900">
                    <div><strong className="text-slate-400">Last Seen:</strong> {selectedFlag.primaryCase.lastSeenLocation.name}</div>
                    <div><strong className="text-slate-400">Date/Time:</strong> {new Date(selectedFlag.primaryCase.missingSince).toLocaleString()}</div>
                    <div><strong className="text-slate-400">Clothing:</strong> {selectedFlag.primaryCase.clothingLastSeen}</div>
                    <div><strong className="text-slate-400">Conditions:</strong> {selectedFlag.primaryCase.medicalConditions?.join(", ") || "None"}</div>
                  </div>
                </div>

                {/* Candidate Case Column */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 font-mono text-[10px] font-bold">
                      CANDIDATE DUPLICATE
                    </span>
                    <span className="font-mono text-slate-400 text-[11px]">#{selectedFlag.candidateCase.caseNumber}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <img
                      src={selectedFlag.candidateCase.photoUrl}
                      alt={selectedFlag.candidateCase.name}
                      className="w-16 h-16 rounded-xl object-cover bg-slate-900 border border-slate-800 shrink-0"
                    />
                    <div>
                      <h4 className="text-sm font-bold text-white">{selectedFlag.candidateCase.name}</h4>
                      <p className="text-slate-400 text-[11px]">{selectedFlag.candidateCase.age} Years Old • {selectedFlag.candidateCase.gender}</p>
                      <span className="text-rose-400 font-mono text-[10px]">{selectedFlag.candidateCase.alertType} ALERT</span>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-[11px] text-slate-300 pt-2 border-t border-slate-900">
                    <div><strong className="text-slate-400">Last Seen:</strong> {selectedFlag.candidateCase.lastSeenLocation.name}</div>
                    <div><strong className="text-slate-400">Date/Time:</strong> {new Date(selectedFlag.candidateCase.missingSince).toLocaleString()}</div>
                    <div><strong className="text-slate-400">Clothing:</strong> {selectedFlag.candidateCase.clothingLastSeen}</div>
                    <div><strong className="text-slate-400">Conditions:</strong> {selectedFlag.candidateCase.medicalConditions?.join(", ") || "None"}</div>
                  </div>
                </div>
              </div>

              {/* Resolution Controls */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <span className="text-xs font-bold text-white block">
                  Investigative Determination & Consolidation
                </span>

                <textarea
                  rows={2}
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Enter analyst justification notes for merge or dismissal..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 resize-none"
                />

                <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                  <button
                    onClick={() => handleResolveFlag('DISMISS')}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white font-semibold text-xs flex items-center gap-1.5 border border-slate-700 transition"
                  >
                    <XCircle className="w-4 h-4 text-slate-400" />
                    <span>Confirm as Distinct Individuals</span>
                  </button>

                  <button
                    onClick={() => handleResolveFlag('MERGE')}
                    className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-purple-900/40 transition active:scale-95"
                  >
                    <GitMerge className="w-4 h-4" />
                    <span>Merge Into Primary Dossier</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Dedicated Scan Option Workspace: When submitted/clean, show option for scanning */
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 sm:p-12 text-center flex flex-col items-center justify-center space-y-6 shadow-sm min-h-[480px]">
              <div className="relative">
                <div className="w-20 h-20 rounded-3xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 mx-auto shadow-inner">
                  <GitMerge className="w-10 h-10" />
                </div>
                <span className="absolute -bottom-1 -right-1 p-1 rounded-full bg-emerald-500 text-white">
                  <CheckCircle2 className="w-4 h-4" />
                </span>
              </div>

              <div className="max-w-md space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-bold">
                  <span>0 PENDING DUPLICATE CASES • REGISTRY CLEAN</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  Ready for Duplicate Case Scanning
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  All previously flagged duplicate cases have been reviewed and consolidated. Click below to run a deep algorithmic cross-reference scan across all active dossiers in the registry.
                </p>
              </div>

              {/* Metric Counters */}
              <div className="grid grid-cols-3 gap-3 w-full max-w-lg text-left">
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Active Dossiers</span>
                  <span className="text-lg font-bold font-mono text-white">{missingPersons.length}</span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Pending Review</span>
                  <span className="text-lg font-bold font-mono text-amber-400">{flags.length}</span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Resolved / Merged</span>
                  <span className="text-lg font-bold font-mono text-emerald-400">{resolvedFlags.length}</span>
                </div>
              </div>

              {/* Big Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <button
                  onClick={handleRunDuplicateScan}
                  disabled={isScanning}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white font-bold text-sm shadow-xl shadow-purple-950/50 flex items-center justify-center gap-2 transition disabled:opacity-50 active:scale-95"
                >
                  <Search className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
                  <span>{isScanning ? 'Scanning Active Registry...' : 'Scan Registry for Duplicates'}</span>
                </button>
              </div>

              {lastScanSummary && (
                <p className="text-xs text-slate-400 font-mono pt-1">
                  Status: {lastScanSummary}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
