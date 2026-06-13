import React, { useState } from 'react';
import { Navbar } from '../components/Navbar';
import { DirectLocationPanel } from '../components/DirectLocationPanel';
import { AlertsFeed } from '../components/AlertsFeed';
import { ReportModal } from '../components/ReportModal';
import { SimulatorControl } from '../components/SimulatorControl';
import { useAlerts } from '../context/AlertContext';
import { AlertOctagon, ShieldAlert, Sparkles, CheckCircle2 } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { alerts } = useAlerts();
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Stats summaries
  const totalReports = alerts.length;
  const activeReports = alerts.filter((a) => !a.resolved).length;
  const resolvedReports = alerts.filter((a) => a.resolved).length;
  
  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 text-zinc-100">
      <Navbar />

      {/* Main Container */}
      <main className="mx-auto flex-1 w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        
        {/* Urgent Hero Section */}
        <section className="relative overflow-hidden rounded-2xl border border-red-500/20 bg-gradient-to-br from-zinc-900 via-zinc-950 to-red-950/20 p-6 md:p-8">
          {/* Subtle Grid overlay background */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293710_1px,transparent_1px),linear-gradient(to_bottom,#1f293710_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 border border-red-500/20 px-3 py-1 text-xs font-medium text-red-400">
                <Sparkles className="h-3.5 w-3.5" />
                <span>SECONDS SAVE LIVES</span>
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-white md:text-4xl lg:text-5xl leading-none! m-0!">
                Rapid Disaster & Emergency Reporting
              </h1>
              <p className="text-zinc-400 text-sm md:text-base leading-relaxed pt-1">
                Report structural fire, flood hazards, medical crisis, or severe vehicle collisions. Instantly notifies dispatchers and pins locations for community awareness.
              </p>
            </div>

            {/* Massive Pulsating CTA Button */}
            <div className="flex flex-col items-center shrink-0">
              <button
                onClick={() => setIsReportModalOpen(true)}
                className="group relative flex h-28 w-64 items-center justify-center rounded-2xl bg-gradient-to-r from-red-600 to-orange-600 text-white font-extrabold text-lg tracking-wider uppercase transition-all duration-300 active:scale-95 shadow-[0_0_20px_rgba(220,38,38,0.3)] animate-pulse-glow"
              >
                {/* Glow ring underlay */}
                <span className="absolute inset-0 rounded-2xl border-2 border-red-500/30 scale-105 group-hover:scale-110 transition-transform duration-300"></span>
                <span className="absolute inset-0 rounded-2xl bg-gradient-to-r from-red-500 to-orange-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                
                <div className="relative flex flex-col items-center gap-1">
                  <ShieldAlert className="h-7 w-7 text-white animate-bounce" />
                  <span>Report Emergency</span>
                </div>
              </button>
              <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 mt-2.5">
                Requires Location Authorization
              </span>
            </div>
          </div>
        </section>

        {/* Stats Grid Counters */}
        <section className="grid grid-cols-3 gap-4">
          <div className="rounded-xl border border-zinc-850 bg-zinc-900/20 p-3 sm:p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] sm:text-xs font-bold text-zinc-500 uppercase tracking-wider">Total Filed</span>
              <div className="text-xl sm:text-2xl font-bold text-zinc-200 mt-0.5">{totalReports}</div>
            </div>
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-zinc-900 flex items-center justify-center text-zinc-400 border border-zinc-800">
              <AlertOctagon className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
          </div>
          <div className="rounded-xl border border-red-500/10 bg-red-950/5 p-3 sm:p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] sm:text-xs font-bold text-red-400/70 uppercase tracking-wider">Active Threat</span>
              <div className="text-xl sm:text-2xl font-bold text-red-500 mt-0.5">{activeReports}</div>
            </div>
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400 border border-red-500/20">
              <ShieldAlert className="h-4 w-4 sm:h-5 sm:w-5 animate-pulse" />
            </div>
          </div>
          <div className="rounded-xl border border-emerald-500/10 bg-emerald-950/5 p-3 sm:p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] sm:text-xs font-bold text-emerald-400/70 uppercase tracking-wider">Secured Zone</span>
              <div className="text-xl sm:text-2xl font-bold text-emerald-400 mt-0.5">{resolvedReports}</div>
            </div>
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
          </div>
        </section>

        {/* Dashboard Work Grid Split */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch min-h-[550px]">
          {/* Left panel: Direct Location Panel */}
          <div className="lg:col-span-7 h-[350px] lg:h-auto min-h-[350px]">
            <DirectLocationPanel />
          </div>

          {/* Right panel: Alerts Feed and Simulator Widget */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="flex-1 min-h-[380px] max-h-[500px]">
              <AlertsFeed />
            </div>
            <SimulatorControl />
          </div>
        </section>

      </main>

      {/* Emergency Report Modal */}
      <ReportModal 
        isOpen={isReportModalOpen} 
        onClose={() => setIsReportModalOpen(false)} 
      />
    </div>
  );
};
