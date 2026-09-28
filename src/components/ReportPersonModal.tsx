import React, { useState } from 'react';
import { MissingPerson, AlertType, CurrentUser } from '../types';
import { ShieldAlert, Upload, Plus, X, AlertTriangle, UserCheck, Eraser, RotateCcw, Check, Phone, Mail } from 'lucide-react';

interface ReportPersonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (newPerson: MissingPerson) => void;
  currentUser?: CurrentUser;
}

export const ReportPersonModal: React.FC<ReportPersonModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  currentUser,
}) => {
  const [name, setName] = useState('');
  const [age, setAge] = useState<number | ''>(25);
  const [gender, setGender] = useState<'Female' | 'Male' | 'Non-Binary' | 'Other'>('Female');
  const [alertType, setAlertType] = useState<AlertType>('ENDANGERED');
  const [photoUrl, setPhotoUrl] = useState('');
  const [clothing, setClothing] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [hair, setHair] = useState('');
  const [eyes, setEyes] = useState('');
  const [distinguishingMarks, setDistinguishingMarks] = useState('');
  const [locationName, setLocationName] = useState('');
  const [address, setAddress] = useState('');
  const [medicalConditionInput, setMedicalConditionInput] = useState('');
  const [medicalConditions, setMedicalConditions] = useState<string[]>([]);
  const [summary, setSummary] = useState('');
  const [investigatingAgency, setInvestigatingAgency] = useState(
    currentUser?.role === 'PUBLIC_USER' ? '' : (currentUser?.agency || 'Roseville Police Dept')
  );
  const [emergencyContact, setEmergencyContact] = useState(
    currentUser?.role === 'PUBLIC_USER' ? '' : (currentUser?.agency || 'Roseville Police Dept')
  );
  
  // Submitter / Citizen Reporter Info
  const [reporterName, setReporterName] = useState(
    currentUser?.role === 'PUBLIC_USER' ? '' : (currentUser?.name || '')
  );
  const [reporterPhone, setReporterPhone] = useState('');
  const [reporterEmail, setReporterEmail] = useState(currentUser?.email || '');
  const [reporterRelation, setReporterRelation] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [clearFeedback, setClearFeedback] = useState(false);

  // Wipes all fields completely clean to an empty slate
  const handleClearSlate = () => {
    setName('');
    setAge('');
    setGender('Female');
    setAlertType('ENDANGERED');
    setPhotoUrl('');
    setClothing('');
    setHeight('');
    setWeight('');
    setHair('');
    setEyes('');
    setDistinguishingMarks('');
    setLocationName('');
    setAddress('');
    setMedicalConditionInput('');
    setMedicalConditions([]);
    setSummary('');
    setInvestigatingAgency(currentUser?.role === 'PUBLIC_USER' ? '' : (currentUser?.agency || ''));
    setEmergencyContact(currentUser?.role === 'PUBLIC_USER' ? '' : (currentUser?.agency || ''));
    setReporterName(currentUser?.role === 'PUBLIC_USER' ? '' : (currentUser?.name || ''));
    setReporterPhone('');
    setReporterEmail('');
    setReporterRelation('');
    setValidationError(null);
    setClearFeedback(true);
    setTimeout(() => setClearFeedback(false), 3000);
  };

  if (!isOpen) return null;

  const handleAddCondition = () => {
    if (medicalConditionInput.trim()) {
      setMedicalConditions([...medicalConditions, medicalConditionInput.trim()]);
      setMedicalConditionInput('');
    }
  };

  const handleRemoveCondition = (index: number) => {
    setMedicalConditions(medicalConditions.filter((_, i) => i !== index));
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
    setValidationError(null);

    if (!name.trim()) {
      setValidationError("Please enter the missing person's name.");
      return;
    }

    // Contact mobile number is required to submit the report; email is strictly optional
    if (!reporterPhone.trim()) {
      setValidationError("Please enter your Contact Mobile Number in the reporter details. Contact number is required to submit so SAR coordinators can reach you immediately if your loved one is sighted. (Email is strictly optional).");
      return;
    }

    const isPublic = currentUser?.role === 'PUBLIC_USER';
    const trackingCode = `MP-PUB-${Math.floor(10000 + Math.random() * 90000)}`;

    const formattedContact = [
      reporterPhone.trim() ? `Mobile: ${reporterPhone.trim()}` : '',
      reporterEmail.trim() ? `Email: ${reporterEmail.trim()}` : '',
    ].filter(Boolean).join(' | ') || reporterPhone.trim();

    const newPerson: MissingPerson = {
      id: `MP-2026-${Math.floor(100 + Math.random() * 900)}`,
      name: name.trim(),
      age: Number(age) || 25,
      gender,
      alertType,
      missingSince: new Date().toISOString(),
      lastSeenLocation: {
        name: locationName || 'Central Roseville',
        lat: 38.75 + (Math.random() - 0.5) * 0.04,
        lng: -121.28 + (Math.random() - 0.5) * 0.04,
        address: address || 'Roseville, CA',
      },
      photoUrl:
        photoUrl ||
        'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80',
      clothingLastSeen: clothing.trim() || 'Not specified',
      physicalDescription: {
        height: height.trim() || 'Not specified',
        weight: weight.trim() || 'Not specified',
        hair: hair.trim() || 'Not specified',
        eyes: eyes.trim() || 'Not specified',
        distinguishingMarks: distinguishingMarks.trim() || 'None reported',
      },
      medicalConditions: medicalConditions || [],
      riskLevel: alertType === 'AMBER' || alertType === 'SILVER' ? 'Extreme' : 'High',
      caseNumber: `CA-ROS-26-${Math.floor(4500 + Math.random() * 500)}`,
      investigatingAgency: investigatingAgency || 'Regional Law Enforcement',
      emergencyContact: emergencyContact || investigatingAgency || 'Regional Law Enforcement',
      summary: summary || 'Subject reported missing. Search operations active.',
      searchRadiusKm: alertType === 'AMBER' ? 10.0 : 4.0,
      status: 'Active',
      isVerified: !isPublic,
      verifiedBy: !isPublic ? `${currentUser?.name} (${currentUser?.badgeNumber || 'SAR'})` : undefined,
      verifiedAt: !isPublic ? new Date().toISOString() : undefined,
      verificationNotes: !isPublic 
        ? 'Direct law enforcement intake registration.' 
        : 'Report registered via Public Safety Reporting Desk. Awaiting investigator verification.',
      reportedByRole: currentUser?.role || 'PUBLIC_USER',
      reportedByName: reporterName.trim() || currentUser?.name || 'Citizen Reporter',
      reportedByUserId: currentUser?.id,
      reportedByUserEmail: reporterEmail.trim() || currentUser?.email,
      reporterContact: formattedContact,
      reporterPhone: reporterPhone.trim(),
      reporterEmail: reporterEmail.trim(),
      reporterRelation: reporterRelation.trim() || 'Family / Relative',
      publicTrackingCode: trackingCode,
      publicStatusStage: isPublic ? 'REPORTED' : 'SEARCH_IN_PROGRESS',
      isPubliclyDispatched: true,
    };

    onSubmit(newPerson);
    // Remove old details and wipe slate empty so new details can be entered cleanly
    handleClearSlate();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl relative max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-600/20 text-rose-400 flex items-center justify-center border border-rose-500/30">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Report Missing Person</h2>
              <p className="text-xs text-slate-400">
                Register a new case dossier into the FindSafe AI Detection and Alert Network.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleClearSlate}
              title="Clear all fields to enter new details"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold transition"
            >
              <Eraser className="w-3.5 h-3.5 text-rose-400" />
              <span>Clear Slate</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {clearFeedback && (
          <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-600/60 text-emerald-200 text-xs flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span><strong>Slate Emptied:</strong> Previous details removed. All fields are clear and ready to type new details!</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Alert Type Selection */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1.5">
              Emergency Alert Category
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'AMBER', label: 'Amber (Child)' },
                { id: 'SILVER', label: 'Silver (Senior)' },
                { id: 'CRITICAL_MEDICAL', label: 'Medical Risk' },
                { id: 'ENDANGERED', label: 'Endangered' },
              ].map((item) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => setAlertType(item.id as AlertType)}
                  className={`py-2 px-3 rounded-xl border text-center font-medium transition ${
                    alertType === item.id
                      ? 'bg-rose-600 border-rose-500 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Basic Demographics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-400 mb-1">Full Legal Name *</label>
              <input
                required
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Missing Person Legal Name"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-rose-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Age</label>
              <input
                type="number"
                min={0}
                max={120}
                value={age}
                onChange={(e) => setAge(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="e.g. 25 (Optional)"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-rose-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Gender</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-rose-500"
              >
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Non-Binary">Non-Binary</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Photo Upload */}
          <div>
            <label className="block text-slate-400 mb-1">Recent Clear Photograph</label>
            <div className="flex items-center gap-3">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="text-slate-400 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:bg-slate-800 file:text-slate-200 hover:file:bg-slate-700"
              />
              {photoUrl && (
                <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-700">
                  <img src={photoUrl} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          </div>

          {/* Last Seen Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 mb-1">Last Seen Landmark / Location</label>
              <input
                type="text"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder="e.g., Central Park Trailhead, Transit Plaza (or leave blank)"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-rose-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Street Address or Cross Streets</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g., 500 Main St, Roseville, CA"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>

          {/* Clothing & Physical */}
          <div>
            <label className="block text-slate-400 mb-1">Clothing & Personal Items Last Seen</label>
            <input
              type="text"
              value={clothing}
              onChange={(e) => setClothing(e.target.value)}
              placeholder="e.g. Red windbreaker, blue jeans, white sneakers, carrying yellow backpack"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-rose-500"
            />
          </div>

          {/* Physical Description (Optional) */}
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300">Physical Characteristics (Optional)</span>
              <span className="text-[10px] text-slate-500 font-mono">Fill or not fill — report will submit either way</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-slate-400 mb-1 flex items-center justify-between">
                  <span>Height</span>
                  <span className="text-[10px] text-slate-500 font-normal">Optional</span>
                </label>
                <input
                  type="text"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  placeholder="e.g. 5'7 (Optional)"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-rose-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1 flex items-center justify-between">
                  <span>Weight</span>
                  <span className="text-[10px] text-slate-500 font-normal">Optional</span>
                </label>
                <input
                  type="text"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="e.g. 140 lbs (Optional)"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-rose-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1 flex items-center justify-between">
                  <span>Hair</span>
                  <span className="text-[10px] text-slate-500 font-normal">Optional</span>
                </label>
                <input
                  type="text"
                  value={hair}
                  onChange={(e) => setHair(e.target.value)}
                  placeholder="e.g. Brown (Optional)"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-rose-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1 flex items-center justify-between">
                  <span>Eyes</span>
                  <span className="text-[10px] text-slate-500 font-normal">Optional</span>
                </label>
                <input
                  type="text"
                  value={eyes}
                  onChange={(e) => setEyes(e.target.value)}
                  placeholder="e.g. Hazel (Optional)"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>
          </div>

          {/* Medical Conditions (Optional Slate) */}
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <label className="block text-slate-300 font-semibold flex items-center gap-1.5">
                <span>Critical Medical Needs & Conditions</span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400 font-normal border border-slate-700">
                  Optional Choice
                </span>
              </label>
              <span className="text-[10px] text-slate-500">Fill or not fill — report will submit either way</span>
            </div>

            <p className="text-[11px] text-slate-400">
              Only add if subject has known memory loss, diabetes, cardiac conditions, or critical medication needs. If none or unknown, you can leave this blank.
            </p>

            {/* Quick condition chips for optional one-tap selection */}
            <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
              <span className="text-slate-500 text-[10px] font-medium mr-0.5">Quick Suggestions:</span>
              {[
                "Alzheimer's / Dementia",
                "Insulin Dependent Diabetic",
                "Severe Allergies (EpiPen)",
                "Daily Cardiac Medication",
                "Autism Spectrum / Non-Verbal"
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => {
                    if (!medicalConditions.includes(suggestion)) {
                      setMedicalConditions([...medicalConditions, suggestion]);
                    }
                  }}
                  className={`px-2 py-0.5 rounded-md border text-[11px] transition ${
                    medicalConditions.includes(suggestion)
                      ? 'bg-rose-950/80 border-rose-600 text-rose-300 font-semibold'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  + {suggestion}
                </button>
              ))}
            </div>

            <div className="flex gap-2 pt-1">
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
                placeholder="Type custom condition (e.g. Asthma, Seizure disorder)..."
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-rose-500"
              />
              <button
                type="button"
                onClick={handleAddCondition}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl flex items-center gap-1 font-medium transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>

            {medicalConditions.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {medicalConditions.map((cond, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-1.5"
                  >
                    <span>{cond}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveCondition(i)}
                      className="text-slate-400 hover:text-white"
                      title="Remove condition"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <div className="text-[11px] text-slate-500 italic py-0.5">
                No medical conditions listed (Optional — report is ready to submit without conditions).
              </div>
            )}
          </div>

          {/* Incident Narrative */}
          <div>
            <label className="block text-slate-400 mb-1">Incident Summary & Circumstances</label>
            <textarea
              rows={2}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Provide context regarding how and where the person disappeared..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 resize-none"
            />
          </div>

          {/* Submitter & Verification Notice */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <div className="flex items-center gap-2 text-slate-300 font-semibold text-sm">
                <UserCheck className="w-4 h-4 text-rose-400" />
                <span>Reporting Party & Contact Information</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] font-mono">
                <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  Mobile: Required *
                </span>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                  Email: Optional
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-slate-400 mb-1 text-xs">Your Name / Guardian (Optional)</label>
                <input
                  type="text"
                  value={reporterName}
                  onChange={(e) => setReporterName(e.target.value)}
                  placeholder="e.g. Reporter Full Name"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 text-xs flex items-center justify-between">
                  <span className="flex items-center gap-1 font-medium text-slate-300">
                    <Phone className="w-3.5 h-3.5 text-rose-400" />
                    <span>Contact Mobile Number <span className="text-rose-400 font-bold">*</span></span>
                  </span>
                  <span className="text-[10px] text-rose-400 font-semibold uppercase">Required</span>
                </label>
                <input
                  type="tel"
                  required
                  value={reporterPhone}
                  onChange={(e) => {
                    setReporterPhone(e.target.value);
                    if (validationError) setValidationError(null);
                  }}
                  placeholder="e.g. +1 (555) 234-5678"
                  className={`w-full bg-slate-900 border rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none ${
                    !reporterPhone.trim() && validationError
                      ? 'border-rose-500 ring-1 ring-rose-500/50'
                      : 'border-slate-800 focus:border-rose-500'
                  }`}
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 text-xs flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>Email Address</span>
                  </span>
                  <span className="text-[10px] text-slate-500">Optional</span>
                </label>
                <input
                  type="email"
                  value={reporterEmail}
                  onChange={(e) => setReporterEmail(e.target.value)}
                  placeholder="e.g. contact@domain.com (Optional)"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 text-xs">Relationship</label>
                <input
                  type="text"
                  value={reporterRelation}
                  onChange={(e) => setReporterRelation(e.target.value)}
                  placeholder="Parent, Spouse, Friend..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] space-y-1">
              <p className="text-slate-300 flex items-start gap-1.5">
                <span className="text-rose-400 font-bold shrink-0">📱 Contact Mobile Number:</span>
                <span>Enter your mobile phone number to submit the report so rescue teams and detectives can reach you immediately if sightings or clues are found.</span>
              </p>
              <p className="text-slate-400 flex items-start gap-1.5">
                <span className="text-emerald-400 font-semibold shrink-0">✉️ Email Address:</span>
                <span>Strictly optional — whether you fill it or leave it blank, your report will be submitted successfully once your contact mobile number is provided.</span>
              </p>
            </div>

            <p className="text-[11px] text-slate-400">
              {currentUser?.role === 'PUBLIC_USER' 
                ? 'Your report will be assigned a private tracking reference code and queued for immediate detective triage.'
                : `Official law enforcement intake under badge #${currentUser?.badgeNumber || 'SAR'}.`}
            </p>
          </div>

          {/* Validation Error Banner */}
          {validationError && (
            <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-600 text-rose-200 text-xs flex items-center gap-2 animate-in fade-in">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Submit & Reset Actions */}
          <div className="pt-2">
            <p className="text-[11px] text-slate-400 mb-2">
              💡 <strong>Submission criteria:</strong> Contact mobile number is required to submit so responders can contact you. Height, weight, medical conditions, and email address are optional choices — you can fill or leave them blank, and your report will be submitted successfully either way.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={handleClearSlate}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold transition"
              title="Remove all text and leave empty slate to type new details"
            >
              <Eraser className="w-3.5 h-3.5 text-rose-400" />
              <span>Clear Slate / Empty Fields</span>
            </button>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold shadow-lg shadow-rose-950/40 transition active:scale-95"
              >
                {currentUser?.role === 'PUBLIC_USER' ? 'Submit Emergency Missing Report' : 'Publish Case to Network'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
