import React from 'react';
import { type Alert, type Severity, type Category } from '../context/AlertContext';
import { Flame, Droplet, HeartPulse, Car, Globe, HelpCircle, Clock } from 'lucide-react';

interface AlertCardProps {
  alert: Alert;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
}

const CATEGORY_META: Record<Category, { icon: any; label: string; color: string }> = {
  fire: { icon: Flame, label: 'Fire & Smoke', color: 'text-red-500 bg-red-500/10' },
  flood: { icon: Droplet, label: 'Flood & Water', color: 'text-blue-500 bg-blue-500/10' },
  medical: { icon: HeartPulse, label: 'Medical Emergency', color: 'text-emerald-500 bg-emerald-500/10' },
  accident: { icon: Car, label: 'Vehicle Accident', color: 'text-orange-500 bg-orange-500/10' },
  earthquake: { icon: Globe, label: 'Earthquake', color: 'text-amber-500 bg-amber-500/10' },
  other: { icon: HelpCircle, label: 'Hazard Alert', color: 'text-purple-500 bg-purple-500/10' },
};

const SEVERITY_CLASSES: Record<Severity, { badge: string; border: string }> = {
  low: { 
    badge: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20', 
    border: 'border-l-yellow-500' 
  },
  medium: { 
    badge: 'bg-orange-500/10 text-orange-400 border-orange-500/20', 
    border: 'border-l-orange-500' 
  },
  high: { 
    badge: 'bg-red-500/15 text-red-400 border-red-500/30', 
    border: 'border-l-red-500' 
  },
  critical: { 
    badge: 'bg-purple-500/15 text-purple-400 border-purple-500/30 animate-pulse', 
    border: 'border-l-purple-500' 
  },
};

export const AlertCard: React.FC<AlertCardProps> = ({ alert, isSelected, onSelect }) => {
  const { icon: Icon, label } = CATEGORY_META[alert.category];
  const severityStyle = SEVERITY_CLASSES[alert.severity];

  const formatElapsedTime = (date: Date) => {
    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  return (
    <div 
      onClick={() => onSelect && onSelect(alert.id)}
      className={`group relative flex items-center justify-between overflow-hidden rounded-xl border p-3.5 transition-all duration-200 cursor-pointer border-l-4 ${severityStyle.border} ${
        isSelected
          ? 'border-red-500/50 bg-red-500/5 shadow-[0_0_15px_rgba(239,68,68,0.08)] scale-[1.01]'
          : 'border-zinc-800/80 bg-zinc-900/20 hover:border-zinc-700/80 hover:bg-zinc-900/50'
      } ${alert.resolved ? 'opacity-60 grayscale-[30%] border-l-zinc-700' : ''}`}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Category Icon Badge */}
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${CATEGORY_META[alert.category].color}`}>
          <Icon className="h-4.5 w-4.5" />
        </div>
        
        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-500 truncate">
              {label}
            </span>
            <span className="text-[9px] text-zinc-500 flex items-center gap-1 font-mono shrink-0">
              <Clock className="h-2.5 w-2.5 text-zinc-600" />
              <span>{formatElapsedTime(alert.timestamp)}</span>
            </span>
          </div>

          <div className="text-sm font-bold text-zinc-200 truncate mt-0.5 group-hover:text-white">
            {alert.location}
          </div>
        </div>
      </div>

      {/* Badges Column */}
      <div className="flex flex-col items-end gap-1.5 pl-3 shrink-0">
        <span className={`rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${severityStyle.badge}`}>
          {alert.severity}
        </span>
        {alert.resolved && (
          <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[9px] font-semibold text-emerald-400">
            RESOLVED
          </span>
        )}
      </div>
    </div>
  );
};
