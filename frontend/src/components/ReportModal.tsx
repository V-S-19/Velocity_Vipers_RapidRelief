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
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  if (!isOpen) return null;

  const startCamera = async () => {
    setIsCameraActive(true);
    setErrors(prev => ({ ...prev, image: '' }));
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
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

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
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
        runAiAnalysis();
      }
    }
  };

  const runAiAnalysis = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      const mockScenarios = [
        {
          category: 'fire' as Category,
          severity: 'critical' as Severity,
          description: 'Visible thick plume of black smoke arising from second-floor industrial facility. Strong flames observed, potential hazard of gas canister explosion.'
        },
        {
          category: 'flood' as Category,
          severity: 'high' as Severity,
          description: 'Sudden flash flooding causing street water to rise above 2 feet. Drainage channel overflowed, surrounding buildings at risk of cellar inundation.'
        },
        {
          category: 'accident' as Category,
          severity: 'high' as Severity,
          description: 'Two-car side collision blocking multiple highway lanes. Potential driver entrapment, oil leaking onto tarmac, urgent medical/paramedic dispatch required.'
        },
        {
          category: 'medical' as Category,
          severity: 'medium' as Severity,
          description: 'Elderly pedestrian collapsed on public walkway. Showing signs of severe heat stroke, dehydration, and laboured breathing. First responders needed on scene.'
        },
        {
          category: 'earthquake' as Category,
          severity: 'critical' as Severity,
          description: 'Severe structural cracking observed on historic brick building facade following seismic tremors. Debris has fallen onto pedestrian footpath, area needs cordon.'
        }
      ];

      const scenario = mockScenarios[Math.floor(Math.random() * mockScenarios.length)];
      setCategory(scenario.category);
      setSeverity(scenario.severity);
      setDescription(scenario.description);
      
      // Auto detect location if empty
      if (!location) {
        handleDetectLocation();
      }
    }, 1500);
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImagePreview(URL.createObjectURL(file));
      runAiAnalysis();
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

    // If coordinates weren't resolved by GPS, mock random coordinates centered near original dashboard focus
    const finalLat = latitude ?? parseFloat((mapCenter[0] + (Math.random() - 0.5) * 0.02).toFixed(6));
    const finalLng = longitude ?? parseFloat((mapCenter[1] + (Math.random() - 0.5) * 0.02).toFixed(6));

    // Simulate database write delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    createAlert({
      category: category!,
      severity: severity!,
      location,
      latitude: finalLat,
      longitude: finalLng,
      description,
      imageUrl: imagePreview || undefined,
    });

    setIsSubmitting(false);
    resetForm();
    onClose();
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
            
            {/* Category Select Grid */}
            <div>
              <label className="block text-sm font-semibold tracking-wide text-zinc-300 mb-2.5">
                1. Incident Category <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  const isSelected = category === cat.value;
                  return (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => {
                        setCategory(cat.value);
                        setErrors(prev => ({ ...prev, category: '' }));
                      }}
                      className={`flex flex-col items-center gap-2 rounded-xl border p-3.5 text-center transition-all cursor-pointer ${
                        isSelected 
                          ? 'border-red-500/80 bg-red-500/10 text-red-400 font-semibold shadow-[0_0_12px_rgba(239,68,68,0.15)] scale-[1.02]' 
                          : 'border-zinc-800 bg-zinc-950/40 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                      }`}
                    >
                      <Icon className={`h-6 w-6 ${isSelected ? 'text-red-500 animate-bounce' : 'text-zinc-500'}`} />
                      <span className="text-xs">{cat.label}</span>
                    </button>
                  );
                })}
              </div>
              {errors.category && <p className="mt-1 text-xs font-medium text-red-500">{errors.category}</p>}
            </div>

            {/* Severity Toggle */}
            <div>
              <label className="block text-sm font-semibold tracking-wide text-zinc-300 mb-2.5">
                2. Severity Level <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-4 gap-2">
                {SEVERITIES.map((sev) => {
                  const isSelected = severity === sev.value;
                  return (
                    <button
                      key={sev.value}
                      type="button"
                      onClick={() => {
                        setSeverity(sev.value);
                        setErrors(prev => ({ ...prev, severity: '' }));
                      }}
                      className={`rounded-lg border py-2.5 text-center text-xs transition-all cursor-pointer ${
                        isSelected ? sev.activeColor : sev.color
                      }`}
                    >
                      {sev.label}
                    </button>
                  );
                })}
              </div>
              {errors.severity && <p className="mt-1 text-xs font-medium text-red-500">{errors.severity}</p>}
            </div>

            {/* Location Area */}
            <div>
              <label className="block text-sm font-semibold tracking-wide text-zinc-300 mb-1.5">
                3. Location & Area <span className="text-red-500">*</span>
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

            {/* Incident Description */}
            <div>
              <label className="block text-sm font-semibold tracking-wide text-zinc-300 mb-1.5">
                4. Incident Details <span className="text-red-500">*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  setErrors(prev => ({ ...prev, description: '' }));
                }}
                rows={3}
                placeholder="Provide clear specifics (e.g., number of victims, active fires, blocked routes, required assistance)"
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950/50 p-3.5 text-sm text-white placeholder-zinc-550 outline-none transition-all focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50"
              />
              {errors.description && <p className="mt-1 text-xs font-medium text-red-500">{errors.description}</p>}
            </div>

            {/* Photo attachment upload */}
            <div>
              <label className="block text-sm font-semibold tracking-wide text-zinc-300 mb-1.5 flex justify-between items-center">
                <span>5. Capture Emergency Scene <span className="text-red-500">*</span></span>
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
                <div className="relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950">
                  <video 
                    ref={videoRef} 
                    className="h-60 w-full object-cover scale-x-[-1]" 
                    playsInline 
                    muted
                  />
                  
                  {/* Visual scanlines scanning overlay */}
                  <div className="absolute inset-0 border border-red-500/20 pointer-events-none flex items-center justify-center">
                    <div className="w-[85%] h-[85%] border border-dashed border-zinc-700/60 rounded-lg"></div>
                    <div className="absolute w-full h-[1px] bg-red-500/30 top-1/2 animate-scan"></div>
                  </div>

                  <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-3 px-4 z-10">
                    <button
                      type="button"
                      onClick={captureSnapshot}
                      className="flex h-11 w-11 items-center justify-center rounded-full bg-red-650 hover:bg-red-500 text-white font-bold transition-all border-4 border-zinc-900 active:scale-95 shadow-[0_0_15px_rgba(220,38,38,0.5)] cursor-pointer"
                      title="Take snapshot photo"
                    >
                      <Camera className="h-4.5 w-4.5" />
                    </button>
                    <button
                      type="button"
                      onClick={stopCamera}
                      className="rounded-lg bg-zinc-900/95 border border-zinc-800 px-3 py-1.5 text-xs font-semibold text-zinc-400 hover:text-white hover:bg-zinc-850 cursor-pointer"
                    >
                      Cancel Camera
                    </button>
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
                      <Plus className="h-4.5 w-4.5 text-zinc-450" />
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
              disabled={isSubmitting || isAnalyzing}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-650 to-orange-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-red-950/20 hover:from-red-600 hover:to-orange-500 transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
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
