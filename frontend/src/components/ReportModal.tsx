import React, { useState, useRef } from 'react';
import { useAlerts, type Category, type Severity } from '../context/AlertContext';
import { 
  X, MapPin, Camera, AlertTriangle, ShieldAlert,
  Flame, Droplet, HeartPulse, Car, Globe, HelpCircle, Plus
} from 'lucide-react';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORIES: { value: Category; label: string; icon: any; color: string }[] = [
  { value: 'fire', label: 'Fire & Smoke', icon: Flame, color: 'text-red-500 bg-red-500/10 border-red-500/20' },
  { value: 'flood', label: 'Flood & Water', icon: Droplet, color: 'text-blue-500 bg-blue-500/10 border-blue-500/20' },
  { value: 'medical', label: 'Medical Emergency', icon: HeartPulse, color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' },
  { value: 'accident', label: 'Vehicle Accident', icon: Car, color: 'text-orange-500 bg-orange-500/10 border-orange-500/20' },
  { value: 'earthquake', label: 'Earthquake / Seismic', icon: Globe, color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' },
  { value: 'other', label: 'Other Hazard', icon: HelpCircle, color: 'text-purple-500 bg-purple-500/10 border-purple-500/20' },
];

const SEVERITIES: { value: Severity; label: string; color: string; activeColor: string }[] = [
  { value: 'low', label: 'Low', color: 'border-zinc-800 text-zinc-400 hover:bg-zinc-900', activeColor: 'bg-yellow-500/20 border-yellow-500/80 text-yellow-400 font-semibold shadow-[0_0_10px_rgba(234,179,8,0.2)]' },
  { value: 'medium', label: 'Medium', color: 'border-zinc-800 text-zinc-400 hover:bg-zinc-900', activeColor: 'bg-orange-500/20 border-orange-500/80 text-orange-400 font-semibold shadow-[0_0_10px_rgba(249,115,22,0.2)]' },
  { value: 'high', label: 'High', color: 'border-zinc-800 text-zinc-400 hover:bg-zinc-900', activeColor: 'bg-red-500/20 border-red-500/80 text-red-400 font-semibold shadow-[0_0_10px_rgba(239,68,68,0.2)]' },
  { value: 'critical', label: 'Critical', color: 'border-zinc-800 text-zinc-400 hover:bg-zinc-900', activeColor: 'bg-purple-950/30 border-purple-500 text-purple-400 font-semibold animate-pulse shadow-[0_0_15px_rgba(168,85,247,0.3)]' },
];

export const ReportModal: React.FC<ReportModalProps> = ({ isOpen, onClose }) => {
  const { createAlert, mapCenter, setMapCenter } = useAlerts();
  
  const [category, setCategory] = useState<Category | null>(null);
  const [severity, setSeverity] = useState<Severity | null>(null);
  const [location, setLocation] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [description, setDescription] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const [detecting, setDetecting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Camera & AI analysis states
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  if (!isOpen) return null;

  const startCamera = async () => {
    setIsCameraActive(true);
    setErrors(prev => ({ ...prev, image: '' }));
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: facingMode } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.error('Failed to open camera: ', err);
      setErrors(prev => ({ ...prev, image: 'Webcam permission denied or camera device unavailable.' }));
      setIsCameraActive(false);
    }
  };

  const startCameraWithMode = async (mode: 'user' | 'environment') => {
    setIsCameraActive(true);
    setErrors(prev => ({ ...prev, image: '' }));
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: mode } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.error('Failed to open camera with mode: ', err);
      setErrors(prev => ({ ...prev, image: 'Webcam permission denied or camera device unavailable.' }));
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const captureSnapshot = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setImagePreview(dataUrl);
        stopCamera();
        runAiAnalysis(dataUrl);
      }
    }
  };

  const runAiAnalysis = async (base64Image: string) => {
    setIsAnalyzing(true);
    setErrors(prev => ({ ...prev, image: '', category: '', severity: '', description: '' }));
    try {
      const response = await fetch('http://localhost:5000/api/alerts/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ image: base64Image })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.hazardDetected) {
          const matchedCategory = data.incidentType.toLowerCase();
          const matchedSeverity = data.severity.toLowerCase();
          
          if (['fire', 'flood', 'medical', 'accident', 'earthquake', 'other'].includes(matchedCategory)) {
            setCategory(matchedCategory as Category);
          } else {
            setCategory('other');
          }
          
          if (['low', 'medium', 'high', 'critical'].includes(matchedSeverity)) {
            setSeverity(matchedSeverity as Severity);
          } else {
            setSeverity('medium');
          }
          
          setDescription(`${data.description}\n\nRecommended Action: ${data.recommendedAction}`);
        } else {
          setDescription(data.description || 'AI completed analysis: No hazard detected.');
        }
      } else {
        console.warn('AI analysis endpoint returned error response');
      }
    } catch (err) {
      console.error('Failed to communicate with AI analysis server: ', err);
    } finally {
      setIsAnalyzing(false);
      // Auto detect location if empty
      if (!location) {
        handleDetectLocation();
      }
    }
  };

  const handleDetectLocation = () => {
    setDetecting(true);
    setErrors(prev => ({ ...prev, location: '' }));
    
    if (!navigator.geolocation) {
      setErrors(prev => ({ ...prev, location: 'Geolocation is not supported by your browser' }));
      setDetecting(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setLatitude(lat);
        setLongitude(lng);
        setLocation(`Coordinates: ${lat.toFixed(5)}, ${lng.toFixed(5)}`);
        setMapCenter([lat, lng]); // Update map view coordinate focus
        setDetecting(false);
      },
      (error) => {
        let msg = 'Could not get location. Please input address manually.';
        if (error.code === error.PERMISSION_DENIED) {
          msg = 'Location permission denied. Please enter address manually.';
        }
        setErrors(prev => ({ ...prev, location: msg }));
        setDetecting(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImagePreview(URL.createObjectURL(file));
      try {
        const base64 = await fileToBase64(file);
        runAiAnalysis(base64);
      } catch (err) {
        console.error('Failed to read image file for AI analysis:', err);
      }
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveImage = () => {
    if (imagePreview) {
      if (imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
      setImagePreview(null);
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!category) newErrors.category = 'Please select a hazard category';
    if (!severity) newErrors.severity = 'Please specify the severity level';
    if (!location.trim()) newErrors.location = 'Location description or coordinates required';
    if (!description.trim()) newErrors.description = 'Please describe the emergency details';
    else if (description.trim().length < 10) newErrors.description = 'Detail must be at least 10 characters';
    
    // Mandate photo upload or live capture
    if (!imagePreview) newErrors.image = 'Live photo capture or image upload is required to verify the emergency';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setErrors(prev => ({ ...prev, submit: '' }));

    // If coordinates weren't resolved by GPS, mock random coordinates centered near original dashboard focus
    const finalLat = latitude ?? parseFloat((mapCenter[0] + (Math.random() - 0.5) * 0.02).toFixed(6));
    const finalLng = longitude ?? parseFloat((mapCenter[1] + (Math.random() - 0.5) * 0.02).toFixed(6));

    const success = await createAlert({
      category: category!,
      severity: severity!,
      location,
      latitude: finalLat,
      longitude: finalLng,
      description,
      imageUrl: imagePreview || undefined,
    });

    setIsSubmitting(false);
    if (success) {
      resetForm();
      onClose();
    } else {
      setErrors(prev => ({ ...prev, submit: 'Failed to submit emergency report to the server. Please verify your connection.' }));
    }
  };

  const resetForm = () => {
    setCategory(null);
    setSeverity(null);
    setLocation('');
    setLatitude(null);
    setLongitude(null);
    setDescription('');
    setImagePreview(null);
    setErrors({});
  };

  const handleClose = () => {
    stopCamera();
    resetForm();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl transition-all flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* AI Scanning Loader Overlay */}
        {isAnalyzing && (
          <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-zinc-950/90 backdrop-blur-md transition-all">
            <div className="relative flex h-20 w-20 items-center justify-center">
              <div className="absolute inset-0 rounded-full border border-red-500/30 animate-ping"></div>
              <div className="absolute inset-2 rounded-full border border-orange-500/30 animate-pulse"></div>
              <div className="h-10 w-10 rounded-xl bg-red-600 flex items-center justify-center text-white shadow-xl shadow-red-950/45">
                <ShieldAlert className="h-6 w-6 animate-bounce" />
              </div>
            </div>
            
            <h3 className="mt-5 text-sm font-bold text-white uppercase tracking-widest animate-pulse">
              AI Analyzing Emergency Scene...
            </h3>
            <p className="mt-1.5 text-xs text-zinc-500 font-medium max-w-[280px] text-center leading-normal">
              Extracting incident hazard category, threat severity, and report details from snapshot...
            </p>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4 shrink-0">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500 animate-pulse" />
            <h2 className="text-xl font-bold text-white">Report New Emergency</h2>
          </div>
          <button 
            type="button"
            onClick={handleClose}
            className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body - scrollable */}
        <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1">
          <div className="flex-1 overflow-y-auto p-6 space-y-5 scrollbar-thin">
            {errors.submit && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-xs font-medium text-red-400">
                {errors.submit}
              </div>
            )}
            
            {/* Step 1: Capture Scene (Mandatory) */}
            <div>
              <label className="block text-sm font-semibold tracking-wide text-zinc-300 mb-2 flex justify-between items-center">
                <span>1. Capture Emergency Scene <span className="text-red-500">*</span></span>
                {errors.image && <span className="text-[11px] text-red-400 font-bold">{errors.image}</span>}
              </label>
              
              {imagePreview ? (
                <div className="relative rounded-xl border border-zinc-800 p-2 bg-zinc-950/20">
                  <img 
                    src={imagePreview} 
                    alt="Upload Preview" 
                    className="max-h-56 w-full rounded-lg object-cover"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute top-4 right-4 flex h-7 w-7 items-center justify-center rounded-full bg-zinc-950/90 text-zinc-400 hover:text-red-500 hover:scale-105 border border-zinc-800 shadow-lg cursor-pointer"
                    title="Remove image"
                  >
                    <X className="h-4.5 w-4.5" />
                  </button>
                </div>
              ) : isCameraActive ? (
                <div className="fixed inset-0 z-[100] bg-zinc-950 flex flex-col justify-between overflow-hidden">
                  
                  {/* Video Viewport */}
                  <div className="absolute inset-0 z-0">
                    <video 
                      ref={videoRef} 
                      className="h-full w-full object-cover scale-x-[-1]" 
                      playsInline 
                      muted
                    />
                  </div>

                  {/* Scanning Overlays */}
                  <div className="absolute inset-0 z-10 border border-red-500/10 pointer-events-none flex items-center justify-center">
                    <div className="relative w-[75vw] h-[55vh] sm:w-[50vw] sm:h-[50vh] border-2 border-dashed border-red-500/20 rounded-2xl flex items-center justify-center">
                      <div className="absolute top-2 left-2 w-8 h-8 border-t-4 border-l-4 border-red-500"></div>
                      <div className="absolute top-2 right-2 w-8 h-8 border-t-4 border-r-4 border-red-500"></div>
                      <div className="absolute bottom-2 left-2 w-8 h-8 border-b-4 border-l-4 border-red-500"></div>
                      <div className="absolute bottom-2 right-2 w-8 h-8 border-b-4 border-r-4 border-red-500"></div>
                      <div className="text-[10px] text-red-500/60 uppercase tracking-widest font-mono font-bold animate-pulse">
                        ALIGN INCIDENT VIEW
                      </div>
                    </div>
                    <div className="absolute w-full h-[2px] bg-red-500/50 shadow-[0_0_10px_#ef4444] top-1/2 left-0 animate-scan"></div>
                  </div>

                  {/* Top HUD */}
                  <div className="relative z-20 p-6 bg-gradient-to-b from-black/80 to-transparent flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                      </span>
                      <span className="text-xs font-bold uppercase tracking-widest text-zinc-300 font-mono">
                        LIVE EMERGENCY VIEWPORT LENS
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={stopCamera}
                      className="rounded-full bg-zinc-900/90 border border-zinc-800 p-2 text-zinc-400 hover:text-white hover:bg-zinc-850 transition-all cursor-pointer"
                      title="Cancel Camera"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Bottom Controls */}
                  <div className="relative z-20 p-8 bg-gradient-to-t from-black/90 via-black/45 to-transparent flex flex-col items-center gap-4 shrink-0">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-400 font-mono">
                      TAKE CAPTURE TO TRIGGER AI SCENE ANALYSIS
                    </span>
                    
                    <div className="flex items-center justify-between gap-6 w-full max-w-sm">
                      <div className="text-left text-[9px] text-zinc-550 font-mono w-24">
                        STATUS: ACTIVE<br/>LENS: 24MM F/1.8
                      </div>

                      {/* Capture Trigger */}
                      <button
                        type="button"
                        onClick={captureSnapshot}
                        className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-white hover:bg-zinc-200 text-zinc-950 font-bold transition-all border-4 border-zinc-900 active:scale-95 shadow-[0_0_25px_rgba(255,255,255,0.4)] cursor-pointer animate-pulse-glow"
                        title="Capture Photo"
                      >
                        <Camera className="h-6 w-6 text-zinc-950" />
                      </button>

                      {/* Camera Facemode Switcher */}
                      <div className="w-24 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            stopCamera();
                            setTimeout(() => {
                              const nextMode = facingMode === 'user' ? 'environment' : 'user';
                              setFacingMode(nextMode);
                              startCameraWithMode(nextMode);
                            }, 100);
                          }}
                          className="rounded-lg bg-zinc-900/90 border border-zinc-800 px-3 py-1.5 text-[9px] font-extrabold text-zinc-400 hover:text-white transition-all cursor-pointer uppercase tracking-wider font-mono"
                        >
                          Flip Camera
                        </button>
                      </div>
                    </div>
                  </div>

                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Webcam Card */}
                  <button
                    type="button"
                    onClick={startCamera}
                    className="flex flex-col items-center justify-center rounded-xl border border-zinc-850 bg-zinc-950/20 py-6 text-center transition-all hover:border-red-500/35 hover:bg-zinc-900/10 cursor-pointer"
                  >
                    <Camera className="h-7 w-7 text-red-500 mb-2 animate-pulse" />
                    <span className="text-sm font-bold text-zinc-200">Capture Live Webcam</span>
                    <span className="text-[10px] text-zinc-500 mt-1">Take snapshot via device camera</span>
                  </button>

                  {/* Storage Card */}
                  <div 
                    onClick={triggerFileInput}
                    className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-zinc-800 bg-zinc-950/10 py-6 text-center transition-all hover:border-red-500/35 hover:bg-zinc-900/10"
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-900/60 mb-2 border border-zinc-850">
                      <Plus className="h-4.5 w-4.5 text-zinc-455" />
                    </div>
                    <span className="text-sm font-bold text-zinc-300">Upload File / Image</span>
                    <span className="text-[10px] text-zinc-500 mt-1">Select PNG, JPEG from storage</span>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageChange}
                      accept="image/*"
                      className="hidden"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Step 2: Location Area */}
            <div>
              <label className="block text-sm font-semibold tracking-wide text-zinc-300 mb-1.5">
                2. Location & Area <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <MapPin className="absolute top-3 left-3 h-4 w-4 text-zinc-500" />
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => {
                      setLocation(e.target.value);
                      setErrors(prev => ({ ...prev, location: '' }));
                    }}
                    placeholder="Enter address, landmarks, or GPS coordinates"
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-950/50 py-2.5 pl-10 pr-4 text-sm text-white placeholder-zinc-500 outline-none transition-all focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleDetectLocation}
                  disabled={detecting}
                  className="flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-950/30 px-3.5 text-xs font-medium text-zinc-300 transition-all hover:bg-zinc-800 hover:text-white disabled:opacity-50 cursor-pointer"
                >
                  {detecting ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
                  ) : (
                    <MapPin className="h-4 w-4 text-red-500 animate-pulse" />
                  )}
                  <span className="hidden sm:inline">Detect GPS</span>
                </button>
              </div>
              {errors.location && <p className="mt-1 text-xs font-medium text-red-500">{errors.location}</p>}
            </div>

            {/* Step 3: AI Assessment Results */}
            <div className="border-t border-zinc-800/60 pt-4">
              <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500 mb-3 font-mono">
                AI Scene Assessment Status
              </label>
              
              {isAnalyzing ? (
                <div className="rounded-xl border border-dashed border-red-500/30 bg-red-950/5 p-6 flex flex-col items-center justify-center text-center">
                  <span className="h-6 w-6 animate-spin rounded-full border-2 border-red-500 border-t-transparent mb-2" />
                  <span className="text-xs font-bold text-red-400 uppercase tracking-wider animate-pulse">Running Gemini Flash Scene Analysis...</span>
                </div>
              ) : category && severity && description ? (
                <div className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-950/30 p-4">
                  <div className="grid grid-cols-2 gap-3">
                    {/* Auto-detected Category */}
                    <div className="rounded-lg bg-zinc-900/40 border border-zinc-850 p-2.5 flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded bg-red-500/10 text-red-500 shrink-0">
                        {category === 'fire' && <Flame className="h-4 w-4" />}
                        {category === 'flood' && <Droplet className="h-4 w-4" />}
                        {category === 'medical' && <HeartPulse className="h-4 w-4" />}
                        {category === 'accident' && <Car className="h-4 w-4" />}
                        {category === 'earthquake' && <Globe className="h-4 w-4" />}
                        {category === 'other' && <HelpCircle className="h-4 w-4" />}
                      </div>
                      <div className="min-w-0">
                        <div className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider">AI Category</div>
                        <div className="text-xs font-bold text-zinc-200 capitalize truncate">{category}</div>
                      </div>
                    </div>

                    {/* Auto-detected Severity */}
                    <div className="rounded-lg bg-zinc-900/40 border border-zinc-850 p-2.5 flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded bg-red-500/10 text-red-500 shrink-0">
                        <ShieldAlert className="h-4 w-4 text-red-550" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider">AI Severity</div>
                        <div className="text-xs font-bold text-red-400 capitalize truncate">{severity}</div>
                      </div>
                    </div>
                  </div>

                  {/* AI Description Log */}
                  <div className="rounded-lg bg-zinc-900/20 border border-zinc-850 p-3">
                    <div className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider mb-1">AI Details Assessment</div>
                    <div className="text-xs leading-relaxed text-zinc-300 font-medium">
                      {description}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-955/10 p-5 text-center text-zinc-500">
                  <AlertTriangle className="h-6 w-6 text-zinc-600 mx-auto mb-2" />
                  <p className="text-xs font-semibold">Standby: Awaiting Verification Snapshot</p>
                  <p className="text-[10px] text-zinc-600 mt-1 max-w-[280px] mx-auto leading-normal">
                    Capture a webcam snapshot or select an image file to trigger automatic AI incident classification.
                  </p>
                </div>
              )}
            </div>

          </div>

          {/* Footer - fixed */}
          <div className="flex justify-end gap-3 border-t border-zinc-800 px-6 py-4 shrink-0 bg-zinc-900/60 backdrop-blur-sm">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-5 py-2.5 text-sm font-medium text-zinc-400 transition-all hover:bg-zinc-800 hover:text-white disabled:opacity-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isAnalyzing || !imagePreview || !category}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-650 to-orange-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-red-950/20 hover:from-red-600 hover:to-orange-500 transition-all active:scale-[0.98] disabled:opacity-55 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Submitting Alert...</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-4.5 w-4.5 text-white" />
                  <span>Submit Urgent Report</span>
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
