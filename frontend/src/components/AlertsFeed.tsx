import React, { useState, useMemo } from 'react';
import { useAlerts, type Severity, type Category } from '../context/AlertContext';
import { AlertCard } from './AlertCard';
import { Search, SlidersHorizontal, AlertCircle, Eye, EyeOff } from 'lucide-react';

interface AlertsFeedProps {
  selectedAlertId: string | null;
  onSelectAlert: (id: string) => void;
}

export const AlertsFeed: React.FC<AlertsFeedProps> = ({ selectedAlertId, onSelectAlert }) => {
  const { alerts } = useAlerts();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<Severity | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<Category | 'all'>('all');
  const [showResolved, setShowResolved] = useState(true);

  // Filter logic
  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      // 1. Search Query
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch = query === '' || 
        alert.location.toLowerCase().includes(query) ||
        alert.description.toLowerCase().includes(query) ||
        alert.category.toLowerCase().includes(query);

      // 2. Severity Filter
      const matchesSeverity = selectedSeverity === 'all' || alert.severity === selectedSeverity;

      // 3. Category Filter
      const matchesCategory = selectedCategory === 'all' || alert.category === selectedCategory;

      // 4. Resolved Filter
      const matchesResolved = showResolved ? true : !alert.resolved;

      return matchesSearch && matchesSeverity && matchesCategory && matchesResolved;
    });
  }, [alerts, searchQuery, selectedSeverity, selectedCategory, showResolved]);

  const activeAlertsCount = filteredAlerts.length;

  return (
    <div className="flex flex-col h-full bg-zinc-950/20 border border-zinc-800/60 rounded-2xl overflow-hidden">
      
      {/* Filters Header */}
      <div className="p-4 border-b border-zinc-800/80 bg-zinc-900/20 space-y-3 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4.5 w-4.5 text-red-500" />
            <h3 className="font-bold text-zinc-100 text-sm sm:text-base">Alerts Feed</h3>
          </div>
          <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full font-semibold">
            {activeAlertsCount} Reports
          </span>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute top-3 left-3 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by location, hazard..."
            className="w-full rounded-xl border border-zinc-850 bg-zinc-950/40 py-2 pl-10 pr-4 text-sm text-white placeholder-zinc-650 outline-none transition-all focus:border-red-500/50"
          />
        </div>

        {/* Filters Selectors Row */}
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as Category | 'all')}
            className="w-full rounded-lg border border-zinc-850 bg-zinc-950 text-xs text-zinc-400 py-1.5 px-2 outline-none focus:border-zinc-700 cursor-pointer"
          >
            <option value="all">All Hazards</option>
            <option value="fire">Fire & Smoke</option>
            <option value="flood">Flood & Water</option>
            <option value="medical">Medical Emergency</option>
            <option value="accident">Vehicle Accident</option>
            <option value="earthquake">Earthquake</option>
            <option value="other">Other Hazards</option>
          </select>

          {/* Hide/Show Resolved Toggle */}
          <button
            onClick={() => setShowResolved(prev => !prev)}
            className={`flex items-center justify-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer ${
              showResolved 
                ? 'bg-zinc-900 border-zinc-850 text-zinc-400 hover:text-zinc-200' 
                : 'bg-orange-500/15 border-orange-500/20 text-orange-400'
            }`}
            title={showResolved ? 'Hide resolved incidents' : 'Show resolved incidents'}
          >
            {showResolved ? (
              <>
                <Eye className="h-3.5 w-3.5" />
                <span>Show Resolved</span>
              </>
            ) : (
              <>
                <EyeOff className="h-3.5 w-3.5" />
                <span>Active Only</span>
              </>
            )}
          </button>
        </div>

        {/* Severity Tabs */}
        <div className="flex gap-1 overflow-x-auto pb-1 border-t border-zinc-850 pt-2.5 shrink-0 scrollbar-none">
          {['all', 'critical', 'high', 'medium', 'low'].map((sev) => {
            const isSelected = selectedSeverity === sev;
            const style = isSelected 
              ? sev === 'critical'
                ? 'bg-purple-650 text-white font-semibold shadow-[0_0_10px_rgba(168,85,247,0.4)]'
                : sev === 'high'
                ? 'bg-red-650 text-white font-semibold shadow-[0_0_10px_rgba(220,38,38,0.4)]'
                : sev === 'medium'
                ? 'bg-orange-650 text-white font-semibold shadow-[0_0_10px_rgba(249,115,22,0.4)]'
                : sev === 'low'
                ? 'bg-yellow-650 text-white font-semibold shadow-[0_0_10px_rgba(202,138,4,0.4)]'
                : 'bg-zinc-200 text-zinc-900 font-semibold'
              : 'bg-zinc-900 hover:bg-zinc-850 text-zinc-400 border border-zinc-850';
            
            return (
              <button
                key={sev}
                type="button"
                onClick={() => setSelectedSeverity(sev as Severity | 'all')}
                className={`rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer select-none shrink-0 ${style}`}
              >
                {sev}
              </button>
            );
          })}
        </div>
      </div>

      {/* Cards List Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
        {filteredAlerts.length > 0 ? (
          filteredAlerts.map((alert) => (
            <AlertCard 
              key={alert.id} 
              alert={alert} 
              isSelected={alert.id === selectedAlertId}
              onSelect={onSelectAlert}
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <AlertCircle className="h-10 w-10 text-zinc-600 mb-3 animate-pulse" />
            <h4 className="text-zinc-400 font-semibold text-sm">No Incidents Found</h4>
            <p className="text-xs text-zinc-500 max-w-[200px] mt-1">
              Try adjusting your search query or severity filters.
            </p>
          </div>
        )}
      </div>

    </div>
  );
};
