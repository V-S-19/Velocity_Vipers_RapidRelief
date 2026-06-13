import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAlerts } from '../context/AlertContext';
import { ShieldAlert, LogIn, LogOut, Radio, Activity } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout, alerts } = useAlerts();
  const navigate = useNavigate();

  const activeAlertsCount = alerts.filter(a => !a.resolved).length;
  const criticalCount = alerts.filter(a => !a.resolved && a.severity === 'critical').length;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-800/80 bg-zinc-950/70 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Brand logo */}
        <Link to="/" className="flex items-center gap-2.5 transition-transform hover:scale-[1.02]">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-600 shadow-[0_0_15px_rgba(220,38,38,0.5)]">
            <ShieldAlert className="h-6 w-6 text-white animate-pulse" />
          </div>
          <div>
            <span className="font-sans text-xl font-bold tracking-tight text-white sm:text-2xl">
              Rapid<span className="bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">Relief</span>
            </span>
            <div className="hidden text-[10px] font-semibold uppercase tracking-widest text-zinc-500 sm:block">
              Emergency Network
            </div>
          </div>
        </Link>

        {/* System & Alert Status */}
        <div className="hidden items-center gap-6 md:flex">
          <div className="flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-3 py-1 text-xs font-semibold text-emerald-400">
            <Radio className="h-3.5 w-3.5 animate-pulse" />
            <span className="uppercase tracking-wider">SYSTEMS OPERATIONAL</span>
          </div>

          <div className="flex items-center gap-4 border-l border-zinc-800 pl-6 text-sm">
            <div className="flex items-center gap-1.5 text-zinc-400">
              <Activity className="h-4 w-4 text-zinc-500" />
              <span>Active Alerts:</span>
              <span className={`font-bold ${activeAlertsCount > 0 ? 'text-orange-500' : 'text-emerald-400'}`}>
                {activeAlertsCount}
              </span>
            </div>

            {criticalCount > 0 && (
              <div className="flex items-center gap-1.5 animate-pulse text-red-500 font-bold">
                <span className="h-2 w-2 rounded-full bg-red-500"></span>
                <span>{criticalCount} Critical Crisis</span>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Action Buttons */}
        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="hidden flex-col items-end text-right sm:flex">
                <span className="text-xs text-zinc-400">Signed in as</span>
                <span className="max-w-[150px] truncate text-sm font-medium text-zinc-200" title={user.email}>
                  {user.email}
                </span>
              </div>
              <button
                onClick={() => {
                  logout();
                  navigate('/');
                }}
                className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/60 px-3.5 py-1.5 text-sm font-medium text-zinc-300 transition-all hover:bg-zinc-800 hover:text-white hover:border-zinc-700"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => navigate('/login')}
              className="flex items-center gap-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 px-4 py-2 text-sm font-medium transition-all hover:bg-zinc-800 hover:text-white hover:border-zinc-700"
            >
              <LogIn className="h-4 w-4 text-red-500" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
