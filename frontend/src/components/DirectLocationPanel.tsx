import React, { useState, useEffect } from 'react';
import { useAlerts, type Category, type Severity } from '../context/AlertContext';
import { AlertsMap } from './AlertsMap';
import { 
  Compass, Clock, Navigation, Activity, CheckCircle2, AlertTriangle,
  Flame, Droplet, HeartPulse, Car, Globe, HelpCircle, X,
  MapPin, Shield, Trash2, Map, ShieldCheck
} from 'lucide-react';

interface DirectLocationPanelProps {
  selectedAlertId?: string | null;
}

const CATEGORY_META: Record<Category, { icon: any; color: string; label: string }> = {
  fire: { icon: Flame, color: 'text-red-500 bg-red-500/10 border-red-500/20', label: 'Fire Rescue' },
  flood: { icon: Droplet, color: 'text-blue-500 bg-blue-500/10 border-blue-500/20', label: 'HAZMAT Team' },
  medical: { icon: HeartPulse, color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20', label: 'EMS Dispatch' },
  accident: { icon: Car, color: 'text-orange-500 bg-orange-500/10 border-orange-500/20', label: 'Police Patrol' },
  earthquake: { icon: Globe, color: 'text-amber-500 bg-amber-500/10 border-amber-500/20', label: 'Disaster Recovery' },
  other: { icon: HelpCircle, color: 'text-purple-500 bg-purple-500/10 border-purple-500/20', label: 'Rescue Squad' },
};

const SEVERITY_CLASSES: Record<Severity, string> = {
  low: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  medium: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  high: 'bg-red-500/15 text-red-400 border-red-500/20',
  critical: 'bg-purple-500/15 text-purple-400 border-purple-500/20 animate-pulse',
};

export const DirectLocationPanel: React.FC<DirectLocationPanelProps> = ({ selectedAlertId }) => {
  const { alerts, user, updateAlert, resolveAlert, deleteAlert, setMapCenter } = useAlerts();
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);

  // Find the selected alert, fallback to the first active/unresolved alert, or the very first alert
  const alert = alerts.find(a => a.id === selectedAlertId) || alerts.find(a => !a.resolved) || alerts[0];

  // Sync map center coordinate when the focused alert changes
  useEffect(() => {
    if (alert) {
      setMapCenter([alert.latitude, alert.longitude]);
    }
  }, [alert, setMapCenter]);

  if (!alert) {
    return (
      <div className="flex flex-col h-full w-full rounded-2xl border border-zinc-800 bg-zinc-900/20 shadow-2xl backdrop-blur-md items-center justify-center p-8 text-center min-h-[400px]">
        <ShieldCheck className="h-16 w-16 text-emerald-500 mb-4 animate-pulse" />
        <h3 className="font-bold text-zinc-100 text-lg">Command Console Offline</h3>
        <p className="text-zinc-500 text-sm mt-1 max-w-[280px]">
          No emergency reports have been filed. All sectors are currently secured.
        </p>
      </div>
    );
  }

  const meta = CATEGORY_META[alert.category];
  const Icon = meta.icon;

  // Helper to generate a realistic distance centered around default coordinates
  const calculateDistance = (lat: number, lng: number) => {
    const sfLat = 37.7749;
    const sfLng = -122.4194;
    const distance = Math.sqrt(Math.pow(lat - sfLat, 2) + Math.pow(lng - sfLng, 2)) * 111; // Approx km
    return distance < 0.2 ? '0.3' : distance.toFixed(1);
  };

  const calculateETA = (severity: Severity, resolved: boolean) => {
    if (resolved) return 'Secured';
    switch (severity) {
      case 'critical': return '2 - 4 mins';
      case 'high': return '4 - 7 mins';
      case 'medium': return '8 - 12 mins';
      case 'low': return '12 - 18 mins';
    }
  };

  const distance = calculateDistance(alert.latitude, alert.longitude);
  const eta = calculateETA(alert.severity, alert.resolved);

  const handleAgencyChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const agency = e.target.value;
    await updateAlert(alert.id, { assignedAgency: agency === '' ? undefined : agency });
  };

  const handleOpenMap = () => {
    setMapCenter([alert.latitude, alert.longitude]);
    setIsMapModalOpen(true);
  };

  return (
    <div className="flex flex-col h-full w-full rounded-2xl border border-zinc-805 bg-zinc-900/20 shadow-2xl backdrop-blur-md overflow-hidden">
      
      {/* Panel Header */}
      <div className="p-4 border-b border-zinc-850 bg-zinc-950/40 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Activity className="h-4.5 w-4.5 text-red-500 animate-pulse" />
          <h3 className="font-bold text-zinc-100 text-sm sm:text-base">Command Incident Monitor</h3>
        </div>
        {!alert.resolved && (
          <span className="flex items-center gap-1">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                alert.severity === 'critical' ? 'bg-purple-400' : 'bg-red-400'
              }`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${
                alert.severity === 'critical' ? 'bg-purple-500' : 'bg-red-500'
              }`}></span>
            </span>
            <span className="text-[9px] font-bold text-zinc-550 uppercase tracking-widest font-mono">
              LIVE RADAR
            </span>
          </span>
        )}
      </div>

      {/* Main Content Area - Scrollable */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5 scrollbar-thin">
        
        {/* Verification Snapshot Image Header */}
        <div className="relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950/50 aspect-video max-h-52 w-full flex items-center justify-center shrink-0">
          {alert.imageUrl ? (
            <img 
              src={alert.imageUrl} 
              alt="Verification snapshot"
              className="h-full w-full object-cover object-center"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-zinc-650 p-6">
              <AlertTriangle className="h-10 w-10 text-zinc-700 mb-2 animate-bounce" />
              <span className="text-xs uppercase font-extrabold tracking-widest font-mono">No verification image uploaded</span>
              <span className="text-[10px] text-zinc-700 mt-1">Live visual logs are missing for this sector</span>
            </div>
          )}
        </div>

        {/* Proximity Stats Grid */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-zinc-950/50 border border-zinc-850 p-2.5 text-center">
            <div className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider">Distance</div>
            <div className="text-sm font-bold text-zinc-200 mt-1 flex items-center justify-center gap-1">
              <Compass className="h-4 w-4 text-red-500/80" />
              <span>{distance} km</span>
            </div>
          </div>
          <div className="rounded-xl bg-zinc-950/50 border border-zinc-850 p-2.5 text-center">
            <div className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider">Response ETA</div>
            <div className={`text-sm font-bold mt-1 flex items-center justify-center gap-1 ${alert.resolved ? 'text-emerald-400' : 'text-red-400'}`}>
              {alert.resolved ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              ) : (
                <Clock className="h-4 w-4 text-orange-500" />
              )}
              <span>{eta}</span>
            </div>
          </div>
          <div className="rounded-xl bg-zinc-950/50 border border-zinc-850 p-2.5 text-center">
            <div className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider">GPS Marker</div>
            <div className="text-[10px] font-mono text-zinc-350 mt-1.5 truncate" title={`${alert.latitude}, ${alert.longitude}`}>
              {alert.latitude.toFixed(4)}, {alert.longitude.toFixed(4)}
            </div>
          </div>
        </div>

        {/* Hazard Header Box */}
        <div className="space-y-2.5">
          <div className="flex items-center gap-2.5">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${meta.color}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`rounded-full border px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider ${SEVERITY_CLASSES[alert.severity]}`}>
                  {alert.severity}
                </span>
                {alert.resolved && (
                  <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[9px] font-semibold text-emerald-400 tracking-wider">
                    RESOLVED
                  </span>
                )}
              </div>
              <h2 className="text-lg font-bold text-zinc-200 capitalize mt-1 leading-none">{alert.category} Emergency</h2>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <MapPin className="h-3.5 w-3.5 text-red-500" />
            <span className="font-bold text-zinc-350">{alert.location}</span>
          </div>
        </div>

        {/* Description Field */}
        <div className="space-y-1.5">
          <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider block">Incident Logs</span>
          <p className="text-sm leading-relaxed text-zinc-300 bg-zinc-950/30 border border-zinc-850 p-3.5 rounded-xl">
            {alert.description}
          </p>
        </div>

        {/* Agency Dispatch Controller */}
        <div className="rounded-xl border border-zinc-850 bg-zinc-950/20 p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="text-xs font-bold text-zinc-300">Command Node Agency Router</div>
            <div className="text-[10px] text-zinc-500 mt-0.5">Direct emergency response logs to a node</div>
          </div>
          
          <select
            value={alert.assignedAgency || ''}
            onChange={handleAgencyChange}
            disabled={!user}
            className="rounded-lg border border-zinc-800 bg-zinc-950 text-xs text-zinc-300 py-1.5 px-3 outline-none focus:border-zinc-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="">Unassigned (Default: {meta.label})</option>
            <option value="EMS Dispatch">EMS Dispatch (Medical)</option>
            <option value="Fire Rescue">Fire Rescue (Fire)</option>
            <option value="Police Patrol">Police Patrol (Accident / Security)</option>
            <option value="HAZMAT Team">HAZMAT Team (Hazards)</option>
            <option value="Disaster Recovery">Disaster Recovery (Seismic)</option>
            <option value="Rescue Squad">Rescue Squad (Other)</option>
          </select>
        </div>

        {/* GPS Locator Toggle Map Button */}
        <button
          onClick={handleOpenMap}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-zinc-900 border border-zinc-800 py-3 text-sm font-bold text-zinc-200 transition-all hover:bg-zinc-850 hover:text-white cursor-pointer active:scale-[0.99] shadow-md shadow-black/30"
        >
          <Map className="h-4.5 w-4.5 text-red-500" />
          <span>View Live GPS Location Map</span>
        </button>

      </div>

      {/* Action Footbar */}
      <div className="p-4 border-t border-zinc-850 bg-zinc-950/40 flex justify-between items-center gap-3 shrink-0">
        <div className="text-[10px] text-zinc-650 flex items-center gap-1 truncate max-w-[40%]">
          <Activity className="h-3.5 w-3.5 text-zinc-600" />
          <span className="truncate">Reporter: {alert.reporter.split('@')[0]}</span>
        </div>

        <div className="flex gap-2">
          {/* Resolve Action Toggle */}
          <button
            onClick={() => user && resolveAlert(alert.id)}
            disabled={!user}
            className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
              user 
                ? alert.resolved 
                  ? 'bg-zinc-850 text-zinc-300 hover:bg-zinc-800' 
                  : 'bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-600/20 hover:text-emerald-300'
                : 'bg-zinc-950/20 text-zinc-600 border border-zinc-900/50 cursor-not-allowed'
            }`}
          >
            {user ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            ) : (
              <Shield className="h-4 w-4 shrink-0 text-zinc-700" />
            )}
            <span>{alert.resolved ? 'Re-open Threat' : 'Resolve Threat'}</span>
          </button>

          {/* Delete Action (restricted to System Admin) */}
          {user && user.role === 'admin' && (
            <button
              onClick={() => deleteAlert(alert.id)}
              className="flex items-center justify-center rounded-xl border border-red-500/20 bg-red-950/10 p-2 text-red-400 transition-all hover:bg-red-500 hover:text-white cursor-pointer"
              title="Delete Incident Log"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Map Lightbox Modal */}
      {isMapModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-4xl h-[70vh] rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4 bg-zinc-950/40">
              <div className="flex items-center gap-2">
                <Navigation className="h-4.5 w-4.5 text-red-500 animate-pulse" />
                <h3 className="text-sm sm:text-base font-bold text-white uppercase tracking-wider">Incident GPS Locator Radar</h3>
              </div>
              <button
                onClick={() => setIsMapModalOpen(false)}
                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-850 hover:text-white cursor-pointer transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 min-h-0">
              <AlertsMap />
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
