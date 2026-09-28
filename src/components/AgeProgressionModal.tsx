import React, { useState, useEffect } from 'react';
import { MissingPerson, AgeProgressionRecord, CurrentUser } from '../types';
import { 
  Sparkles, Clock, AlertTriangle, Printer, ArrowRight, ShieldCheck, 
  RotateCcw, Sliders, CheckCircle2, ChevronRight, User, Lock, Download
} from 'lucide-react';

interface AgeProgressionModalProps {
  person: MissingPerson | null;
  currentUser: CurrentUser;
  isOpen: boolean;
  onClose: () => void;
  onPrintFlyerWithAgedPhoto?: (person: MissingPerson, agedPhotoUrl: string, targetAge: number) => void;
  onAgeProgressionGenerated?: (record: AgeProgressionRecord) => void;
}

export const AgeProgressionModal: React.FC<AgeProgressionModalProps> = ({
  person,
  currentUser,
  isOpen,
  onClose,
  onPrintFlyerWithAgedPhoto,
  onAgeProgressionGenerated,
}) => {
  const [targetAge, setTargetAge] = useState<number>(person ? Math.min(85, person.age + 8) : 30);
  const [promptNotes, setPromptNotes] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [activeRecord, setActiveRecord] = useState<AgeProgressionRecord | null>(null);
  const [history, setHistory] = useState<AgeProgressionRecord[]>([]);
  const [sliderPosition, setSliderPosition] = useState<number>(50); // Split slider 0-100%
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [forbiddenError, setForbiddenError] = useState<string | null>(null);

  const isAuthorized = currentUser.role !== 'PUBLIC_USER';

  const fetchExistingRecords = async () => {
    if (!person?.id) return;
    try {
      const res = await fetch(`/api/age-progression/${person.id}`);
      if (res.ok) {
        const data = await res.json();
        setHistory(data.ageProgressions || []);
        if (data.ageProgressions?.length > 0) {
          setActiveRecord(data.ageProgressions[0]);
          setTargetAge(data.ageProgressions[0].targetAge);
        }
      }
    } catch (err) {
      console.error('Failed to load age progressions:', err);
    }
  };

  // Fetch existing age progressions for this person on open
  useEffect(() => {
    if (isOpen && person?.id) {
      setTargetAge(Math.min(85, person.age + 8));
      fetchExistingRecords();
    }
  }, [isOpen, person?.id]);

  if (!isOpen || !person) return null;

  const handleGenerateProgression = async () => {
    if (!isAuthorized) {
      setForbiddenError('Access Denied (HTTP 403): Only sworn Investigators and System Administrators can generate forensic age progressions.');
      return;
    }

    setIsGenerating(true);
    setErrorMsg(null);
    setForbiddenError(null);

    try {
      const res = await fetch('/api/age-progression', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': currentUser.role,
          'x-user-name': currentUser.name,
          'x-user-id': currentUser.id,
        },
        body: JSON.stringify({
          personId: person.id,
          currentAge: person.age,
          targetAge,
          originalPhotoUrl: person.photoUrl,
          promptNotes,
          candidateProfile: person,
        }),
      });

      if (res.status === 403) {
        const errorData = await res.json();
        setForbiddenError(errorData.message || 'Access Forbidden: Insufficient role permissions.');
        return;
      }

      if (!res.ok) {
        throw new Error(`Server responded with status ${res.status}`);
      }

      const data = await res.json();
      if (data.record) {
        setActiveRecord(data.record);
        setHistory((prev) => [data.record, ...prev]);
        onAgeProgressionGenerated?.(data.record);
      }
    } catch (err: any) {
      console.error('Age progression error:', err);
      setErrorMsg(err.message || 'Failed to synthesize age progression.');
    } finally {
      setIsGenerating(false);
    }
  };

  const currentDisplayImage = activeRecord?.progressedPhotoUrl || person.photoUrl;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full p-6 space-y-6 shadow-2xl relative max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30">
                <Sparkles className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-bold text-white tracking-tight">
                AI Forensic Age Progression Simulator
              </h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                CASE #{person.caseNumber}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Deep morphological craniofacial modeling for long-term missing individuals.
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800/80 transition"
          >
            ✕
          </button>
        </div>

        {/* RBAC Warning Banner for Public Users */}
        {!isAuthorized && (
          <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-800/60 flex items-center gap-3 text-xs text-amber-300">
            <Lock className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <strong className="font-semibold">Public Viewer Mode:</strong> You can inspect existing forensic projections, but generating new age progression syntheses requires an <span className="underline">Investigator</span> or <span className="underline">Admin</span> account.
            </div>
          </div>
        )}

        {forbiddenError && (
          <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-200 text-xs flex items-center gap-2 animate-shake">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{forbiddenError}</span>
          </div>
        )}

        {/* Main Grid: Visual Comparison vs Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Visual Comparison Stage */}
          <div className="lg:col-span-7 space-y-4">
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 select-none shadow-inner">
              {/* Underneath: Progressed Photo */}
              <img
                src={currentDisplayImage}
                alt="Age Progressed Portrait"
                className="absolute inset-0 w-full h-full object-cover"
              />

              {/* Top Layer: Original Photo Clipped by Slider */}
              <div
                className="absolute inset-0 overflow-hidden border-r-2 border-white shadow-2xl"
                style={{ width: `${sliderPosition}%` }}
              >
                <img
                  src={person.photoUrl}
                  alt="Original Portrait"
                  className="absolute inset-0 w-full h-full object-cover max-w-none"
                  style={{ width: '100%', height: '100%' }}
                />
                <div className="absolute top-3 left-3 px-2 py-1 rounded bg-black/70 backdrop-blur-sm text-[10px] font-mono font-bold text-slate-200 border border-slate-700">
                  ORIGINAL: AGE {person.age}
                </div>
              </div>

              {/* Progressed Label */}
              <div className="absolute top-3 right-3 px-2 py-1 rounded bg-rose-950/80 backdrop-blur-sm text-[10px] font-mono font-bold text-rose-300 border border-rose-700">
                PROGRESSED: AGE {activeRecord ? activeRecord.targetAge : targetAge}
              </div>

              {/* Slider Drag Bar Indicator */}
              <div
                className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize flex items-center justify-center pointer-events-none"
                style={{ left: `${sliderPosition}%` }}
              >
                <div className="w-7 h-7 rounded-full bg-white text-slate-900 shadow-xl flex items-center justify-center text-[10px] font-bold">
                  ↔
                </div>
              </div>

              {/* Transparent Range Input for interactive scrubbing */}
              <input
                type="range"
                min="0"
                max="100"
                value={sliderPosition}
                onChange={(e) => setSliderPosition(Number(e.target.value))}
                className="absolute inset-0 opacity-0 cursor-ew-resize w-full h-full z-10"
                aria-label="Before/After Split Comparison"
              />
            </div>

            {/* Comparison Controls & Slider Hint */}
            <div className="flex items-center justify-between text-xs text-slate-400 px-1">
              <span className="flex items-center gap-1 font-mono text-[11px]">
                <span>Original ({person.age} y/o)</span>
              </span>
              <span className="text-[11px] text-slate-500 italic">Drag image horizontally to compare before/after</span>
              <span className="flex items-center gap-1 font-mono text-[11px] text-rose-400">
                <span>Progressed ({activeRecord?.targetAge || targetAge} y/o)</span>
              </span>
            </div>

            {/* Morphological Analysis Findings */}
            {activeRecord?.morphologicalAnalysis && (
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Forensic Craniofacial Changes Breakdown
                  </span>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {activeRecord.morphologicalAnalysis.confidenceScore}% Morphological Match
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-[11px]">
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/80">
                    <span className="font-semibold text-rose-300 block mb-0.5">Skeletal / Jaw Structure:</span>
                    <p className="text-slate-300 leading-relaxed">
                      {activeRecord.morphologicalAnalysis.facialBoneChanges}
                    </p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/80">
                    <span className="font-semibold text-amber-300 block mb-0.5">Dermal & Texture Maturation:</span>
                    <p className="text-slate-300 leading-relaxed">
                      {activeRecord.morphologicalAnalysis.skinTextureChanges}
                    </p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/80">
                    <span className="font-semibold text-blue-300 block mb-0.5">Hair & Follicle Evolution:</span>
                    <p className="text-slate-300 leading-relaxed">
                      {activeRecord.morphologicalAnalysis.hairChanges}
                    </p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/80">
                    <span className="font-semibold text-purple-300 block mb-0.5">Persistent Hereditary Traits:</span>
                    <p className="text-slate-300 leading-relaxed">
                      {activeRecord.morphologicalAnalysis.hereditaryFactors}
                    </p>
                  </div>
                </div>

                {activeRecord.promptNotes && (
                  <p className="text-xs text-slate-400 italic pt-1 border-t border-slate-800/60">
                    Analyst Synthesis: "{activeRecord.promptNotes}"
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Controls & Parameters Sidebar */}
          <div className="lg:col-span-5 space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-rose-400" />
                  Target Progression Age
                </h3>

                {/* Age Slider */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Chronological Target:</span>
                    <span className="text-base font-bold font-mono text-rose-400">
                      {targetAge} Years Old
                    </span>
                  </div>
                  <input
                    type="range"
                    min={Math.max(1, person.age + 1)}
                    max="85"
                    value={targetAge}
                    onChange={(e) => setTargetAge(Number(e.target.value))}
                    disabled={!isAuthorized}
                    className="w-full accent-rose-500"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>Current: {person.age}y</span>
                    <span>Elapsed: +{targetAge - person.age} years</span>
                    <span>Max: 85y</span>
                  </div>
                </div>

                {/* Quick Presets */}
                <div className="pt-2">
                  <span className="text-[11px] text-slate-400 block mb-1.5">Quick Aging Intervals:</span>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { label: '+3y', age: person.age + 3 },
                      { label: '+8y', age: person.age + 8 },
                      { label: '+15y', age: person.age + 15 },
                      { label: 'Adult (25y)', age: 25 },
                    ].map((btn) => (
                      <button
                        key={btn.label}
                        type="button"
                        onClick={() => setTargetAge(btn.age)}
                        disabled={!isAuthorized}
                        className={`py-1.5 text-xs font-mono rounded-lg border transition ${
                          targetAge === btn.age
                            ? 'bg-rose-600 text-white border-rose-500'
                            : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Environmental & Hereditary Guidance */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                <label className="font-semibold text-slate-300 block">
                  Hereditary & Lifestyle Modifiers (Optional):
                </label>
                <textarea
                  value={promptNotes}
                  onChange={(e) => setPromptNotes(e.target.value)}
                  disabled={!isAuthorized}
                  rows={3}
                  placeholder="e.g., Paternal traits: prominent chin, early receding hairline, high cheekbones. Outdoor lifestyle exposure..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-rose-500"
                />
              </div>

              {/* Existing Progression History */}
              {history.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">
                    Archived Age Projections ({history.length}):
                  </span>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {history.map((rec) => (
                      <button
                        key={rec.id}
                        onClick={() => {
                          setActiveRecord(rec);
                          setTargetAge(rec.targetAge);
                        }}
                        className={`p-2 rounded-xl border flex items-center gap-2 shrink-0 transition text-left ${
                          activeRecord?.id === rec.id
                            ? 'bg-rose-950/60 border-rose-600 text-rose-200'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-900'
                        }`}
                      >
                        <img
                          src={rec.progressedPhotoUrl}
                          alt={`Age ${rec.targetAge}`}
                          className="w-8 h-8 rounded-lg object-cover bg-slate-900"
                        />
                        <div className="text-[11px] font-mono leading-tight">
                          <span className="font-bold block text-white">Age {rec.targetAge}</span>
                          <span className="text-[10px] text-slate-500">+{rec.yearsProgressed}y elapsed</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-slate-800 space-y-2">
              <button
                id="btn-run-age-progression"
                onClick={handleGenerateProgression}
                disabled={isGenerating || !isAuthorized}
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg transition ${
                  isAuthorized
                    ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-900/40'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>
                  {isGenerating
                    ? 'Synthesizing Forensic Progression...'
                    : `Generate Age Progression (${person.age}y → ${targetAge}y)`}
                </span>
              </button>

              {activeRecord && onPrintFlyerWithAgedPhoto && (
                <button
                  onClick={() => onPrintFlyerWithAgedPhoto(person, activeRecord.progressedPhotoUrl, activeRecord.targetAge)}
                  className="w-full py-2 px-4 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center justify-center gap-2 transition"
                >
                  <Printer className="w-3.5 h-3.5 text-amber-400" />
                  <span>Export Official Poster with Age-Progressed Photo</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
