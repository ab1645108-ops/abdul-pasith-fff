import React from 'react';
import { MissingPerson } from '../types';
import { Printer, X, AlertTriangle, ShieldCheck, Sparkles } from 'lucide-react';

interface PrintableFlyerModalProps {
  person: MissingPerson | null;
  onClose: () => void;
  agedPhotoUrl?: string;
  agedTargetAge?: number;
}

export const PrintableFlyerModal: React.FC<PrintableFlyerModalProps> = ({
  person,
  onClose,
  agedPhotoUrl,
  agedTargetAge,
}) => {
  if (!person) return null;

  const handlePrint = () => {
    window.print();
  };

  const getHeaderTitle = () => {
    switch (person.alertType) {
      case 'AMBER':
        return 'AMBER ALERT — MISSING CHILD';
      case 'SILVER':
        return 'SILVER ALERT — ENDANGERED SENIOR';
      case 'CRITICAL_MEDICAL':
        return 'CRITICAL MEDICAL — ENDANGERED';
      default:
        return 'MISSING PERSON INVESTIGATION';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full p-4 sm:p-6 space-y-4 shadow-2xl relative max-h-[95vh] overflow-y-auto">
        {/* Modal Controls (Hidden in Print) */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-300">
              Printable Law Enforcement Bulletin
            </span>
            <span className="text-[11px] font-mono text-rose-400">
              Case #{person.caseNumber}
            </span>
            {agedPhotoUrl && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-purple-400" />
                <span>Forensic Age Progression (Age {agedTargetAge})</span>
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-md transition active:scale-95"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Poster / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Poster Sheet (White / High-Contrast Law Enforcement Standard) */}
        <div
          id="printable-flyer-content"
          className="bg-white text-slate-950 p-6 sm:p-8 rounded-xl border-4 border-rose-600 shadow-xl space-y-5 font-sans"
        >
          {/* Top Header Banner */}
          <div className="bg-rose-700 text-white py-3 px-4 text-center rounded-lg shadow-sm">
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-wider">
              {getHeaderTitle()}
            </h1>
            <p className="text-xs font-bold tracking-widest text-rose-100 uppercase mt-0.5">
              CASE NUMBER: {person.caseNumber} • {person.investigatingAgency.toUpperCase()}
            </p>
          </div>

          {/* Main Photo & Primary Identification */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
            {/* Subject Photo(s) */}
            <div className={`sm:col-span-5 ${agedPhotoUrl ? 'grid grid-cols-2 gap-2' : ''}`}>
              <div className="aspect-[4/5] rounded-xl overflow-hidden border-2 border-slate-800 bg-slate-100 shadow-md relative">
                <img
                  src={person.photoUrl}
                  alt={person.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-0 inset-x-0 bg-black/70 text-white text-[9px] font-bold text-center py-0.5">
                  AGE {person.age} (ORIGINAL)
                </div>
              </div>

              {agedPhotoUrl && (
                <div className="aspect-[4/5] rounded-xl overflow-hidden border-2 border-purple-600 bg-slate-100 shadow-md relative">
                  <img
                    src={agedPhotoUrl}
                    alt="Age Progressed Projection"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-0 inset-x-0 bg-purple-700 text-white text-[9px] font-bold text-center py-0.5">
                    PROJECTED AGE {agedTargetAge}
                  </div>
                </div>
              )}
            </div>

            {/* Vital Statistics Table */}
            <div className="sm:col-span-7 space-y-3">
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  SUBJECT NAME:
                </span>
                <h2 className="text-3xl font-black text-slate-950 uppercase leading-none">
                  {person.name}
                </h2>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs border-y-2 border-slate-200 py-3">
                <div>
                  <span className="text-slate-500 font-semibold block">AGE AT DISAPPEARANCE:</span>
                  <span className="text-base font-bold text-slate-900">{person.age} Years Old</span>
                  {agedTargetAge && (
                    <span className="text-xs text-purple-700 font-bold block">(Est. Today: {agedTargetAge}y)</span>
                  )}
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block">GENDER:</span>
                  <span className="text-base font-bold text-slate-900">{person.gender}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block">HEIGHT / WEIGHT:</span>
                  <span className="font-bold text-slate-900">{person.physicalDescription.height}, {person.physicalDescription.weight}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block">HAIR / EYES:</span>
                  <span className="font-bold text-slate-900">{person.physicalDescription.hair} / {person.physicalDescription.eyes}</span>
                </div>
              </div>

              {/* Distinguishing Marks */}
              <div className="text-xs">
                <span className="text-slate-500 font-bold block">DISTINGUISHING MARKS / IDENTIFIERS:</span>
                <p className="text-slate-900 font-medium">{person.physicalDescription.distinguishingMarks}</p>
              </div>
            </div>
          </div>

          {/* Critical Medical Warning Box */}
          {person.medicalConditions?.length > 0 && (
            <div className="bg-rose-50 border-2 border-rose-600 rounded-lg p-3 text-xs text-rose-900 flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-sm font-black text-rose-700 uppercase tracking-wide block">
                  CRITICAL MEDICAL WARNING:
                </strong>
                <p className="font-semibold text-rose-950">
                  {person.medicalConditions.join(' • ')}
                </p>
              </div>
            </div>
          )}

          {/* Last Seen & Clothing */}
          <div className="space-y-2 text-xs border-t-2 border-slate-200 pt-3">
            <div>
              <span className="text-slate-500 font-bold uppercase block">DATE & LAST KNOWN LOCATION:</span>
              <p className="text-sm font-bold text-slate-900">
                {new Date(person.missingSince).toLocaleDateString()} at {new Date(person.missingSince).toLocaleTimeString()} — {person.lastSeenLocation.name} ({person.lastSeenLocation.address})
              </p>
            </div>

            <div>
              <span className="text-slate-500 font-bold uppercase block">CLOTHING & ACCESSORIES WHEN LAST SEEN:</span>
              <p className="text-xs font-semibold text-slate-900 leading-relaxed">
                {person.clothingLastSeen}
              </p>
            </div>

            <div>
              <span className="text-slate-500 font-bold uppercase block">CIRCUMSTANCES OF DISAPPEARANCE:</span>
              <p className="text-xs text-slate-700 leading-relaxed">
                {person.summary}
              </p>
            </div>
          </div>

          {/* Bottom Law Enforcement Callout */}
          <div className="bg-slate-950 text-white rounded-xl p-4 text-center space-y-1">
            <span className="text-xs font-bold text-rose-400 uppercase tracking-widest block">
              IF SIGHTED, DO NOT ATTEMPT RESTRAINT — REPORT TO ASSIGNED LAW ENFORCEMENT
            </span>
            <div className="text-lg sm:text-xl font-black font-mono text-white tracking-wider">
              {person.investigatingAgency.toUpperCase()}
            </div>
            <p className="text-[11px] text-slate-400">
              SUBMIT SIGHTING TIPS DIRECTLY VIA THE FINDSAFE PORTAL • OFFICIAL CASE #{person.caseNumber}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
