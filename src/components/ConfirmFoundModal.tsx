import React, { useState } from 'react';
import { 
  MissingPerson, CurrentUser, SubjectCondition, ReunionStatus,
  ReporterNotificationDelivery, FoundConfirmationRecord
} from '../types';
import { 
  CheckCircle2, X, Phone, Mail, UserCheck, MapPin, 
  HeartPulse, ShieldCheck, Send, AlertTriangle, Sparkles,
  Smartphone, MessageSquare, Clock, Check
} from 'lucide-react';
import { confirmPersonFoundServer } from '../services/caseService';

interface ConfirmFoundModalProps {
  isOpen: boolean;
  onClose: () => void;
  person: MissingPerson;
  currentUser?: CurrentUser;
  onConfirmed: (updatedPerson: MissingPerson) => void;
}

export const ConfirmFoundModal: React.FC<ConfirmFoundModalProps> = ({
  isOpen,
  onClose,
  person,
  currentUser,
  onConfirmed,
}) => {
  const [foundLocation, setFoundLocation] = useState(
    person.foundLocation || `${person.lastSeenLocation.name} (Safe Harbor)`
  );
  const [subjectCondition, setSubjectCondition] = useState<SubjectCondition>(
    person.foundCondition || 'Safe & Stable'
  );
  const [reunionStatus, setReunionStatus] = useState<ReunionStatus>(
    person.foundReunionStatus || 'Reunited with Family'
  );
  const [foundNotes, setFoundNotes] = useState(
    person.foundNotes || 'Subject has been verified located safe by search coordinators and is in good spirits.'
  );
  const [customNote, setCustomNote] = useState('');
  
  // Notification channels
  const [notifySms, setNotifySms] = useState(true);
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifySystemAlert, setNotifySystemAlert] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [deliveryResult, setDeliveryResult] = useState<ReporterNotificationDelivery | null>(null);

  if (!isOpen) return null;

  const recipientPhone = person.reporterPhone || (person.reporterContact?.match(/(\+?[0-9()\-\s]{7,20})/)?.[0] ?? '');
  const recipientEmail = person.reporterEmail || person.reportedByUserEmail;
  const recipientName = person.reportedByName || 'Reporting Family Member';

  // Preview SMS text
  const previewSmsText = 
    `FINSAFE SAR ALERT: Good news! ${person.name.toUpperCase()} has been CONFIRMED LOCATED SAFE. ` +
    `Location: ${foundLocation || 'Safe Harbor'}. ` +
    `Condition: ${subjectCondition}. ` +
    `Status: ${reunionStatus}. ` +
    `Verified by: ${currentUser?.name || 'SAR Investigator'}. ` +
    (customNote ? `Note: ${customNote} ` : '') +
    `Case #${person.caseNumber}. Family reunification protocol active.`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!foundLocation.trim()) {
      setErrorMsg('Please specify the location where the person was found.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const response = await confirmPersonFoundServer(person.id, {
        foundLocation: foundLocation.trim(),
        subjectCondition,
        reunionStatus,
        foundNotes: foundNotes.trim(),
        customNote: customNote.trim() || undefined,
        notifyChannels: {
          sms: notifySms && Boolean(recipientPhone),
          email: notifyEmail && Boolean(recipientEmail),
          inApp: notifySystemAlert,
        },
        caseData: person,
      }, currentUser);

      setDeliveryResult(response.notification);
      onConfirmed(response.case);
    } catch (err: any) {
      console.error('Failed to confirm found:', err);
      setErrorMsg(err.message || 'Failed to submit found confirmation. Please verify connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-emerald-500/40 rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl relative max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white">Confirm Found & Notify Reporter</h2>
                <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 font-mono text-[10px] font-bold border border-emerald-800">
                  CASE #{person.caseNumber}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Officially verify {person.name} has been recovered. The system will automatically dispatch confirmation alerts to the original reporter.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* If successfully delivered, show confirmation card */}
        {deliveryResult ? (
          <div className="space-y-4 py-2 animate-in fade-in">
            <div className="p-4 rounded-xl bg-emerald-950/50 border border-emerald-500/60 text-emerald-200 space-y-3">
              <div className="flex items-center gap-2 text-emerald-300 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>Case Confirmed Located Safe & Reporter Successfully Notified!</span>
              </div>
              <p className="text-xs text-emerald-300/90 leading-relaxed">
                {person.name}'s status has been resolved to <strong>Located Safe</strong> across all investigative and public bulletins.
              </p>
              
              {/* Delivery Receipt Details */}
              <div className="p-3 rounded-lg bg-slate-950/80 border border-emerald-900/60 text-xs space-y-2 font-mono">
                <div className="flex justify-between text-slate-300">
                  <span>Notification Receipt ID:</span>
                  <span className="text-emerald-400 font-bold">{deliveryResult.notificationId}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Recipient:</span>
                  <span>{deliveryResult.recipientName}</span>
                </div>
                {deliveryResult.recipientPhone && (
                  <div className="flex justify-between text-slate-300">
                    <span>SMS Delivery ({deliveryResult.smsProvider}):</span>
                    <span className="text-emerald-400 font-bold">
                      {deliveryResult.smsStatus} {deliveryResult.smsMessageId ? `(#${deliveryResult.smsMessageId})` : ''}
                    </span>
                  </div>
                )}
                {deliveryResult.recipientEmail && (
                  <div className="flex justify-between text-slate-300">
                    <span>Email Delivery:</span>
                    <span className="text-emerald-400 font-bold">
                      {deliveryResult.emailStatus}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-slate-300">
                  <span>Channels Succeeded:</span>
                  <span className="text-slate-200">[{deliveryResult.channelsSucceeded.join(', ')}]</span>
                </div>
                <div className="flex justify-between text-slate-400 text-[10px]">
                  <span>Timestamp:</span>
                  <span>{new Date(deliveryResult.timestamp).toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition"
              >
                Close & Return to Registry
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Subject Overview Card */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <img
                  src={person.photoUrl}
                  alt={person.name}
                  className="w-12 h-12 rounded-lg object-cover border border-slate-700"
                />
                <div>
                  <div className="text-white font-bold text-sm">{person.name}</div>
                  <div className="text-slate-400 text-[11px]">
                    Age: {person.age} • Gender: {person.gender} • Last Seen: {person.lastSeenLocation.name}
                  </div>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-rose-950/80 text-rose-300 border border-rose-800 font-bold text-[11px]">
                Current: {person.status}
              </span>
            </div>

            {/* Original Reporter Contact File */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-rose-400" />
                  <span>Original Reporter on File (Recipient of Automated Alert):</span>
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-mono">
                  AUTO-NOTIFY TARGET
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-mono block">REPORTER NAME</span>
                  <span className="text-white font-semibold">{recipientName}</span>
                  {person.reporterRelation && (
                    <span className="text-[10px] text-slate-400 block">({person.reporterRelation})</span>
                  )}
                </div>

                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-mono block flex items-center gap-1">
                    <Phone className="w-3 h-3 text-rose-400" />
                    <span>CONTACT MOBILE</span>
                  </span>
                  {recipientPhone ? (
                    <div className="space-y-0.5">
                      <span className="text-rose-300 font-bold font-mono text-xs block">{recipientPhone}</span>
                      <span className="text-[9px] text-emerald-400 flex items-center gap-1">
                        <Check className="w-2.5 h-2.5" /> SMS Ready
                      </span>
                    </div>
                  ) : (
                    <span className="text-amber-400 text-[11px]">No mobile provided</span>
                  )}
                </div>

                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-mono block flex items-center gap-1">
                    <Mail className="w-3 h-3 text-slate-400" />
                    <span>EMAIL (OPTIONAL)</span>
                  </span>
                  {recipientEmail ? (
                    <span className="text-slate-300 font-mono text-xs block truncate">{recipientEmail}</span>
                  ) : (
                    <span className="text-slate-500 italic text-[11px]">Not provided (Optional)</span>
                  )}
                </div>
              </div>
            </div>

            {/* Found Details Form */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-slate-300 font-medium mb-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-rose-400" />
                  <span>Found Location / Safe Harbor *</span>
                </label>
                <input
                  type="text"
                  required
                  value={foundLocation}
                  onChange={(e) => setFoundLocation(e.target.value)}
                  placeholder="e.g. Mercy San Juan Medical Center, 6555 Coyle Ave"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1 flex items-center gap-1">
                  <HeartPulse className="w-3.5 h-3.5 text-rose-400" />
                  <span>Subject Physical & Medical Condition</span>
                </label>
                <select
                  value={subjectCondition}
                  onChange={(e) => setSubjectCondition(e.target.value as SubjectCondition)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="Safe & Stable">Safe & Stable</option>
                  <option value="Uninjured & Healthy">Uninjured & Healthy</option>
                  <option value="Minor Injuries / Treated">Minor Injuries / Treated</option>
                  <option value="Hospitalized">Hospitalized (Under Care)</option>
                  <option value="Critical Care">Critical Care</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                  <span>Family Reunification Status</span>
                </label>
                <select
                  value={reunionStatus}
                  onChange={(e) => setReunionStatus(e.target.value as ReunionStatus)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="Reunited with Family">Reunited with Family</option>
                  <option value="At Medical Facility">At Medical Facility</option>
                  <option value="In Protective Custody">In Protective Custody</option>
                  <option value="En Route to Family">En Route to Family</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-300 font-medium mb-1">
                  Official Verification Notes
                </label>
                <textarea
                  rows={2}
                  value={foundNotes}
                  onChange={(e) => setFoundNotes(e.target.value)}
                  placeholder="Context regarding recovery, identifying officers, and handover..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 resize-none focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-300 font-medium mb-1">
                  Optional Personal Message to Reporter / Family
                </label>
                <input
                  type="text"
                  value={customNote}
                  onChange={(e) => setCustomNote(e.target.value)}
                  placeholder="e.g. Please proceed to Station 4 Reception Desk to meet with Officer Miller."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Notification Channels & Dispatch Toggles */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-emerald-400" />
                  <span>Automated Reporter Notification Channels</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">PROVIDER ABSTRACTION READY</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <label className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer transition ${
                  notifySms ? 'bg-emerald-950/40 border-emerald-600 text-white' : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}>
                  <input
                    type="checkbox"
                    checked={notifySms}
                    onChange={(e) => setNotifySms(e.target.checked)}
                    className="accent-emerald-500 w-4 h-4 rounded"
                  />
                  <div>
                    <span className="font-semibold block text-xs">SMS Dispatch</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {recipientPhone ? recipientPhone : 'No mobile on file'}
                    </span>
                  </div>
                </label>

                <label className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer transition ${
                  notifyEmail ? 'bg-emerald-950/40 border-emerald-600 text-white' : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}>
                  <input
                    type="checkbox"
                    checked={notifyEmail}
                    onChange={(e) => setNotifyEmail(e.target.checked)}
                    className="accent-emerald-500 w-4 h-4 rounded"
                  />
                  <div>
                    <span className="font-semibold block text-xs">Email Notice</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {recipientEmail ? 'Active' : 'Optional / Blank'}
                    </span>
                  </div>
                </label>

                <label className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer transition ${
                  notifySystemAlert ? 'bg-emerald-950/40 border-emerald-600 text-white' : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}>
                  <input
                    type="checkbox"
                    checked={notifySystemAlert}
                    onChange={(e) => setNotifySystemAlert(e.target.checked)}
                    className="accent-emerald-500 w-4 h-4 rounded"
                  />
                  <div>
                    <span className="font-semibold block text-xs">Public Resolution</span>
                    <span className="text-[10px] text-slate-400">Portal Alert Hub</span>
                  </div>
                </label>
              </div>

              {/* Live SMS Message Preview */}
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 flex items-center gap-1 font-mono">
                    <MessageSquare className="w-3 h-3 text-emerald-400" />
                    <span>Live SMS Carrier Payload Preview:</span>
                  </span>
                  <span className="text-emerald-400 text-[10px] font-mono">
                    {previewSmsText.length} chars
                  </span>
                </div>
                <p className="text-[11px] font-mono text-emerald-300 bg-slate-950 p-2.5 rounded border border-slate-850 leading-relaxed break-words">
                  {previewSmsText}
                </p>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-600 text-rose-200 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Modal Controls */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting || !foundLocation.trim()}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold flex items-center gap-2 shadow-lg shadow-emerald-950/50 transition active:scale-95"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {isSubmitting ? 'Verifying & Notifying...' : 'Confirm Located Safe & Notify Reporter'}
                </span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
