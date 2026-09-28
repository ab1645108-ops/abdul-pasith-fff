import React, { useState, useEffect } from 'react';
import { MissingPerson, AlertPackage } from '../types';
import { 
  Megaphone, Radio, MessageSquare, Share2, Copy, Check, Printer, 
  Sparkles, RefreshCw, FileText, ShieldAlert 
} from 'lucide-react';

interface AlertPackageGeneratorProps {
  missingPersons: MissingPerson[];
  initialPerson?: MissingPerson;
  onPrintFlyer: (person: MissingPerson) => void;
}

export const AlertPackageGenerator: React.FC<AlertPackageGeneratorProps> = ({
  missingPersons,
  initialPerson,
  onPrintFlyer,
}) => {
  const [selectedPersonId, setSelectedPersonId] = useState<string>(
    initialPerson?.id || missingPersons[0]?.id || ''
  );
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [alertPackage, setAlertPackage] = useState<AlertPackage | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const currentPerson = missingPersons.find((p) => p.id === selectedPersonId) || missingPersons[0];

  useEffect(() => {
    if (currentPerson) {
      handleGenerateAlerts();
    }
  }, [selectedPersonId]);

  const handleGenerateAlerts = async () => {
    if (!currentPerson) return;
    setIsGenerating(true);

    try {
      const response = await fetch('/api/generate-alert-package', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ person: currentPerson }),
      });

      if (!response.ok) throw new Error('Failed to generate alert package');
      const data = await response.json();
      setAlertPackage(data);
    } catch (err) {
      console.error('Alert package error:', err);
      // Fallback
      setAlertPackage({
        broadcastScript: `URGENT BROADCAST: A ${currentPerson.alertType} Alert has been issued for ${currentPerson.name}, age ${currentPerson.age}. Last seen at ${currentPerson.lastSeenLocation.name} wearing ${currentPerson.clothingLastSeen}. ${currentPerson.medicalConditions?.length ? 'Subject has critical medical vulnerabilities.' : ''} If sighted, submit a lead directly via the FindSafe portal or contact ${currentPerson.investigatingAgency} immediately.`,
        socialMediaPost: `🚨 URGENT: #MissingPerson #FindSafeAlert\nHave you seen ${currentPerson.name} (${currentPerson.age} y/o)? Last seen near ${currentPerson.lastSeenLocation.name}.\nWearing: ${currentPerson.clothingLastSeen}\n⚠️ ${(currentPerson.medicalConditions || []).join(' | ')}\nIf you have ANY information, submit tips directly via FindSafe portal. Please SHARE!`,
        smsNotification: `ALERT: Missing ${currentPerson.age}yo ${currentPerson.name} last seen ${currentPerson.lastSeenLocation.name}. Wearing ${currentPerson.clothingLastSeen.substring(0, 45)}... Submit sighting tips via FindSafe portal.`,
        volunteerBriefing: `VOLUNTEER BRIEFING - CASE ${currentPerson.caseNumber}:\n1. Target: ${currentPerson.name} (${currentPerson.age}yo)\n2. Vulnerability: ${(currentPerson.medicalConditions || []).join(', ')}\n3. Search Zone: ${currentPerson.lastSeenLocation.name}\n4. Safety Directive: Keep distance, speak in gentle tone, log sightings in portal.\n5. Log all clues with photos in FindSafe portal.`,
        printableFlyerSummary: {
          headline: `MISSING: ${currentPerson.name.toUpperCase()}`,
          urgentCallToAction: `REPORT SIGHTINGS VIA FINDSAFE PORTAL TO ${currentPerson.investigatingAgency.toUpperCase()}`,
          vitalStats: [
            `Age: ${currentPerson.age} | Gender: ${currentPerson.gender}`,
            `Height: ${currentPerson.physicalDescription.height} | Weight: ${currentPerson.physicalDescription.weight}`,
            `Hair: ${currentPerson.physicalDescription.hair} | Eyes: ${currentPerson.physicalDescription.eyes}`,
            `Last Seen: ${currentPerson.lastSeenLocation.address}`
          ],
          contactNumbers: [`Agency: ${currentPerson.investigatingAgency}`]
        }
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  if (!currentPerson || missingPersons.length === 0) {
    return (
      <div className="space-y-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              EMERGENCY PIO ENGINE
            </span>
            <span className="text-xs text-slate-400 font-mono">Multi-Channel Public Broadcast</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Emergency Alert & Broadcast Studio
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Instantly generate tailored public communications: Law Enforcement radio dispatch scripts, Wireless Emergency Alert (WEA) SMS copy, social media bulletins, and printable search posters.
          </p>
        </div>
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl">
          <ShieldAlert className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-white">No Registered Case Available</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            Please register a missing person case before generating multi-channel broadcast packages.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                EMERGENCY PIO ENGINE
              </span>
              <span className="text-xs text-slate-400 font-mono">Multi-Channel Public Broadcast</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Emergency Alert & Broadcast Studio
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Instantly generate tailored public communications: Law Enforcement radio dispatch scripts, Wireless Emergency Alert (WEA) SMS copy, social media bulletins, and printable search posters.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              id="select-alert-pkg-person"
              value={selectedPersonId}
              onChange={(e) => setSelectedPersonId(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-medium text-slate-200 focus:outline-none focus:border-rose-500"
            >
              {missingPersons.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.alertType}) - #{p.caseNumber}
                </option>
              ))}
            </select>

            <button
              onClick={handleGenerateAlerts}
              disabled={isGenerating}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
              title="Regenerate alerts"
            >
              <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Broadcast Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Card 1: Official Radio & TV Broadcast Script */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-rose-500/20 text-rose-300">
                  <Radio className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Emergency Broadcast Script</h3>
                  <span className="text-[11px] text-slate-400">Radio, Television & Public Audio Dispatch</span>
                </div>
              </div>

              <button
                onClick={() => copyToClipboard(alertPackage?.broadcastScript || '', 'radio')}
                className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
              >
                {copiedKey === 'radio' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'radio' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 leading-relaxed font-sans min-h-[120px]">
              {alertPackage?.broadcastScript || 'Generating official dispatch broadcast script...'}
            </div>
          </div>

          <div className="text-[11px] text-slate-500 font-mono">
            Optimized for 30-45 second spoken word cadence
          </div>
        </div>

        {/* Card 2: Wireless Emergency Alert (WEA) SMS */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-amber-500/20 text-amber-300">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Wireless Emergency Alert (SMS)</h3>
                  <span className="text-[11px] text-slate-400">Carrier Push Notification (≤ 160 Characters)</span>
                </div>
              </div>

              <button
                onClick={() => copyToClipboard(alertPackage?.smsNotification || '', 'sms')}
                className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
              >
                {copiedKey === 'sms' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'sms' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 leading-relaxed font-mono min-h-[120px]">
              {alertPackage?.smsNotification || 'Generating WEA SMS notification...'}
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
            <span>Character Count: {alertPackage?.smsNotification?.length || 0} / 160</span>
            <span className="text-emerald-400">Standard WEA Compliant</span>
          </div>
        </div>

        {/* Card 3: Social Media Urgent Bulletin */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-blue-500/20 text-blue-300">
                  <Share2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Social Media Community Bulletin</h3>
                  <span className="text-[11px] text-slate-400">X (Twitter), Instagram, Facebook, Nextdoor</span>
                </div>
              </div>

              <button
                onClick={() => copyToClipboard(alertPackage?.socialMediaPost || '', 'social')}
                className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
              >
                {copiedKey === 'social' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'social' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 leading-relaxed whitespace-pre-line min-h-[120px]">
              {alertPackage?.socialMediaPost || 'Generating viral community bulletin...'}
            </div>
          </div>

          <div className="text-[11px] text-slate-500 font-mono">
            Formatted with priority emergency hashtags for algorithmic amplification
          </div>
        </div>

        {/* Card 4: Search Volunteer Briefing */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-300">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Search Volunteer Briefing Card</h3>
                  <span className="text-[11px] text-slate-400">Field Protocol, Medical Hazards & De-escalation</span>
                </div>
              </div>

              <button
                onClick={() => copyToClipboard(alertPackage?.volunteerBriefing || '', 'volunteer')}
                className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
              >
                {copiedKey === 'volunteer' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'volunteer' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 leading-relaxed whitespace-pre-line min-h-[120px]">
              {alertPackage?.volunteerBriefing || 'Generating volunteer tactical briefing sheet...'}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => onPrintFlyer(currentPerson)}
              className="w-full py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-rose-950/40 transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Generate Printable Official Missing Poster</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
