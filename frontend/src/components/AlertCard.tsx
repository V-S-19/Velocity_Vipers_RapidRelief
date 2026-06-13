import React from 'react';
import { useAlerts, type Alert, type Severity, type Category } from '../context/AlertContext';
import { 
  Flame, Droplet, HeartPulse, Car, Globe, HelpCircle, 
  MapPin, Clock, User, CheckCircle2, Trash2, Lock 
} from 'lucide-react';

interface AlertCardProps {
  alert: Alert;
}

const CATEGORY_META: Record<Category, { icon: any; label: string; color: string }> = {
  fire: { icon: Flame, label: 'Fire & Smoke', color: 'text-red-500 bg-red-500/10' },
  flood: { icon: Droplet, label: 'Flood & Water', color: 'text-blue-500 bg-blue-500/10' },
  medical: { icon: HeartPulse, label: 'Medical Emergency', color: 'text-emerald-500 bg-emerald-500/10' },
  accident: { icon: Car, label: 'Vehicle Accident', color: 'text-orange-500 bg-orange-500/10' },
  earthquake: { icon: Globe, label: 'Earthquake', color: 'text-amber-500 bg-amber-500/10' },
  other: { icon: HelpCircle, label: 'Hazard Alert', color: 'text-purple-500 bg-purple-500/10' },
};

const SEVERITY_CLASSES: Record<Severity, { badge: string; border: string; glow: string }> = {
  low: { 
    badge: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20', 
    border: 'border-l-yellow-500', 
    glow: 'group-hover:shadow-[0_0_15px_rgba(234,179,8,0.05)]' 
  },
  medium: { 
    badge: 'bg-orange-500/10 text-orange-400 border-orange-500/20', 
    border: 'border-l-orange-500', 
    glow: 'group-hover:shadow-[0_0_15px_rgba(249,115,22,0.07)]' 
  },
  high: { 
    badge: 'bg-red-500/15 text-red-400 border-red-500/30', 
    border: 'border-l-red-500', 
    glow: 'group-hover:shadow-[0_0_20px_rgba(239,68,68,0.1)]' 
  },
  critical: { 
    badge: 'bg-purple-500/15 text-purple-400 border-purple-500/30 animate-pulse', 
    border: 'border-l-purple-500', 
    glow: 'group-hover:shadow-[0_0_25px_rgba(168,85,247,0.15)] shadow-[inset_0_0_10px_rgba(168,85,247,0.05)]' 
  },
};

export const AlertCard: React.FC<AlertCardProps> = ({ alert }) => {
  const { user, resolveAlert, deleteAlert } = useAlerts();

  const { icon: Icon, label } = CATEGORY_META[alert.category];
  const severityStyle = SEVERITY_CLASSES[alert.severity];

  const formatElapsedTime = (date: Date) => {
    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div 
      className={`group relative flex flex-col justify-between overflow-hidden rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-4 transition-all duration-300 hover:border-zinc-700/80 hover:bg-zinc-900/70 border-l-4 ${severityStyle.border} ${severityStyle.glow} ${
        alert.resolved ? 'opacity-60 grayscale-[30%] border-l-zinc-700' : ''
      }`}
    >
      <div>
        {/* Top Header Row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${CATEGORY_META[alert.category].color}`}>
              <Icon className="h-4.5 w-4.5" />
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                {label}
              </span>
              <div className="text-[10px] text-zinc-400 flex items-center gap-1">
                <Clock className="h-3 w-3 text-zinc-500" />
                <span>{formatElapsedTime(alert.timestamp)}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5">
            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${severityStyle.badge}`}>
              {alert.severity}
            </span>
            {alert.resolved && (
              <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                RESOLVED
              </span>
            )}
          </div>
        </div>

        {/* Location Coordinates Tag */}
        <div className="mt-3 flex items-start gap-1.5 text-zinc-300">
          <MapPin className="h-4 w-4 shrink-0 text-zinc-500 mt-0.5" />
          <div className="text-sm">
            <span className="font-medium text-zinc-200">{alert.location}</span>
            <div className="text-[10px] font-mono text-zinc-500 mt-0.5">
              Lat: {alert.latitude.toFixed(5)} / Lng: {alert.longitude.toFixed(5)}
            </div>
          </div>
        </div>

        {/* Incident Description */}
        <p className="mt-3 text-sm leading-relaxed text-zinc-300 line-clamp-3">
          {alert.description}
        </p>

        {/* Image Attachment Rendering */}
        {alert.imageUrl && (
          <div className="mt-3 overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950/20">
            <img 
              src={alert.imageUrl} 
              alt={`${alert.category} scene`} 
              className="h-36 w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              loading="lazy"
            />
          </div>
        )}
      </div>

      {/* Footer Details & Action controls */}
      <div className="mt-4 flex items-center justify-between border-t border-zinc-800/80 pt-3 text-xs">
        <div className="flex items-center gap-1.5 text-zinc-500 max-w-[50%]">
          <User className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate" title={alert.reporter}>
            {alert.reporter.split('@')[0]}
          </span>
        </div>

        <div className="flex gap-2">
          {/* Resolve Action Toggle */}
          <button
            onClick={() => user && resolveAlert(alert.id)}
            disabled={!user}
            title={user ? 'Toggle resolution status' : 'Log in to mark as resolved'}
            className={`flex items-center gap-1 rounded-md px-2 py-1 transition-all ${
              user 
                ? alert.resolved 
                  ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' 
                  : 'bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-600/20 hover:text-emerald-300'
                : 'bg-zinc-950/20 text-zinc-600 border border-zinc-900/50 cursor-not-allowed'
            }`}
          >
            {user ? (
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
            ) : (
              <Lock className="h-3.5 w-3.5 shrink-0 text-zinc-700" />
            )}
            <span>{alert.resolved ? 'Re-open' : 'Resolve'}</span>
          </button>

          {/* Delete action (only enabled for auth users) */}
          {user && (
            <button
              onClick={() => deleteAlert(alert.id)}
              title="Delete this incident report"
              className="flex items-center justify-center rounded-md border border-red-500/20 bg-red-950/10 p-1 text-red-400 transition-all hover:bg-red-500 hover:text-white"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
