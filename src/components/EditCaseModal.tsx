import React, { useState } from 'react';
import { MissingPerson, AlertType, CurrentUser } from '../types';
import { 
  Edit3, Upload, Plus, X, AlertTriangle, Save, MapPin, 
  User, Check, ShieldCheck, HeartPulse, Phone, Mail
} from 'lucide-react';

interface EditCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  person: MissingPerson;
  onSave: (updated: MissingPerson) => void;
  currentUser?: CurrentUser;
}

export const EditCaseModal: React.FC<EditCaseModalProps> = ({
  isOpen,
  onClose,
  person,
  onSave,
  currentUser,
}) => {
  const [name, setName] = useState(person.name || '');
  const [age, setAge] = useState<number | ''>(person.age ?? 25);
  const [gender, setGender] = useState<'Female' | 'Male' | 'Non-Binary' | 'Other'>(person.gender || 'Female');
  const [alertType, setAlertType] = useState<AlertType>(person.alertType || 'ENDANGERED');
  const [photoUrl, setPhotoUrl] = useState(person.photoUrl || '');
  const [clothing, setClothing] = useState(person.clothingLastSeen || '');
  const [height, setHeight] = useState(person.physicalDescription?.height || '');
  const [weight, setWeight] = useState(person.physicalDescription?.weight || '');
  const [hair, setHair] = useState(person.physicalDescription?.hair || '');
  const [eyes, setEyes] = useState(person.physicalDescription?.eyes || '');
  const [distinguishingMarks, setDistinguishingMarks] = useState(person.physicalDescription?.distinguishingMarks || '');
  const [locationName, setLocationName] = useState(person.lastSeenLocation?.name || '');
  const [address, setAddress] = useState(person.lastSeenLocation?.address || '');
  const [medicalConditionInput, setMedicalConditionInput] = useState('');
  const [medicalConditions, setMedicalConditions] = useState<string[]>(person.medicalConditions || []);
  const [summary, setSummary] = useState(person.summary || '');
  const [investigatingAgency, setInvestigatingAgency] = useState(person.investigatingAgency || '');
  const [emergencyContact, setEmergencyContact] = useState(person.emergencyContact || '');
  const [reporterPhone, setReporterPhone] = useState(person.reporterPhone || '');
  const [reporterEmail, setReporterEmail] = useState(person.reporterEmail || person.reportedByUserEmail || '');
  const [reporterContact, setReporterContact] = useState(person.reporterContact || '');
  const [status, setStatus] = useState<'Active' | 'Located Safe' | 'Investigating'>(person.status || 'Active');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleAddCondition = () => {
    if (medicalConditionInput.trim() && !medicalConditions.includes(medicalConditionInput.trim())) {
      setMedicalConditions([...medicalConditions, medicalConditionInput.trim()]);
      setMedicalConditionInput('');
    }
  };

  const handleRemoveCondition = (idx: number) => {
    setMedicalConditions(medicalConditions.filter((_, i) => i !== idx));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setPhotoUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);

    const updatedPerson: MissingPerson = {
      ...person,
      name: name.trim(),
      age: Number(age) || 25,
      gender,
      alertType,
      photoUrl: photoUrl.trim() || person.photoUrl,
      clothingLastSeen: clothing.trim() || 'Not specified',
      physicalDescription: {
        height: height.trim() || 'Not specified',
        weight: weight.trim() || 'Not specified',
        hair: hair.trim() || 'Not specified',
        eyes: eyes.trim() || 'Not specified',
        distinguishingMarks: distinguishingMarks.trim() || 'None reported',
      },
      lastSeenLocation: {
        ...person.lastSeenLocation,
        name: locationName.trim() || person.lastSeenLocation.name,
        address: address.trim() || person.lastSeenLocation.address,
      },
      medicalConditions,
      summary: summary.trim() || person.summary,
      investigatingAgency: investigatingAgency.trim() || person.investigatingAgency,
      emergencyContact: emergencyContact.trim() || person.emergencyContact,
      reporterPhone: reporterPhone.trim() || person.reporterPhone,
      reporterEmail: reporterEmail.trim() || person.reporterEmail,
      reportedByUserEmail: reporterEmail.trim() || person.reportedByUserEmail,
      reporterContact: [
        reporterPhone.trim() ? `Mobile: ${reporterPhone.trim()}` : '',
        reporterEmail.trim() ? `Email: ${reporterEmail.trim()}` : '',
      ].filter(Boolean).join(' | ') || reporterContact.trim() || person.reporterContact,
      status,
      riskLevel: alertType === 'AMBER' || alertType === 'SILVER' ? 'Extreme' : 'High',
    };

    onSave(updatedPerson);
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl relative max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white">Edit Case Report</h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  REF #{person.caseNumber}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Update case details. Changes will automatically sync to Public, Investigator, and Admin portals.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sync Notice */}
        <div className="p-3 rounded-xl bg-blue-950/30 border border-blue-800/40 text-xs text-blue-300 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0" />
          <span>
            <strong>Automatic Multi-Portal Sync:</strong> Any edits saved here will immediately update across all portals (Public Community Safety, Investigator Command, and Admin Dispatch).
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Section 1: Subject Identity */}
          <div className="space-y-3">
            <h3 className="font-semibold text-slate-200 border-b border-slate-800 pb-1 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-blue-400" />
              <span>Subject Identification & Classification</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-slate-400 mb-1 font-medium">Full Legal Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Age</label>
                <input
                  type="number"
                  min="0"
                  max="120"
                  value={age}
                  onChange={(e) => setAge(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Gender</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Non-Binary">Non-Binary</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Alert Classification</label>
                <select
                  value={alertType}
                  onChange={(e) => setAlertType(e.target.value as AlertType)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="ENDANGERED">ENDANGERED MISSING</option>
                  <option value="AMBER">AMBER ALERT (Child in Danger)</option>
                  <option value="SILVER">SILVER ALERT (Senior / Vulnerable)</option>
                  <option value="CRITICAL_MEDICAL">CRITICAL MEDICAL ALERT</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Resolution Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="Active">Active Search</option>
                  <option value="Located Safe">Located Safe & Resolved</option>
                  <option value="Investigating">Under Investigation</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Photo Management */}
          <div className="space-y-2">
            <label className="block text-slate-400 font-medium">Subject Photograph</label>
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 shrink-0">
                {photoUrl ? (
                  <img src={photoUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-600">
                    <User className="w-6 h-6" />
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-2">
                <input
                  type="text"
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  placeholder="https://example.com/photo.jpg or upload below"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-white text-xs focus:outline-none focus:border-blue-500"
                />
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 cursor-pointer transition text-xs font-semibold">
                  <Upload className="w-3.5 h-3.5 text-blue-400" />
                  <span>Choose New Image File</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Section 3: Physical Description */}
          <div className="space-y-3">
            <h3 className="font-semibold text-slate-200 border-b border-slate-800 pb-1">
              Physical Description & Apparel
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">Height</label>
                <input
                  type="text"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  placeholder="e.g. 5 ft 8 in"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Weight</label>
                <input
                  type="text"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="e.g. 145 lbs"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Hair</label>
                <input
                  type="text"
                  value={hair}
                  onChange={(e) => setHair(e.target.value)}
                  placeholder="e.g. Brown wavy"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Eyes</label>
                <input
                  type="text"
                  value={eyes}
                  onChange={(e) => setEyes(e.target.value)}
                  placeholder="e.g. Hazel"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Distinguishing Marks / Scars / Tattoos</label>
              <input
                type="text"
                value={distinguishingMarks}
                onChange={(e) => setDistinguishingMarks(e.target.value)}
                placeholder="e.g. Small scar near left temple, butterfly tattoo on right forearm"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Clothing Last Seen Wearing *</label>
              <input
                type="text"
                value={clothing}
                onChange={(e) => setClothing(e.target.value)}
                placeholder="e.g. Navy blue fleece hoodie, grey sweatpants, white sneakers"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Section 4: Location & Circumstances */}
          <div className="space-y-3">
            <h3 className="font-semibold text-slate-200 border-b border-slate-800 pb-1 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-rose-400" />
              <span>Last Known Location & Notes</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">Location Landmark / Facility</label>
                <input
                  type="text"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  placeholder="e.g. Oak Ridge High School"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Street Address / City</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. 1200 Oak Ridge Rd, Roseville, CA"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Incident Summary & Search Directives</label>
              <textarea
                rows={2}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Describe key circumstances..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Section 5: Medical Vulnerabilities */}
          <div className="space-y-2">
            <label className="block text-slate-400 font-medium flex items-center gap-1.5">
              <HeartPulse className="w-3.5 h-3.5 text-rose-400" />
              <span>Medical Conditions / Vulnerabilities</span>
            </label>

            <div className="flex gap-2">
              <input
                type="text"
                value={medicalConditionInput}
                onChange={(e) => setMedicalConditionInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCondition();
                  }
                }}
                placeholder="Add condition: e.g. Asthma, Dementia, Insulin Dependent"
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-white focus:outline-none focus:border-blue-500"
              />
              <button
                type="button"
                onClick={handleAddCondition}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-white rounded-xl border border-slate-700 flex items-center gap-1 font-semibold"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>

            {medicalConditions.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {medicalConditions.map((med, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-200 text-xs"
                  >
                    <span>{med}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveCondition(idx)}
                      className="hover:text-white"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Section 6: Emergency & Reporter Contact */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div>
              <label className="block text-slate-400 mb-1 text-xs flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-rose-400" />
                <span>Contact Mobile Number</span>
              </label>
              <input
                type="tel"
                value={reporterPhone}
                onChange={(e) => setReporterPhone(e.target.value)}
                placeholder="e.g. +1 (555) 234-5678"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500 text-xs"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 text-xs flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>Email Address (Optional)</span>
              </label>
              <input
                type="email"
                value={reporterEmail}
                onChange={(e) => setReporterEmail(e.target.value)}
                placeholder="e.g. reporter@example.com (Optional)"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500 text-xs"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 text-xs">Emergency Agency</label>
              <input
                type="text"
                value={investigatingAgency}
                onChange={(e) => setInvestigatingAgency(e.target.value)}
                placeholder="e.g. Regional Search & Rescue"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500 text-xs"
              />
            </div>
          </div>

          {/* Modal Footer Controls */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 font-semibold transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold transition flex items-center gap-2 shadow-lg shadow-blue-950/50"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'Saving...' : 'Save & Sync Case Details'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
