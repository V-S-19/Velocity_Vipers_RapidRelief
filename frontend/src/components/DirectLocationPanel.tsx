import React, { useState } from 'react';
import { useAlerts, type Category, type Severity } from '../context/AlertContext';
import { 
  Compass, Clock, Navigation, 
  Activity, CheckCircle2, Flame, Droplet, HeartPulse, Car, Globe, HelpCircle 
} from 'lucide-react';

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
  high: 'bg-red-500/10 text-red-400 border-red-500/20',
  critical: 'bg-purple-500/10 text-purple-400 border-purple-500/20 animate-pulse',
};

export const DirectLocationPanel: React.FC = () => {
  const { alerts, setMapCenter } = useAlerts();
  const [filter, setFilter] = useState<'all' | 'active' | 'resolved'>('active');

  const filteredAlerts = alerts.filter(alert => {
    if (filter === 'active') return !alert.resolved;
    if (filter === 'resolved') return alert.resolved;
    return true;
  });

  // Helper to generate a realistic deterministic distance based on lat/lng coordinates
  const calculateDistance = (lat: number, lng: number) => {
    // Distance offset centered around default SF location
    const sfLat = 37.7749;
    const sfLng = -122.4194;
    const distance = Math.sqrt(Math.pow(lat - sfLat, 2) + Math.pow(lng - sfLng, 2)) * 111; // Approx km
    return distance < 0.2 ? '0.3' : distance.toFixed(1);
  };

  // Helper to get estimated response ETA
  const calculateETA = (severity: Severity, resolved: boolean) => {
    if (resolved) return 'Secured';
    switch (severity) {
      case 'critical': return '2 - 4 mins';
      case 'high': return '4 - 7 mins';
      case 'medium': return '8 - 12 mins';
      case 'low': return '12 - 18 mins';
    }
  };

  const handleFocus = (alert: any) => {
    setMapCenter([alert.latitude, alert.longitude]);
  };

  return (
    <div className="flex flex-col h-full w-full rounded-2xl border border-zinc-800 bg-zinc-900/20 shadow-2xl backdrop-blur-md overflow-hidden">
      
      {/* Panel Header */}
      <div className="p-4 border-b border-zinc-850 bg-zinc-950/40 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <Navigation className="h-4.5 w-4.5 text-red-500 animate-pulse" />
          <h3 className="font-bold text-zinc-100 text-sm sm:text-base">Direct Location Command</h3>
        </div>

        {/* Filter Tabs */}
        <div className="flex rounded-lg bg-zinc-950/80 p-0.5 border border-zinc-805">
          {(['active', 'resolved', 'all'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`rounded px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
                filter === tab 
                  ? 'bg-red-650 text-white shadow-md' 
                  : 'text-zinc-550 hover:text-zinc-350'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Main List Section */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 max-h-[500px] scrollbar-thin">
        {filteredAlerts.length > 0 ? (
          filteredAlerts.map(alert => {
            const meta = CATEGORY_META[alert.category];
            const Icon = meta.icon;
            const distance = calculateDistance(alert.latitude, alert.longitude);
            const eta = calculateETA(alert.severity, alert.resolved);

            return (
              <div
                key={alert.id}
                onClick={() => handleFocus(alert)}
                className={`group relative rounded-xl border p-4 transition-all duration-300 hover:scale-[1.01] hover:bg-zinc-900/40 cursor-pointer ${
                  alert.resolved 
                    ? 'border-zinc-850 opacity-60 bg-zinc-950/20' 
                    : alert.severity === 'critical'
                    ? 'border-purple-500/20 hover:border-purple-500/40 bg-purple-950/5'
                    : 'border-zinc-800 hover:border-zinc-700 bg-zinc-900/10'
                }`}
              >
                {/* Visual live status ring for active items */}
                {!alert.resolved && (
                  <div className="absolute top-4 right-4 flex items-center gap-1.5">
                    <span className="relative flex h-2 w-2">
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                        alert.severity === 'critical' ? 'bg-purple-400' : 'bg-red-400'
                      }`}></span>
                      <span className={`relative inline-flex rounded-full h-2 w-2 ${
                        alert.severity === 'critical' ? 'bg-purple-500' : 'bg-red-500'
                      }`}></span>
                    </span>
                    <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest font-mono">
                      LIVE BEACON
                    </span>
                  </div>
                )}

                <div className="flex items-start gap-3.5">
                  {/* Left Category Icon Badge */}
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${meta.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>

                  {/* Main Details Grid */}
                  <div className="flex-1 min-w-0 space-y-2">
                    
                    {/* Header Row: severity badge & category name */}
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full border px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide ${SEVERITY_CLASSES[alert.severity]}`}>
                        {alert.severity}
                      </span>
                      <span className="text-xs font-semibold text-zinc-400 capitalize">
                        {alert.category} Report
                      </span>
                    </div>

                    {/* Street Address */}
                    <div className="text-sm font-bold text-zinc-200 truncate group-hover:text-white">
                      {alert.location}
                    </div>

                    {/* Proximity Stats Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                      
                      {/* Precise Coordinates Badge */}
                      <div className="rounded-lg bg-zinc-950/60 border border-zinc-850 p-2 text-center">
                        <div className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider">Coordinates</div>
                        <div className="text-[10px] font-mono text-zinc-350 mt-0.5">
                          {alert.latitude.toFixed(4)}, {alert.longitude.toFixed(4)}
                        </div>
                      </div>

                      {/* Distance estimation */}
                      <div className="rounded-lg bg-zinc-950/60 border border-zinc-850 p-2 text-center flex items-center justify-center gap-1.5">
                        <Compass className="h-3.5 w-3.5 text-zinc-650 shrink-0" />
                        <div className="text-left">
                          <div className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider">Distance</div>
                          <div className="text-[11px] font-bold text-zinc-350">{distance} km away</div>
                        </div>
                      </div>

                      {/* Estimated response ETA */}
                      <div className="rounded-lg bg-zinc-950/60 border border-zinc-850 p-2 text-center col-span-2 sm:col-span-1 flex items-center justify-center gap-1.5">
                        {alert.resolved ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                        ) : (
                          <Clock className="h-3.5 w-3.5 text-red-400" />
                        )}
                        <div className="text-left">
                          <div className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider">Response ETA</div>
                          <div className={`text-[11px] font-bold ${alert.resolved ? 'text-emerald-400' : 'text-red-450'}`}>
                            {eta}
                          </div>
                        </div>
                      </div>

                    </div>

                    {/* Dispatch Target Details */}
                    {!alert.resolved && (
                      <div className="flex items-center gap-1.5 pt-1 text-[10px] text-zinc-550">
                        <Activity className="h-3.5 w-3.5 text-zinc-600" />
                        <span>Command Node Route: </span>
                        <span className="font-bold text-zinc-400">
                          {alert.assignedAgency ? alert.assignedAgency.toUpperCase() : meta.label.toUpperCase()}
                        </span>
                      </div>
                    )}

                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <CheckCircle2 className="h-12 w-12 text-emerald-500 mb-3 animate-pulse" />
            <h4 className="text-zinc-350 font-bold text-sm">All Incident Locations Secured</h4>
            <p className="text-xs text-zinc-500 mt-1 max-w-[240px]">
              There are no active emergency alerts requiring command dispatching at this moment.
            </p>
          </div>
        )}
      </div>

      {/* Floating Info Status Overlay */}
      <div className="p-3 border-t border-zinc-850 bg-zinc-950/30 flex justify-between items-center text-[10px] text-zinc-550 shrink-0">
        <span>INCIDENT LOCATOR SCOPE</span>
        <div className="flex items-center gap-3 font-mono font-bold">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-purple-500"></span>
            CRITICAL
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-red-500"></span>
            HIGH
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
            RESOLVED
          </span>
        </div>
      </div>

    </div>
  );
};
