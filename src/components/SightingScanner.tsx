import React, { useState, useRef, useEffect } from 'react';
import { MissingPerson, SightingLead, CurrentUser } from '../types';
import { 
  Camera, Upload, Sparkles, CheckCircle2, AlertTriangle, ShieldCheck, 
  RefreshCw, Scan, ArrowRight, MapPin, User, FileText, X, Video, VideoOff,
  Eraser, RotateCcw, Check, ShieldAlert, XCircle, Activity
} from 'lucide-react';

interface SightingScannerProps {
  missingPersons: MissingPerson[];
  onLeadVerified: (lead: SightingLead) => void;
  onSelectPerson: (person: MissingPerson) => void;
  preselectedPersonId?: string;
  isPublicCitizen?: boolean;
  currentUser?: CurrentUser;
}

export const SightingScanner: React.FC<SightingScannerProps> = ({
  missingPersons,
  onLeadVerified,
  onSelectPerson,
  preselectedPersonId,
  isPublicCitizen = false,
  currentUser,
}) => {
  const [selectedPersonId, setSelectedPersonId] = useState<string>(preselectedPersonId || 'ALL');
  const [sightingImage, setSightingImage] = useState<string | null>(null);
  const [sightingNotes, setSightingNotes] = useState<string>('');
  const [locationName, setLocationName] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisProgress, setAnalysisProgress] = useState<number>(0);
  const [analysisStageText, setAnalysisStageText] = useState<string>('');
  const [analysisResult, setAnalysisResult] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraLoading, setCameraLoading] = useState<boolean>(false);
  const [cameraReady, setCameraReady] = useState<boolean>(false);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [photoCaptureFeedback, setPhotoCaptureFeedback] = useState<boolean>(false);
  const [leadLogged, setLeadLogged] = useState<boolean>(false);

  // Resets all scan inputs to an empty slate
  const handleClearSlate = () => {
    setSightingImage(null);
    setSightingNotes('');
    setLocationName('');
    setAnalysisResult(null);
    setErrorMsg(null);
    setPhotoCaptureFeedback(false);
    setLeadLogged(false);
    stopCamera();
  };

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const nativeCameraInputRef = useRef<HTMLInputElement | null>(null);

  // Update selected person if prop changes
  useEffect(() => {
    if (preselectedPersonId) {
      setSelectedPersonId(preselectedPersonId);
    }
  }, [preselectedPersonId]);

  // Clean up camera stream when unmounting or stopping
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  // Ensure stream is connected whenever camera becomes active or video mounts
  useEffect(() => {
    if (isCameraActive && videoRef.current && streamRef.current) {
      const video = videoRef.current;
      video.srcObject = streamRef.current;
      video
        .play()
        .then(() => setCameraReady(true))
        .catch((err) => console.log('Video play error on state update:', err));
    }
  }, [isCameraActive]);

  // Callback ref to guarantee immediate assignment as soon as video element attaches to DOM
  const handleVideoRef = (el: HTMLVideoElement | null) => {
    videoRef.current = el;
    if (el && streamRef.current) {
      el.srcObject = streamRef.current;
      el
        .play()
        .then(() => setCameraReady(true))
        .catch((err) => console.log('Video play error on mount:', err));
    }
  };

  const startCamera = async (facing?: 'environment' | 'user') => {
    const targetFacing = typeof facing === 'string' ? facing : cameraFacing;
    setCameraLoading(true);
    setCameraReady(false);
    setErrorMsg(null);
    stopCamera();

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraLoading(false);
      setErrorMsg(
        'Direct live camera streaming is not supported by this browser. Please use "Open Device Camera" or "Upload Photo".'
      );
      return;
    }

    let stream: MediaStream | null = null;
    try {
      // Primary attempt: preferred facing mode with optimal dimensions
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: targetFacing },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
    } catch (firstErr: any) {
      console.warn('Preferred camera constraints failed, attempting fallback...', firstErr);
      try {
        // Fallback 1: preferred facing mode without strict resolution
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: targetFacing },
          audio: false,
        });
      } catch (secondErr: any) {
        console.warn('Facing mode constraint failed, attempting generic video...', secondErr);
        try {
          // Fallback 2: unconstrained generic video (compatible with desktop/laptop webcams)
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
        } catch (fallbackErr: any) {
          console.error('All camera access attempts failed:', fallbackErr);
          setCameraLoading(false);
          setErrorMsg(
            fallbackErr.name === 'NotAllowedError' || fallbackErr.name === 'PermissionDeniedError'
              ? 'Camera permission was denied in your browser settings. Please allow camera permissions, or use "Open Device Camera" / "Upload Photo".'
              : 'Unable to open camera on this device. Please use "Open Device Camera" or "Upload Photo".'
          );
          return;
        }
      }
    }

    if (stream) {
      streamRef.current = stream;
      setIsCameraActive(true);
      setCameraLoading(false);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current
          .play()
          .then(() => setCameraReady(true))
          .catch((err) => console.log('Video play error:', err));
      }
    }
  };

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
    setCameraReady(false);
  };

  const toggleCameraFacing = async () => {
    const nextFacing = cameraFacing === 'environment' ? 'user' : 'environment';
    setCameraFacing(nextFacing);
    await startCamera(nextFacing);
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video) {
      setErrorMsg('Camera stream not ready yet.');
      return;
    }

    // Capture at high resolution using video dimensions or sensible fallback
    const width = video.videoWidth || video.clientWidth || 1280;
    const height = video.videoHeight || video.clientHeight || 720;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      if (cameraFacing === 'user') {
        ctx.translate(width, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(video, 0, 0, width, height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
      setSightingImage(dataUrl);
      setAnalysisResult(null);
      setLeadLogged(false);
      setPhotoCaptureFeedback(true);
      setTimeout(() => setPhotoCaptureFeedback(false), 5000);
      stopCamera();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setSightingImage(event.target.result as string);
        setAnalysisResult(null);
        setLeadLogged(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const runAiAnalysis = async () => {
    if (!isPublicCitizen) {
      if (!sightingImage) {
        setErrorMsg('Please upload a photo or capture an image to search for matches across all active cases.');
        return;
      }
    } else {
      if (!sightingImage && !sightingNotes) {
        setErrorMsg('Please upload a photo, capture from camera, or enter eyewitness sighting notes.');
        return;
      }
    }

    setIsAnalyzing(true);
    setAnalysisProgress(12);
    setAnalysisStageText('Initializing multimodal neural vision pipeline...');
    setErrorMsg(null);
    setAnalysisResult(null);
    setLeadLogged(false);

    let progressVal = 12;
    const progressTimer = setInterval(() => {
      progressVal += 12;
      if (progressVal >= 92) {
        progressVal = 92;
        setAnalysisStageText('Synthesizing tactical match dossier & confidence score...');
      } else if (progressVal >= 68) {
        setAnalysisStageText('Evaluating facial geometry, apparel patterns & visual tags...');
      } else if (progressVal >= 42) {
        setAnalysisStageText(`Cross-referencing ${missingPersons.length} active case dossiers in registry...`);
      } else if (progressVal >= 24) {
        setAnalysisStageText('Scanning photographic features & extracting biometric contours...');
      }
      setAnalysisProgress(progressVal);
    }, 400);

    try {
      const response = await fetch('/api/analyze-sighting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sightingImage,
          sightingNotes: isPublicCitizen
            ? sightingNotes
            : 'Field evidence photograph submitted for cross-case biometric match against all active dossiers.',
          targetPersonId: selectedPersonId === 'ALL' ? null : selectedPersonId,
          candidateProfiles: missingPersons,
        }),
      });

      clearInterval(progressTimer);
      setAnalysisProgress(98);
      setAnalysisStageText('Finalizing multi-point verification report...');

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const data = await response.json();
      setAnalysisProgress(100);
      setAnalysisResult(data);
    } catch (err: any) {
      clearInterval(progressTimer);
      console.error('Analysis error:', err);
      setErrorMsg(err.message || 'Error communicating with AI Vision model.');
    } finally {
      clearInterval(progressTimer);
      setTimeout(() => {
        setIsAnalyzing(false);
      }, 350);
    }
  };

  // Strictly identify a registered case ONLY if the AI match identified a valid person ID
  const matchedPerson = (analysisResult && analysisResult.matchedPersonId)
    ? (missingPersons.find((p) => p.id === analysisResult.matchedPersonId) || null)
    : null;

  const isMatchFound = Boolean(
    matchedPerson && (analysisResult?.overallConfidence === undefined || analysisResult.overallConfidence >= 50)
  );

  const handleLogOfficialLead = () => {
    if (!analysisResult) return;

    const newLead: SightingLead = {
      id: `LEAD-${Date.now().toString().slice(-4)}`,
      personId: matchedPerson?.id,
      personName: matchedPerson?.name || (isMatchFound ? 'Matched Subject' : 'Unlinked Community Sighting'),
      timestamp: new Date().toISOString(),
      locationName: isPublicCitizen
        ? (locationName || 'Reported Sighting Coordinate')
        : (matchedPerson?.lastSeenLocation.name || 'Field Photo Match Scan'),
      lat: matchedPerson?.lastSeenLocation.lat || 38.75,
      lng: matchedPerson?.lastSeenLocation.lng || -121.28,
      notes: isPublicCitizen
        ? (sightingNotes || (isMatchFound ? `Citizen sighting correlated with ${matchedPerson?.name}` : 'Citizen sighting reported (unlinked)'))
        : `Investigator photo search match against active registry. Resemblance: ${analysisResult.overallConfidence}%`,
      photoUrl: sightingImage || undefined,
      confidenceScore: analysisResult.overallConfidence || (isMatchFound ? 75 : 20),
      matchAnalysis: analysisResult,
      status: isMatchFound && (analysisResult.overallConfidence || 0) >= 80 ? 'High Priority' : 'Verified Match',
      reportedBy: isPublicCitizen
        ? `${currentUser?.name || 'Public Citizen'} (AI Vision Sighting)`
        : `${currentUser?.name || 'Investigator'} (AI Photo Match)`,
    };

    onLeadVerified(newLead);
    setLeadLogged(true);
  };

  return (
    <div className="space-y-6">
      {/* Module Title Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
              {isPublicCitizen ? 'PUBLIC CITIZEN AI MATCHER' : 'MULTIMODAL AI PHOTO SEARCH'}
            </span>
            <span className="text-xs text-slate-400 font-mono">Gemini 3.8 Flash Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            {isPublicCitizen ? 'Community AI Sighting Scanner & Matcher' : 'AI Photo Matcher & Registry Search'}
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            {isPublicCitizen
              ? 'Have you seen someone who might match an active missing alert? Upload a photograph or capture with your camera to run multimodal biometric and apparel correlation against active bulletins.'
              : 'Upload a photograph or capture camera evidence to automatically search across all active missing persons dossiers. Calculates biometric facial resemblance, apparel consistency, and immediate SAR response priorities.'}
          </p>
        </div>
      </div>

      {/* Main Grid: Input & Match Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Image/Camera Input & Metadata (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Scan className="w-4 h-4 text-rose-400" />
              <span>{isPublicCitizen ? 'Sighting Input Feed' : 'Photo Input & Registry Search'}</span>
            </h2>

            {/* Target Case Filter Selector */}
            <div>
              <label htmlFor="target-person-select" className="block text-xs font-medium text-slate-400 mb-1.5">
                {isPublicCitizen ? 'Target Profile to Verify' : 'Search Scope Across Active Registry'}
              </label>
              <select
                id="target-person-select"
                value={selectedPersonId}
                onChange={(e) => setSelectedPersonId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-rose-500"
              >
                <option value="ALL">Search All Active Profiles ({missingPersons.length} active cases)</option>
                {missingPersons.map((p) => (
                  <option key={p.id} value={p.id}>
                    Target: [{p.alertType}] {p.name} (Age {p.age}) - Case #{p.caseNumber}
                  </option>
                ))}
              </select>
            </div>

            {/* Two Distinct Photo Input Options: 1) Live Camera Access, 2) Upload Photo */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">
                  Sighting Photo Evidence Input:
                </label>
                <span className="text-[11px] text-slate-400">
                  {isCameraActive ? (
                    <span className="text-rose-400 font-medium flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping inline-block" /> Live Viewfinder Active
                    </span>
                  ) : sightingImage ? (
                    <span className="text-emerald-400 font-medium flex items-center gap-1">
                      <Check className="w-3 h-3" /> Image Loaded
                    </span>
                  ) : (
                    'Select Camera or File'
                  )}
                </span>
              </div>

              {/* Two Options Selector Tabs */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  id="btn-opt-live-camera"
                  onClick={() => {
                    if (!isCameraActive && !cameraLoading) {
                      startCamera();
                    }
                  }}
                  className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2.5 transition ${
                    isCameraActive || cameraLoading
                      ? 'bg-rose-600 text-white border-rose-500 shadow-lg shadow-rose-950/50 ring-2 ring-rose-500/40'
                      : 'bg-slate-950 hover:bg-slate-800/80 border-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  <Video className={`w-4 h-4 ${isCameraActive || cameraLoading ? 'text-white' : 'text-rose-400'}`} />
                  <div className="text-left">
                    <span className="block font-bold">Live Camera Access</span>
                    <span className={`text-[10px] block font-normal ${isCameraActive || cameraLoading ? 'text-rose-100' : 'text-slate-400'}`}>
                      {isCameraActive ? 'Viewfinder Live' : 'Open camera & snap live photo'}
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  id="btn-opt-upload-photo"
                  onClick={() => {
                    stopCamera();
                    fileInputRef.current?.click();
                  }}
                  className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2.5 transition ${
                    !isCameraActive && !cameraLoading && sightingImage
                      ? 'bg-blue-600/30 text-blue-200 border-blue-500 shadow-md ring-1 ring-blue-500/40'
                      : 'bg-slate-950 hover:bg-slate-800/80 border-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  <Upload className="w-4 h-4 text-blue-400" />
                  <div className="text-left">
                    <span className="block font-bold">Upload Photo</span>
                    <span className="text-[10px] text-slate-400 block font-normal">
                      Browse image file from device
                    </span>
                  </div>
                </button>
              </div>

              {/* Viewport Area: 1) Active Live Camera, 2) Loaded Photo Preview, 3) Ready to select upload/camera */}
              {isCameraActive || cameraLoading ? (
                <div className="relative rounded-2xl overflow-hidden bg-black border-2 border-rose-500/60 aspect-video flex items-center justify-center shadow-2xl shadow-rose-950/50">
                  {/* Real-time Video Stream */}
                  <video
                    ref={handleVideoRef}
                    playsInline
                    autoPlay
                    muted
                    className="w-full h-full object-cover"
                    onLoadedMetadata={(e) => {
                      const v = e.currentTarget;
                      v.play().then(() => setCameraReady(true)).catch((err) => console.log('Video play error:', err));
                    }}
                  />

                  {/* Camera Loading Overlay */}
                  {cameraLoading && (
                    <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center space-y-3 z-20">
                      <div className="relative">
                        <div className="w-14 h-14 rounded-full bg-rose-600/20 border-2 border-rose-500 flex items-center justify-center text-rose-400 animate-pulse">
                          <Camera className="w-7 h-7" />
                        </div>
                        <RefreshCw className="w-5 h-5 text-rose-400 animate-spin absolute -top-1 -right-1" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">Opening Live Camera Device...</h4>
                        <p className="text-xs text-slate-400 mt-1 max-w-xs">
                          Requesting camera permissions. Please approve browser camera access prompt if displayed.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Viewfinder Reticle Overlay & Alignment Guide */}
                  <div className="absolute inset-0 pointer-events-none p-6 flex flex-col justify-between z-10">
                    <div className="flex items-center justify-between pointer-events-auto">
                      <span className="text-[11px] font-mono font-semibold bg-black/75 backdrop-blur-sm text-rose-300 px-2.5 py-1 rounded-full border border-rose-500/40 flex items-center gap-1.5 shadow-md">
                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping inline-block" />
                        LIVE CAMERA STREAM
                      </span>
                      <button
                        type="button"
                        onClick={toggleCameraFacing}
                        className="px-2.5 py-1 rounded-lg bg-black/75 hover:bg-black text-slate-200 text-xs flex items-center gap-1.5 border border-slate-700/80 backdrop-blur-sm transition"
                        title="Switch between front and back camera"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-amber-300" />
                        <span>Flip Cam</span>
                      </button>
                    </div>

                    {/* Center Alignment Framing Box with Corner Accents */}
                    <div className="self-center w-52 sm:w-64 h-36 sm:h-44 relative border border-rose-400/40 rounded-xl flex items-center justify-center">
                      <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-rose-400 rounded-tl" />
                      <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-rose-400 rounded-tr" />
                      <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-rose-400 rounded-bl" />
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-rose-400 rounded-br" />
                      <span className="text-[10px] font-mono uppercase tracking-wider bg-black/75 text-rose-200 px-2 py-0.5 rounded shadow">
                        Position Face in Box
                      </span>
                    </div>

                    {/* Bottom Action Controls: Capture Photo & Cancel */}
                    <div className="flex items-center justify-center gap-3 pointer-events-auto">
                      <button
                        type="button"
                        id="btn-capture-camera"
                        onClick={capturePhoto}
                        className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-xl shadow-rose-950/70 ring-2 ring-white/30 active:scale-95 transition"
                      >
                        <Camera className="w-4 h-4" />
                        <span>Capture Photo</span>
                      </button>

                      <button
                        type="button"
                        id="btn-stop-camera"
                        onClick={stopCamera}
                        className="px-3.5 py-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 text-xs font-semibold flex items-center gap-1.5 border border-slate-700/80 backdrop-blur-sm transition"
                      >
                        <VideoOff className="w-3.5 h-3.5 text-slate-400" />
                        <span>Cancel</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : sightingImage ? (
                <div className="space-y-2">
                  <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 aspect-video group shadow-md">
                    <img
                      src={sightingImage}
                      alt="Sighting Evidence"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2 flex items-center gap-1.5 z-10">
                      <button
                        type="button"
                        onClick={() => startCamera()}
                        className="p-1.5 rounded-lg bg-slate-900/85 hover:bg-slate-900 text-rose-300 hover:text-white border border-rose-500/40 transition text-xs flex items-center gap-1 shadow"
                        title="Reopen camera to take another photo"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Retake</span>
                      </button>
                      <button
                        type="button"
                        id="btn-clear-image"
                        onClick={() => {
                          setSightingImage(null);
                          setAnalysisResult(null);
                        }}
                        className="p-1.5 rounded-lg bg-slate-900/85 hover:bg-slate-900 text-slate-300 hover:text-white border border-slate-700 transition"
                        title="Clear photo"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="absolute bottom-2 left-2 bg-slate-900/95 text-emerald-300 text-[11px] font-semibold px-2.5 py-1 rounded-lg border border-emerald-500/30 flex items-center gap-1.5 shadow">
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Photo Loaded & Ready for AI Match</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => startCamera()}
                      className="flex-1 py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 border border-slate-700 transition"
                    >
                      <Camera className="w-3.5 h-3.5 text-rose-400" />
                      <span>Retake with Live Camera</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 border border-slate-700 transition"
                    >
                      <Upload className="w-3.5 h-3.5 text-blue-400" />
                      <span>Choose Different Photo</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-800 hover:border-rose-500/50 rounded-2xl p-6 text-center cursor-pointer transition bg-slate-950/60 hover:bg-slate-950/80 group"
                  >
                    <div className="flex items-center justify-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-xl bg-rose-600/15 text-rose-400 flex items-center justify-center border border-rose-500/30 group-hover:scale-105 transition">
                        <Video className="w-5 h-5" />
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-blue-600/15 text-blue-400 flex items-center justify-center border border-blue-500/30 group-hover:scale-105 transition">
                        <Upload className="w-5 h-5" />
                      </div>
                    </div>
                    <p className="text-xs font-semibold text-slate-200">
                      Choose "Live Camera Access" or "Upload Photo" above
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Supports direct live camera capture, security stills, phone snapshots (JPG, PNG, WEBP)
                    </p>
                  </div>

                  {/* Fallback Native Camera App trigger */}
                  <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                    <span>Mobile phone or tablet user?</span>
                    <button
                      type="button"
                      onClick={() => nativeCameraInputRef.current?.click()}
                      className="text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1 text-[11px] underline underline-offset-2"
                    >
                      <Camera className="w-3 h-3" />
                      <span>Direct Device Camera App</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Hidden file inputs for upload and native device camera */}
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

              {/* Photo Captured Feedback Toast */}
              {photoCaptureFeedback && (
                <div className="p-3 rounded-xl bg-emerald-950/90 border border-emerald-600/60 text-emerald-200 text-xs flex items-center gap-2 animate-in fade-in duration-300">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    <strong>Live Photo Captured Successfully:</strong> Frame has been locked into the AI Vision scanner. Click "Execute AI Verification" below to scan.
                  </span>
                </div>
              )}

              {/* Quick Sample Sighting Photos */}
              {!isCameraActive && !sightingImage && (
                <div className="pt-1">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1.5 font-mono uppercase tracking-wider">
                    <span>Quick Sample Sighting Photos:</span>
                    <span className="text-slate-500 font-normal">Click to test match</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {missingPersons.slice(0, 3).map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setSightingImage(p.photoUrl);
                          setSightingNotes(`Subject observed near ${p.lastSeenLocation.name}. Demographics and appearance appear similar.`);
                          setLocationName(p.lastSeenLocation.name);
                          setSelectedPersonId(p.id);
                          setAnalysisResult(null);
                          setLeadLogged(false);
                        }}
                        className="px-2 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-[11px] border border-slate-750 flex items-center gap-1 transition"
                      >
                        <Sparkles className="w-3 h-3 text-amber-300" />
                        <span>Sample: {p.name.split(' ')[0]}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sighting Location & Eyewitness Notes: Only shown for Citizen profile! REMOVED for Admin and Investigator */}
            {isPublicCitizen && (
              <div className="space-y-3 pt-2 border-t border-slate-800/80">
                <div>
                  <label htmlFor="location-name-input" className="block text-xs font-medium text-slate-400 mb-1">
                    Sighting Location / Landmark
                  </label>
                  <div className="relative">
                    <MapPin className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      id="location-name-input"
                      type="text"
                      value={locationName}
                      onChange={(e) => setLocationName(e.target.value)}
                      placeholder="e.g., Transit Stop, Intersection, Park"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-rose-500"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="sighting-notes-input" className="block text-xs font-medium text-slate-400 mb-1">
                    Eyewitness Notes / Physical Details
                  </label>
                  <textarea
                    id="sighting-notes-input"
                    rows={3}
                    value={sightingNotes}
                    onChange={(e) => setSightingNotes(e.target.value)}
                    placeholder="Describe clothing, emotional state, direction of travel, accompanied persons..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-rose-500 resize-none"
                  />
                </div>
              </div>
            )}

            {!isPublicCitizen && (
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs text-slate-400 flex items-center gap-2">
                <Scan className="w-4 h-4 text-rose-400 shrink-0" />
                <span>Photo search mode: Upload or capture subject image to scan against all {missingPersons.length} active registered dossiers.</span>
              </div>
            )}

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800/60 text-xs text-rose-300 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Execute Analysis & Clear Slate Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch gap-2">
              {(sightingImage || (isPublicCitizen && (sightingNotes || locationName)) || analysisResult) && (
                <button
                  type="button"
                  onClick={handleClearSlate}
                  className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 font-semibold text-xs transition flex items-center justify-center gap-1.5"
                  title="Remove old sighting media & notes to enter new details"
                >
                  <Eraser className="w-3.5 h-3.5 text-rose-400" />
                  <span>Clear Slate</span>
                </button>
              )}
              <button
                id="btn-run-ai-analysis"
                onClick={runAiAnalysis}
                disabled={isAnalyzing}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-semibold text-sm shadow-lg shadow-rose-950/40 flex items-center justify-center gap-2 transition disabled:opacity-75 active:scale-[0.99]"
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>{analysisProgress}% • {isPublicCitizen ? 'Verifying AI Match...' : 'Scanning Registry...'}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-200" />
                    <span>{isPublicCitizen ? 'Execute Multimodal AI Verification' : 'Search All Cases for AI Match'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: AI Analysis Match Dossier & Comparison (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* STATE 1: ACTIVE LIVE PROCESSING PROGRESS */}
          {isAnalyzing ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-6 flex flex-col items-center justify-center min-h-[460px] text-center relative overflow-hidden animate-in fade-in">
              <div className="absolute top-0 right-0 w-64 h-64 bg-rose-600/10 blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-600/10 blur-3xl pointer-events-none" />

              <div className="relative">
                <div className="w-20 h-20 rounded-3xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 relative">
                  <Scan className="w-10 h-10 animate-pulse text-rose-400" />
                  <div className="absolute inset-0 rounded-3xl border-2 border-rose-500/40 animate-ping opacity-25" />
                </div>
              </div>

              <div className="space-y-2 max-w-md w-full">
                <span className="px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 inline-flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 animate-spin text-amber-400" />
                  <span>MULTIMODAL AI PIPELINE RUNNING</span>
                </span>
                <h3 className="text-xl font-bold text-white tracking-tight">
                  Analyzing Sighting Evidence
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed min-h-[36px]">
                  {analysisStageText || 'Cross-referencing submitted evidence against all registered case dossiers...'}
                </p>
              </div>

              {/* Live Animated Progress Bar */}
              <div className="w-full max-w-md space-y-2">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-slate-400">Processing Progress</span>
                  <span className="text-rose-400 font-bold text-sm">{analysisProgress}%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-950 rounded-full border border-slate-800 overflow-hidden p-0.5">
                  <div
                    className="h-full bg-gradient-to-r from-rose-500 via-amber-500 to-emerald-400 rounded-full transition-all duration-300 shadow-sm shadow-rose-500/50"
                    style={{ width: `${analysisProgress}%` }}
                  />
                </div>
              </div>

              {/* Real-time Subsystem Status Pills */}
              <div className="grid grid-cols-2 gap-2 w-full max-w-md text-left text-[11px] font-mono">
                <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-0.5">
                  <span className="text-slate-400 block text-[10px]">CASES SCANNED</span>
                  <span className="text-slate-200 font-bold flex items-center gap-1">
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span>{missingPersons.length} Active Dossiers</span>
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-0.5">
                  <span className="text-slate-400 block text-[10px]">VISION SYSTEM</span>
                  <span className="text-amber-300 font-bold flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span>Gemini Multimodal</span>
                  </span>
                </div>
              </div>
            </div>
          ) : analysisResult ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 animate-in fade-in duration-300">
              {/* Header: Score & Match Status */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                      AI VISION MATCH REPORT #VR-{(Date.now() % 100000).toString()}
                    </span>
                    {isMatchFound ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span>MATCH CONFIRMED</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                        <XCircle className="w-3 h-3 text-amber-400" />
                        <span>NO MATCH FOUND</span>
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    {isMatchFound && matchedPerson ? (
                      <>
                        <span>Potential Match: {matchedPerson.name}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40">
                          {matchedPerson.alertType}
                        </span>
                      </>
                    ) : (
                      <span>No Match Found in Active Registry</span>
                    )}
                  </h3>
                </div>

                {/* Score Dial */}
                <div className="flex items-center gap-3 bg-slate-950 px-4 py-2.5 rounded-xl border border-slate-800 shrink-0">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase font-mono block">
                      Confidence
                    </span>
                    <span
                      className={`text-2xl font-black font-mono ${
                        (analysisResult.overallConfidence || 0) >= 80
                          ? 'text-rose-400'
                          : (analysisResult.overallConfidence || 0) >= 50
                          ? 'text-amber-400'
                          : 'text-slate-400'
                      }`}
                    >
                      {analysisResult.overallConfidence}%
                    </span>
                  </div>
                  <div
                    className={`w-3 h-10 rounded-full ${
                      (analysisResult.overallConfidence || 0) >= 80
                        ? 'bg-rose-500'
                        : (analysisResult.overallConfidence || 0) >= 50
                        ? 'bg-amber-500'
                        : 'bg-slate-700'
                    }`}
                  />
                </div>
              </div>

              {/* BRANCH A: MATCH FOUND -> Side-by-Side Visual Comparison & Case Card */}
              {isMatchFound && matchedPerson ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
                  {/* Registered Target Profile Photo */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="font-semibold text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Registered Case #{matchedPerson.caseNumber}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">{matchedPerson.gender}, {matchedPerson.age}yo</span>
                    </div>
                    <div className="aspect-[4/3] rounded-lg overflow-hidden bg-slate-900 border border-slate-800 relative">
                      <img
                        src={matchedPerson.photoUrl}
                        alt={matchedPerson.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-2 left-2 bg-slate-900/90 text-slate-200 text-[11px] px-2 py-0.5 rounded font-medium">
                        {matchedPerson.name} (Age {matchedPerson.age})
                      </div>
                    </div>
                    <div className="text-[11px] text-slate-400 space-y-0.5 pt-1">
                      <p className="truncate"><strong className="text-slate-300">Last Seen:</strong> {matchedPerson.lastSeenLocation.name}</p>
                      <p className="truncate"><strong className="text-slate-300">Clothing:</strong> {matchedPerson.clothingLastSeen || 'Reported clothing'}</p>
                    </div>
                  </div>

                  {/* Sighting Photo */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="font-semibold text-rose-300 flex items-center gap-1">
                        <Camera className="w-3.5 h-3.5" /> Submitted Sighting Capture
                      </span>
                      <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-mono">
                        ✓ Analyzed
                      </span>
                    </div>
                    <div className="aspect-[4/3] rounded-lg overflow-hidden bg-slate-900 border border-rose-500/40 relative">
                      {sightingImage ? (
                        <img
                          src={sightingImage}
                          alt="Sighting frame"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 p-4 text-center">
                          <FileText className="w-6 h-6 mb-1 text-slate-400" />
                          <span className="text-xs text-slate-300">Eyewitness Narrative Analysis</span>
                        </div>
                      )}
                      <div className="absolute bottom-2 left-2 bg-rose-950/90 text-rose-200 text-[11px] px-2 py-0.5 rounded font-medium border border-rose-800">
                        {locationName || 'Reported Sighting Location'}
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate pt-1">
                      <strong className="text-slate-300">Notes:</strong> {sightingNotes || 'Eyewitness observation captured'}
                    </p>
                  </div>
                </div>
              ) : (
                /* BRANCH B: NO MATCH FOUND -> Informative Banner & Unlinked Observation Panel */
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div className="text-xs space-y-1">
                      <h4 className="font-semibold text-amber-300 text-sm">
                        No Direct Match Found in Active Registry
                      </h4>
                      <p className="text-slate-300 leading-relaxed">
                        The submitted photograph and eyewitness notes were compared against all {missingPersons.length} active registered cases. 
                        No matching facial structure, demographic profile, or apparel was identified.
                      </p>
                      <p className="text-slate-400 text-[11px]">
                        You can still submit this report as an <strong>Unlinked Citizen Sighting Tip</strong>. It will be stored in the Search & Rescue intake queue so coordinators can cross-reference it if a matching case is registered later.
                      </p>
                    </div>
                  </div>

                  {/* Submitted Sighting Evidence Summary Card */}
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-center gap-4">
                    {sightingImage ? (
                      <div className="w-28 h-28 rounded-lg overflow-hidden bg-slate-900 border border-slate-800 shrink-0 relative">
                        <img src={sightingImage} alt="Submitted evidence" className="w-full h-full object-cover" />
                        <span className="absolute bottom-1 left-1 bg-black/80 text-[10px] text-slate-300 px-1.5 py-0.5 rounded">Uploaded</span>
                      </div>
                    ) : (
                      <div className="w-28 h-28 rounded-lg bg-slate-900 border border-slate-800 shrink-0 flex flex-col items-center justify-center text-slate-500 p-2 text-center">
                        <FileText className="w-6 h-6 mb-1 text-slate-400" />
                        <span className="text-[10px]">Text Only</span>
                      </div>
                    )}
                    <div className="text-xs space-y-1 text-slate-300 flex-1 w-full">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-white">Submitted Community Observation</span>
                        <span className="text-[11px] font-mono text-slate-400">{locationName || 'Location Not Specified'}</span>
                      </div>
                      <p className="text-slate-400 italic line-clamp-2">
                        "{sightingNotes || 'Photo evidence submitted without descriptive notes.'}"
                      </p>
                      <p className="text-slate-400 text-[11px] pt-1">
                        <strong>Status:</strong> Ready to log as an unlinked field lead.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Detailed Breakdown Panels */}
              <div className="space-y-3 text-xs">
                {/* Facial Structure */}
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between font-semibold text-slate-200">
                    <span className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-blue-400" />
                      Facial & Anatomical Alignment
                    </span>
                    <span className="text-slate-400 font-mono text-[11px]">Vision Subsystem</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    {analysisResult.facialMatchAssessment}
                  </p>
                </div>

                {/* Clothing & Accessories */}
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between font-semibold text-slate-200">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      Clothing & Physical Identifiers
                    </span>
                    <span className="text-slate-400 font-mono text-[11px]">Pattern Verification</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    {analysisResult.clothingMatchAssessment}
                  </p>
                  {analysisResult.distinguishingFeaturesFound?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {analysisResult.distinguishingFeaturesFound.map((feat: string, i: number) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[10px]"
                        >
                          ✓ {feat}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Tactical Risk & Actionable Directive */}
                <div className="p-3.5 rounded-xl bg-rose-950/30 border border-rose-900/60 space-y-1">
                  <div className="flex items-center justify-between font-semibold text-rose-300">
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-rose-400" />
                      Search & Rescue Priority Directive
                    </span>
                    <span className="text-rose-400 font-mono text-[11px]">Action Directive</span>
                  </div>
                  <p className="text-rose-200/90 leading-relaxed font-medium">
                    {analysisResult.suggestedAction}
                  </p>
                  <p className="text-slate-400 text-[11px] pt-1">
                    Risk Assessment: {analysisResult.riskAssessment}
                  </p>
                </div>
              </div>

              {/* Action Buttons for Coordinators / Citizens */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-800">
                {isMatchFound && matchedPerson && (
                  <button
                    id="btn-view-case-dossier"
                    onClick={() => onSelectPerson(matchedPerson)}
                    className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition"
                  >
                    <span>
                      {isPublicCitizen
                        ? `View Public Bulletin (${matchedPerson.name})`
                        : `View Case File #${matchedPerson.caseNumber}`}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}

                <div className="flex items-center gap-2 ml-auto">
                  {leadLogged ? (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-950 border border-emerald-800 text-emerald-300 text-xs font-medium">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>
                          {isPublicCitizen
                            ? 'Sighting Tip Submitted to SAR Intake'
                            : 'Verified Lead Logged to Case Timeline'}
                        </span>
                      </div>
                      <button
                        onClick={handleClearSlate}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold transition"
                        title="Clear slate and scan a new sighting"
                      >
                        <Eraser className="w-3.5 h-3.5 text-rose-400" />
                        <span>Clear Slate for Next Scan</span>
                      </button>
                    </div>
                  ) : (
                    <button
                      id="btn-log-official-lead"
                      onClick={handleLogOfficialLead}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-md shadow-rose-950/40 transition active:scale-95"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>
                        {isMatchFound
                          ? (isPublicCitizen ? 'Submit Verified Sighting Tip to SAR Dispatch' : 'Log as Verified Sighting Lead')
                          : (isPublicCitizen ? 'Submit Unlinked Sighting Tip to SAR Dispatch' : 'Log Unlinked Field Report')}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center flex flex-col items-center justify-center min-h-[420px] space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center text-slate-500">
                <Scan className="w-8 h-8 text-slate-400" />
              </div>
              <div className="max-w-md">
                <h3 className="text-base font-semibold text-white">
                  {isPublicCitizen
                    ? 'Awaiting Sighting Media or Eyewitness Notes'
                    : 'Awaiting Photo Evidence to Search All Active Cases'}
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  {isPublicCitizen
                    ? 'Provide a surveillance still, bystander capture, or quick eyewitness description on the left. Click "Execute Multimodal AI Verification" to compute multi-point biometric and apparel correlations.'
                    : 'Upload a photograph or capture camera evidence on the left. Click "Search All Cases for AI Match" to cross-reference against all registered missing persons dossiers simultaneously.'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
