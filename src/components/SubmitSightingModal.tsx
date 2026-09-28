import React, { useState, useRef, useEffect } from 'react';
import { MissingPerson, SightingLead, CurrentUser } from '../types';
import { Camera, Upload, Eye, X, CheckCircle2, AlertTriangle, Sparkles, RefreshCw, Eraser, Check, Video, VideoOff, Phone, Mail } from 'lucide-react';

interface SubmitSightingModalProps {
  isOpen: boolean;
  onClose: () => void;
  missingPersons: MissingPerson[];
  onSubmitLead: (lead: SightingLead) => void;
  currentUser?: CurrentUser;
  preselectedPersonId?: string;
}

export const SubmitSightingModal: React.FC<SubmitSightingModalProps> = ({
  isOpen,
  onClose,
  missingPersons,
  onSubmitLead,
  currentUser,
  preselectedPersonId,
}) => {
  const [selectedPersonId, setSelectedPersonId] = useState<string>(preselectedPersonId || '');
  const [locationName, setLocationName] = useState('');
  const [notes, setNotes] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [reporterName, setReporterName] = useState(currentUser?.role === 'PUBLIC_USER' ? '' : (currentUser?.name || ''));
  const [contactNumber, setContactNumber] = useState('');
  const [contactEmail, setContactEmail] = useState(currentUser?.email || '');
  const [isVerifying, setIsVerifying] = useState(false);
  const [aiPreview, setAiPreview] = useState<any | null>(null);
  const [clearFeedback, setClearFeedback] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const nativeCameraInputRef = useRef<HTMLInputElement | null>(null);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setCameraLoading(false);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  useEffect(() => {
    if (preselectedPersonId) {
      setSelectedPersonId(preselectedPersonId);
    }
  }, [preselectedPersonId]);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
    }
  }, [isOpen]);

  const handleVideoRef = (el: HTMLVideoElement | null) => {
    videoRef.current = el;
    if (el && streamRef.current) {
      el.srcObject = streamRef.current;
      el.play().catch((err) => console.log('Modal video play error:', err));
    }
  };

  const startCamera = async (facing?: 'environment' | 'user') => {
    const targetFacing = typeof facing === 'string' ? facing : cameraFacing;
    setCameraLoading(true);
    stopCamera();

    let stream: MediaStream | null = null;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: targetFacing }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
    } catch {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      } catch (err) {
        console.error('Camera failed in modal:', err);
        setCameraLoading(false);
        return;
      }
    }

    if (stream) {
      streamRef.current = stream;
      setIsCameraActive(true);
      setCameraLoading(false);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(console.warn);
      }
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video) return;
    const width = video.videoWidth || video.clientWidth || 1280;
    const height = video.videoHeight || video.clientHeight || 720;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, width, height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
      setPhotoUrl(dataUrl);
      setAiPreview(null);
      stopCamera();
    }
  };

  // Wipes all input fields completely empty to start typing fresh details
  const handleClearSlate = () => {
    setSelectedPersonId('');
    setLocationName('');
    setNotes('');
    setPhotoUrl(null);
    setContactNumber('');
    setContactEmail('');
    setReporterName(currentUser?.role === 'PUBLIC_USER' ? '' : (currentUser?.name || ''));
    setAiPreview(null);
    setClearFeedback(true);
    stopCamera();
    setTimeout(() => setClearFeedback(false), 3000);
  };

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setPhotoUrl(event.target.result as string);
          setAiPreview(null);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRunVerification = async () => {
    if (!photoUrl && !notes) return;
    setIsVerifying(true);

    try {
      const response = await fetch('/api/analyze-sighting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sightingImage: photoUrl,
          sightingNotes: notes,
          targetPersonId: selectedPersonId || null,
          candidateProfiles: missingPersons,
        }),
      });

      const data = await response.json();
      setAiPreview(data);
      if (data.matchedPersonId && !selectedPersonId) {
        setSelectedPersonId(data.matchedPersonId);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const matched = missingPersons.find((p) => p.id === selectedPersonId);

    const contactStr = [
      contactNumber.trim() ? `Mobile: ${contactNumber.trim()}` : '',
      contactEmail.trim() ? `Email: ${contactEmail.trim()}` : '',
    ].filter(Boolean).join(' | ') || contactNumber.trim() || 'Online Sighting Desk';

    const newLead: SightingLead = {
      id: `LEAD-${Math.floor(1000 + Math.random() * 9000)}`,
      personId: matched?.id,
      personName: matched?.name || 'Unspecified Case',
      timestamp: new Date().toISOString(),
      locationName: locationName || 'Reported Location',
      lat: matched?.lastSeenLocation.lat || 38.75,
      lng: matched?.lastSeenLocation.lng || -121.28,
      notes: notes || 'Bystander community sighting reported.',
      photoUrl: photoUrl || undefined,
      confidenceScore: aiPreview?.overallConfidence || 75,
      matchAnalysis: aiPreview || undefined,
      status: aiPreview?.overallConfidence >= 80 ? 'High Priority' : 'Pending Review',
      reportedBy: reporterName || 'Community Bystander',
      contactNumber: contactStr,
      contactEmail: contactEmail.trim() || undefined,
    };

    onSubmitLead(newLead);
    // Remove old details and wipe slate empty so new details can be typed
    handleClearSlate();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl relative max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-600/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Submit Sighting Lead</h2>
              <p className="text-xs text-slate-400">
                Report an eyewitness tip with instant AI cross-examination against active alerts.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleClearSlate}
              title="Clear all fields to type fresh new details"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold transition"
            >
              <Eraser className="w-3.5 h-3.5 text-amber-400" />
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
            <span><strong>Slate Emptied:</strong> Previous sighting details removed. Ready for new input!</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Missing Person Association */}
          <div>
            <label className="block text-slate-400 mb-1">Who do you believe you saw?</label>
            <select
              value={selectedPersonId}
              onChange={(e) => setSelectedPersonId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-rose-500"
            >
              <option value="">I'm not sure / Match automatically via AI</option>
              {missingPersons.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.alertType} - Age {p.age})
                </option>
              ))}
            </select>
          </div>

          {/* Photo Capture & Live Camera Access */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-slate-400 font-medium">Photo Evidence of Sighting</label>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    if (isCameraActive) stopCamera();
                    else startCamera();
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition ${
                    isCameraActive
                      ? 'bg-rose-600 text-white'
                      : 'bg-slate-800 hover:bg-slate-700 text-rose-300'
                  }`}
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>{isCameraActive ? 'Close Camera' : 'Live Camera'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    stopCamera();
                    fileInputRef.current?.click();
                  }}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-800 hover:bg-slate-700 text-blue-300 flex items-center gap-1 transition"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload</span>
                </button>
              </div>
            </div>

            {isCameraActive || cameraLoading ? (
              <div className="relative rounded-xl overflow-hidden aspect-video bg-black border-2 border-rose-500/60 flex items-center justify-center">
                <video
                  ref={handleVideoRef}
                  playsInline
                  autoPlay
                  muted
                  className="w-full h-full object-cover"
                />
                {cameraLoading ? (
                  <div className="absolute inset-0 bg-slate-950/80 flex flex-col items-center justify-center p-4">
                    <RefreshCw className="w-6 h-6 text-rose-400 animate-spin mb-2" />
                    <span className="text-xs text-slate-300 font-medium">Opening camera...</span>
                  </div>
                ) : (
                  <div className="absolute bottom-3 inset-x-0 flex items-center justify-center gap-2 px-4 pointer-events-auto">
                    <button
                      type="button"
                      onClick={capturePhoto}
                      className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg active:scale-95"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Capture Photo</span>
                    </button>
                    <button
                      type="button"
                      onClick={stopCamera}
                      className="px-3 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            ) : photoUrl ? (
              <div className="relative rounded-xl overflow-hidden aspect-video bg-slate-950 border border-slate-800 group">
                <img src={photoUrl} alt="Sighting" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setPhotoUrl(null)}
                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-slate-900/80 text-white hover:bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="absolute bottom-2 left-2 bg-slate-900/90 text-emerald-300 text-[10px] px-2 py-0.5 rounded border border-emerald-500/30 flex items-center gap-1">
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span>Photo Ready</span>
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-800 hover:border-amber-500/50 rounded-xl p-5 text-center cursor-pointer bg-slate-950/60"
              >
                <div className="flex items-center justify-center gap-2 mb-1.5 text-slate-400">
                  <Video className="w-5 h-5 text-rose-400" />
                  <Upload className="w-5 h-5 text-blue-400" />
                </div>
                <span className="text-slate-300 font-medium block">Click to upload photo or use Live Camera above</span>
                <span className="text-[10px] text-slate-500">Supports JPG, PNG, WEBP</span>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            <input
              ref={nativeCameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>

          {/* Location & Time */}
          <div>
            <label className="block text-slate-400 mb-1">Sighting Location / Cross Streets *</label>
            <input
              required
              type="text"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              placeholder="e.g. Douglas Blvd bus shelter near Safeway"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-rose-500"
            />
          </div>

          {/* Eyewitness Notes */}
          <div>
            <label className="block text-slate-400 mb-1">What did you observe? *</label>
            <textarea
              required
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Describe clothing, emotional state, companion individuals, direction of travel..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 resize-none"
            />
          </div>

          {/* Optional Instant AI Check */}
          {(photoUrl || notes) && (
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5 text-xs">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Multimodal AI Case Correlation
                </span>
                <button
                  type="button"
                  onClick={handleRunVerification}
                  disabled={isVerifying}
                  className="px-3 py-1.5 rounded-lg bg-amber-600/20 text-amber-300 border border-amber-500/30 hover:bg-amber-600/30 transition text-xs font-semibold flex items-center gap-1.5 disabled:opacity-60"
                >
                  {isVerifying ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{isVerifying ? 'Cross-Referencing...' : 'Run Multimodal AI Match'}</span>
                </button>
              </div>

              {isVerifying && (
                <div className="pt-2 pb-1 space-y-1 text-xs">
                  <div className="flex justify-between text-slate-400 text-[11px]">
                    <span>Scanning evidence against {missingPersons.length} case dossiers...</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-amber-500 to-rose-500 rounded-full animate-pulse w-3/4" />
                  </div>
                </div>
              )}

              {aiPreview && !isVerifying && (
                <div className="pt-2 text-xs space-y-1.5 text-slate-300 border-t border-slate-800 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    {aiPreview.matchedPersonId && aiPreview.overallConfidence >= 50 ? (
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Match Found: {aiPreview.matchedPersonName} ({aiPreview.overallConfidence}%)</span>
                      </span>
                    ) : (
                      <span className="text-amber-400 font-semibold flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>No Match Found ({aiPreview.overallConfidence || 0}% Confidence)</span>
                      </span>
                    )}
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                      {aiPreview.matchedPersonId && aiPreview.overallConfidence >= 50 ? 'Correlated Case' : 'Unlinked Tip'}
                    </span>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    {aiPreview.suggestedAction || aiPreview.facialMatchAssessment}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Reporter Contact Info */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <span className="font-semibold text-slate-300 block text-xs">
              Reporter Identification & Callback Details
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-400 mb-1 text-xs">Your Name / Organization</label>
                <input
                  type="text"
                  value={reporterName}
                  onChange={(e) => setReporterName(e.target.value)}
                  placeholder="e.g. Store Clerk, Bystander"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 text-xs flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3 text-amber-400" />
                    <span>Contact Mobile Number</span>
                  </span>
                </label>
                <input
                  type="tel"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  placeholder="e.g. +1 (555) 234-5678"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 text-xs flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Mail className="w-3 h-3 text-slate-400" />
                    <span>Email Address (Optional)</span>
                  </span>
                </label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="e.g. witness@example.com (Optional)"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <p className="text-[11px] text-slate-400">
              💡 <strong>Tip details:</strong> Contact mobile number allows search coordinators to verify your sighting. Email is strictly optional (fill or leave blank).
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={handleClearSlate}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold transition"
              title="Remove all text and leave empty slate to type new details"
            >
              <Eraser className="w-3.5 h-3.5 text-amber-400" />
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
                className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold shadow-md shadow-amber-950/40 transition active:scale-95"
              >
                Submit Lead to Incident Command
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
