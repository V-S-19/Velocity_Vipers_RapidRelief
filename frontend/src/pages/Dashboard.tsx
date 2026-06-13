import React, { useState } from 'react';
import { Navbar } from '../components/Navbar';
import { DirectLocationPanel } from '../components/DirectLocationPanel';
import { AlertsFeed } from '../components/AlertsFeed';
import { ReportModal } from '../components/ReportModal';
import { SimulatorControl } from '../components/SimulatorControl';
import { useAlerts } from '../context/AlertContext';
import { SlidersHorizontal } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { alerts } = useAlerts();
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);
  const [isSimExpanded, setIsSimExpanded] = useState(false);

  // Stats summaries
  const totalReports = alerts.length;
  const activeReports = alerts.filter((a) => !a.resolved).length;
  const resolvedReports = alerts.filter((a) => a.resolved).length;
  
  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 text-zinc-100">
      
      {/* Navbar with Report modal trigger callback */}
      <Navbar onReportClick={() => setIsReportModalOpen(true)} />

      {/* Sleek Horizontal Status Bar */}
      <div className="border-b border-zinc-900 bg-zinc-950/20 py-3 shrink-0">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <span className="text-[10px] sm:text-xs font-bold text-zinc-500 uppercase tracking-widest">
              Command System Status
            </span>
            
            <div className="flex items-center gap-4 border-l border-zinc-800/80 pl-6 text-xs sm:text-sm">
              <div className="flex items-center gap-1.5 text-zinc-400">
                <span className="text-zinc-550">Total Filed:</span>
                <span className="font-bold text-zinc-200">{totalReports}</span>
              </div>
              
              <div className="flex items-center gap-1.5 text-zinc-400">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
                <span className="text-zinc-550">Active Threats:</span>
                <span className="font-bold text-red-500">{activeReports}</span>
              </div>
              
              <div className="flex items-center gap-1.5 text-zinc-400">
                <span className="text-zinc-550">Secured Zones:</span>
                <span className="font-bold text-emerald-400">{resolvedReports}</span>
              </div>
            </div>
          </div>

          {/* Toggle Simulator Trigger */}
          <button
            onClick={() => setIsSimExpanded(prev => !prev)}
            className={`flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
              isSimExpanded 
                ? 'bg-zinc-850 border-zinc-850 text-white' 
                : 'bg-zinc-950 border-zinc-850 text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span>{isSimExpanded ? 'Hide Simulator' : 'Show Simulator'}</span>
          </button>
        </div>
      </div>

      {/* Main Container */}
      <main className="mx-auto flex-1 w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 flex flex-col gap-6 min-h-0">
        
        {/* Dashboard Work Grid Split - Master Detail Layout */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch flex-1 min-h-[500px]">
          {/* Left panel: Compact Alerts Feed (5/12 columns) */}
          <div className="lg:col-span-5 h-[350px] lg:h-auto min-h-[350px] flex flex-col">
            <AlertsFeed 
              selectedAlertId={selectedAlertId}
              onSelectAlert={setSelectedAlertId}
            />
          </div>

          {/* Right panel: Detail Command Monitor View (7/12 columns) */}
          <div className="lg:col-span-7 h-[450px] lg:h-auto min-h-[450px] flex flex-col">
            <DirectLocationPanel selectedAlertId={selectedAlertId} />
          </div>
        </section>

        {/* Collapsible Simulator Panel */}
        {isSimExpanded && (
          <div className="rounded-2xl border border-zinc-850 bg-zinc-950/40 p-4 shrink-0 transition-all duration-300">
            <SimulatorControl />
          </div>
        )}

      </main>

      {/* Emergency Report Modal */}
      <ReportModal 
        isOpen={isReportModalOpen} 
        onClose={() => setIsReportModalOpen(false)} 
      />
    </div>
  );
};
