import React, { useState, useRef } from 'react';
import { useAlerts, type Category, type Severity } from '../context/AlertContext';
import { 
  X, MapPin, Camera, AlertTriangle, 
  Flame, Droplet, HeartPulse, Car, Globe, HelpCircle 
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
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

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
      // Generate object url for local rendering in list feed
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveImage = () => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl transition-all">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500 animate-pulse" />
            <h2 className="text-xl font-bold text-white">Report New Emergency</h2>
          </div>
          <button 
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
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
                    className={`flex flex-col items-center gap-2 rounded-xl border p-3.5 text-center transition-all ${
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
                    className={`rounded-lg border py-2.5 text-center text-xs transition-all ${
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
                className="flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-950/30 px-3.5 text-xs font-medium text-zinc-300 transition-all hover:bg-zinc-800 hover:text-white disabled:opacity-50"
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
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950/50 p-3.5 text-sm text-white placeholder-zinc-500 outline-none transition-all focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50"
            />
            {errors.description && <p className="mt-1 text-xs font-medium text-red-500">{errors.description}</p>}
          </div>

          {/* Photo attachment upload */}
          <div>
            <label className="block text-sm font-semibold tracking-wide text-zinc-300 mb-1.5">
              5. Photo Upload (Optional)
            </label>
            
            {imagePreview ? (
              <div className="relative rounded-xl border border-zinc-800 p-2 bg-zinc-950/20">
                <img 
                  src={imagePreview} 
                  alt="Upload Preview" 
                  className="max-h-40 w-full rounded-lg object-cover"
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-4 right-4 flex h-6 w-6 items-center justify-center rounded-full bg-zinc-900/90 text-zinc-400 hover:text-white hover:scale-105"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div 
                onClick={triggerFileInput}
                className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-zinc-800 bg-zinc-950/10 py-5 text-center transition-all hover:border-zinc-600 hover:bg-zinc-900/10"
              >
                <Camera className="h-6 w-6 text-zinc-500 mb-1.5" />
                <span className="text-sm font-medium text-zinc-300">Click to upload photo</span>
                <span className="text-xs text-zinc-500 mt-0.5">JPEG, PNG up to 5MB</span>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 border-t border-zinc-800 pt-5 mt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-5 py-2.5 text-sm font-medium text-zinc-400 transition-all hover:bg-zinc-800 hover:text-white disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-orange-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-red-950/20 hover:from-red-500 hover:to-orange-500 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Submitting Alert...</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-4 w-4 text-white" />
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
