import React, { useState, useEffect, useRef } from 'react';
import { Navbar } from '../components/Navbar';
import { AlertsMap } from '../components/AlertsMap';
import { useAlerts, type Alert, type Severity, type Category } from '../context/AlertContext';
import { 
  CheckCircle2, AlertOctagon, Trash2, 
  Clock, MapPin, User, Settings, Plus, AlertTriangle, Send, 
  Terminal, Edit3, Check, X, ShieldAlert as ShieldIcon
} from 'lucide-react';

const CATEGORIES: Category[] = ['fire', 'flood', 'medical', 'accident', 'earthquake', 'other'];
const SEVERITIES: Severity[] = ['low', 'medium', 'high', 'critical'];
const AGENCIES = ['Fire Rescue', 'Police Patrol', 'EMS Dispatch', 'HAZMAT Team', 'Disaster Recovery', 'Coast Guard'];

export const AdminDashboard: React.FC = () => {
  const { 
    alerts, user, login, updateAlert, deleteAlert, resolveAlert, createAlert, mapCenter
  } = useAlerts();

  // Authentication bypass state (for demo/reviewers)
  const [isBypassing, setIsBypassing] = useState(false);

  // Inline editing state for descriptions
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDesc, setEditDesc] = useState('');

  // Custom alert form state
  const [customCat, setCustomCat] = useState<Category>('fire');
  const [customSev, setCustomSev] = useState<Severity>('medium');
  const [customLoc, setCustomLoc] = useState('');
  const [customDesc, setCustomDesc] = useState('');
  const [customLat, setCustomLat] = useState('');
  const [customLng, setCustomLng] = useState('');

  // Audit Logs State
  const [logs, setLogs] = useState<string[]>([
    `[${new Date().toLocaleTimeString()}] [SYSTEM INITIALIZED] Decentralized ledgers operational.`,
    `[${new Date().toLocaleTimeString()}] [STANDBY] Ready for emergency dispatcher logs.`
  ]);

  // Keep track of previous alerts to reactively generate logs
  const prevAlertsRef = useRef<Alert[]>([]);

  useEffect(() => {
    const prevAlerts = prevAlertsRef.current;
    
    // Check if alerts array loaded or changed
    if (prevAlerts.length > 0) {
      const timeStr = new Date().toLocaleTimeString();

      // 1. Alert Added
      if (alerts.length > prevAlerts.length) {
        const newAlert = alerts.find(a => !prevAlerts.some(pa => pa.id === a.id));
        if (newAlert) {
          setLogs(prev => [
            `[${timeStr}] [INCOMING REPORT] ${newAlert.severity.toUpperCase()} ${newAlert.category.toUpperCase()} hazard reported at "${newAlert.location}" by ${newAlert.reporter.split('@')[0]}`,
            ...prev
          ]);
        }
      } 
      // 2. Alert Deleted
      else if (alerts.length < prevAlerts.length) {
        const deletedAlert = prevAlerts.find(pa => !alerts.some(a => a.id === pa.id));
        if (deletedAlert) {
          setLogs(prev => [
            `[${timeStr}] [DATABASE DELETE] Incident ${deletedAlert.id.substring(0, 8)} removed from active lists.`,
            ...prev
          ]);
        }
      } 
      // 3. Alert Modified
      else {
        alerts.forEach(curr => {
          const prev = prevAlerts.find(pa => pa.id === curr.id);
          if (prev) {
            if (prev.resolved !== curr.resolved) {
              setLogs(prevLogs => [
                `[${timeStr}] [STATUS CHANGE] Incident ${curr.id.substring(0, 8)} marked as ${curr.resolved ? 'RESOLVED' : 'ACTIVE'}`,
                ...prevLogs
              ]);
            }
            if (prev.severity !== curr.severity) {
              setLogs(prevLogs => [
                `[${timeStr}] [SEVERITY SCALED] Incident ${curr.id.substring(0, 8)} updated: ${prev.severity} -> ${curr.severity}`,
                ...prevLogs
              ]);
            }
            if (prev.category !== curr.category) {
              setLogs(prevLogs => [
                `[${timeStr}] [CATEGORY CHANGE] Incident ${curr.id.substring(0, 8)} type updated: ${prev.category} -> ${curr.category}`,
                ...prevLogs
              ]);
            }
            if (prev.assignedAgency !== curr.assignedAgency) {
              setLogs(prevLogs => [
                `[${timeStr}] [AGENCY DISPATCH] incident ${curr.id.substring(0, 8)} assigned to [${curr.assignedAgency || 'None'}]`,
                ...prevLogs
              ]);
            }
            if (prev.description !== curr.description) {
              setLogs(prevLogs => [
                `[${timeStr}] [DESC UPDATE] Incident ${curr.id.substring(0, 8)} description edited by Admin`,
                ...prevLogs
              ]);
            }
          }
        });
      }
    }
    prevAlertsRef.current = alerts;
  }, [alerts]);

  // Handle demo bypass action
  const handleDemoBypass = async () => {
    setIsBypassing(true);
    try {
      await login('admin@rapidrelief.gov', 'admin');
    } catch (e) {
      console.error(e);
    } finally {
      setIsBypassing(false);
    }
  };

  // Handle custom emergency trigger
  const handleCustomTrigger = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customLoc.trim() || !customDesc.trim()) return;

    // Use user-provided lat/lng or generate relative to mapCenter
    const lat = customLat.trim() ? parseFloat(customLat) : mapCenter[0] + (Math.random() - 0.5) * 0.03;
    const lng = customLng.trim() ? parseFloat(customLng) : mapCenter[1] + (Math.random() - 0.5) * 0.03;

    createAlert({
      category: customCat,
      severity: customSev,
      location: customLoc.trim(),
      latitude: parseFloat(lat.toFixed(6)),
      longitude: parseFloat(lng.toFixed(6)),
      description: customDesc.trim()
    });

    // Clear form fields
    setCustomLoc('');
    setCustomDesc('');
    setCustomLat('');
    setCustomLng('');
  };

  // Handle inline description editing
  const startEditing = (alert: Alert) => {
    setEditingId(alert.id);
    setEditDesc(alert.description);
  };

  const saveEditing = (id: string) => {
    updateAlert(id, { description: editDesc });
    setEditingId(null);
  };

  // Stats summaries
  const totalReports = alerts.length;
  const activeReports = alerts.filter((a) => !a.resolved).length;
  const resolvedReports = alerts.filter((a) => a.resolved).length;
  const criticalReports = alerts.filter((a) => !a.resolved && a.severity === 'critical').length;
  const resolutionRate = totalReports > 0 ? Math.round((resolvedReports / totalReports) * 100) : 0;

  // Render Access Denied fallback for non-admins
  if (!user || user.role !== 'admin') {
    return (
      <div className="relative flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-4 text-center">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[350px] w-[350px] sm:h-[450px] sm:w-[450px] rounded-full bg-purple-950/10 blur-[90px] pointer-events-none"></div>
        
        <div className="z-10 max-w-md space-y-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-950/30 border border-purple-500/30 text-purple-400 shadow-2xl shadow-purple-950/40">
            <AlertTriangle className="h-9 w-9 text-purple-500 animate-pulse" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              Access Scope Restricted
            </h2>
            <p className="text-sm text-zinc-400 leading-relaxed">
              This terminal is configured for emergency dispatch administrators. Please sign in as a <strong className="text-purple-400">System Admin</strong> to proceed, or click below for a quick demo override.
            </p>
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <button
              onClick={handleDemoBypass}
              disabled={isBypassing}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-700 to-indigo-650 py-3 text-sm font-bold text-white shadow-xl shadow-purple-950/20 hover:from-purple-650 hover:to-indigo-600 transition-all cursor-pointer disabled:opacity-50"
            >
              {isBypassing ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Configuring Scope...</span>
                </>
              ) : (
                <>
                  <ShieldIcon className="h-4.5 w-4.5 text-white" />
                  <span>Demo Login as System Admin</span>
                </>
              )}
            </button>
            
            <a 
              href="/"
              className="text-xs font-semibold text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              Back to Citizen Live Map
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 text-zinc-100">
      <Navbar />

      <main className="mx-auto flex-1 w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        
        {/* Header Title Section */}
        <section className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-900 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-purple-500 animate-ping"></span>
              <span className="text-xs font-bold uppercase tracking-widest text-purple-400">Administrative Operations Command</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mt-1">
              Command Center Dashboard
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-1.5 text-xs text-zinc-400">
              Active Nodes: <span className="font-mono text-white font-bold">NODE_US_WEST_1</span>
            </div>
          </div>
        </section>

        {/* Premium Admin Stat Widgets */}
        <section className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="rounded-xl border border-zinc-900 bg-zinc-900/10 p-3 sm:p-4">
            <span className="text-[10px] sm:text-xs font-bold text-zinc-500 uppercase tracking-wider">Total Reports</span>
            <div className="text-xl sm:text-2xl font-bold text-zinc-200 mt-0.5">{totalReports}</div>
          </div>
          <div className="rounded-xl border border-zinc-900 bg-zinc-900/10 p-3 sm:p-4">
            <span className="text-[10px] sm:text-xs font-bold text-red-400/80 uppercase tracking-wider">Active Threats</span>
            <div className="text-xl sm:text-2xl font-bold text-red-500 mt-0.5">{activeReports}</div>
          </div>
          <div className="rounded-xl border border-zinc-900 bg-zinc-900/10 p-3 sm:p-4">
            <span className="text-[10px] sm:text-xs font-bold text-purple-400/80 uppercase tracking-wider">Critical Escalations</span>
            <div className="text-xl sm:text-2xl font-bold text-purple-500 mt-0.5">{criticalReports}</div>
          </div>
          <div className="rounded-xl border border-zinc-900 bg-zinc-900/10 p-3 sm:p-4">
            <span className="text-[10px] sm:text-xs font-bold text-emerald-400/80 uppercase tracking-wider">Secured Zones</span>
            <div className="text-xl sm:text-2xl font-bold text-emerald-400 mt-0.5">{resolvedReports}</div>
          </div>
          <div className="rounded-xl border border-zinc-900 bg-zinc-900/10 p-3 sm:p-4 col-span-2 lg:col-span-1">
            <span className="text-[10px] sm:text-xs font-bold text-orange-400/80 uppercase tracking-wider">Resolution Rate</span>
            <div className="flex items-center gap-2 mt-0.5">
              <div className="text-xl sm:text-2xl font-bold text-orange-500">{resolutionRate}%</div>
              <div className="flex-1 bg-zinc-800 rounded-full h-1.5 max-w-[80px]">
                <div className="bg-orange-500 h-1.5 rounded-full" style={{ width: `${resolutionRate}%` }}></div>
              </div>
            </div>
          </div>
        </section>

        {/* Map & Alerts Split Layout */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch min-h-[580px]">
          {/* Map display */}
          <div className="lg:col-span-5 h-[300px] lg:h-auto min-h-[300px]">
            <AlertsMap />
          </div>

          {/* Incidents Table / Controls Panel */}
          <div className="lg:col-span-7 flex flex-col bg-zinc-950/20 border border-zinc-900 rounded-2xl overflow-hidden min-h-[400px]">
            {/* Header section of incidents list */}
            <div className="p-4 border-b border-zinc-900 bg-zinc-900/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings className="h-4.5 w-4.5 text-purple-500" />
                <h3 className="font-bold text-zinc-150 text-sm sm:text-base">Incident Operations Control</h3>
              </div>
              <span className="text-[10px] bg-zinc-850 text-zinc-400 border border-zinc-800/80 px-2 py-0.5 rounded-full font-bold">
                COMMAND VIEW
              </span>
            </div>

            {/* List scrollable section */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[550px]">
              {alerts.length > 0 ? (
                alerts.map((alert) => (
                  <div 
                    key={alert.id}
                    className={`rounded-xl border p-4 transition-all duration-200 bg-zinc-900/20 ${
                      alert.resolved ? 'border-zinc-900 opacity-60' : 'border-zinc-850 hover:border-zinc-750'
                    }`}
                  >
                    {/* Header: severity, category, timestamp */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-900/60 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded capitalize ${
                          alert.severity === 'critical' ? 'bg-purple-500/15 text-purple-400 border border-purple-500/20' :
                          alert.severity === 'high' ? 'bg-red-500/15 text-red-400 border border-red-500/20' :
                          alert.severity === 'medium' ? 'bg-orange-500/15 text-orange-400 border border-orange-500/20' :
                          'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                        }`}>
                          {alert.severity}
                        </span>
                        
                        <span className="text-xs font-semibold text-zinc-400 capitalize">
                          {alert.category} Emergency
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-[10px] text-zinc-550">
                        <Clock className="h-3 w-3" />
                        <span>{alert.timestamp.toLocaleTimeString()}</span>
                      </div>
                    </div>

                    {/* Metadata: Location, Reporter */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3 text-xs text-zinc-450">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-zinc-650 shrink-0" />
                        <span className="truncate text-zinc-300 font-medium">{alert.location}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-zinc-650 shrink-0" />
                        <span className="truncate">Reporter: <span className="text-zinc-350">{alert.reporter.split('@')[0]}</span></span>
                      </div>
                    </div>

                    {/* Description Block with Inline Editing support */}
                    <div className="mt-3.5 bg-zinc-950/45 rounded-lg border border-zinc-900/60 p-3 relative group">
                      {editingId === alert.id ? (
                        <div className="space-y-2">
                          <textarea
                            value={editDesc}
                            onChange={(e) => setEditDesc(e.target.value)}
                            className="w-full text-xs text-zinc-300 bg-zinc-950 border border-zinc-800 rounded p-2 focus:border-purple-500/50 outline-none"
                            rows={3}
                          />
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => setEditingId(null)}
                              className="p-1 text-zinc-400 hover:text-white rounded border border-zinc-850 hover:bg-zinc-900 cursor-pointer"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => saveEditing(alert.id)}
                              className="p-1 bg-purple-650 text-white rounded hover:bg-purple-600 cursor-pointer"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <p className="text-xs text-zinc-300 leading-relaxed pr-6">{alert.description}</p>
                          <button 
                            onClick={() => startEditing(alert)}
                            className="absolute top-2.5 right-2.5 p-1 text-zinc-600 hover:text-zinc-200 hover:bg-zinc-900 rounded opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                            title="Edit report description"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Admin Actions Selector Block */}
                    <div className="mt-4 pt-3.5 border-t border-zinc-900/70 flex flex-wrap items-center justify-between gap-3">
                      
                      <div className="flex flex-wrap items-center gap-2.5">
                        {/* Modify Severity */}
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[9px] uppercase font-bold text-zinc-550">Severity</span>
                          <select
                            value={alert.severity}
                            onChange={(e) => updateAlert(alert.id, { severity: e.target.value as Severity })}
                            className="rounded border border-zinc-850 bg-zinc-950 text-[10px] text-zinc-400 py-1 px-1.5 outline-none focus:border-purple-500 cursor-pointer font-semibold"
                          >
                            {SEVERITIES.map(sev => (
                              <option key={sev} value={sev}>{sev.toUpperCase()}</option>
                            ))}
                          </select>
                        </div>

                        {/* Modify Category */}
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[9px] uppercase font-bold text-zinc-550">Category</span>
                          <select
                            value={alert.category}
                            onChange={(e) => updateAlert(alert.id, { category: e.target.value as Category })}
                            className="rounded border border-zinc-850 bg-zinc-950 text-[10px] text-zinc-400 py-1 px-1.5 outline-none focus:border-purple-500 cursor-pointer font-semibold"
                          >
                            {CATEGORIES.map(cat => (
                              <option key={cat} value={cat}>{cat.toUpperCase()}</option>
                            ))}
                          </select>
                        </div>

                        {/* Dispatch Agency Assignment */}
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[9px] uppercase font-bold text-zinc-550">Dispatched Agency</span>
                          <select
                            value={alert.assignedAgency || ''}
                            onChange={(e) => updateAlert(alert.id, { assignedAgency: e.target.value || undefined })}
                            className="rounded border border-zinc-850 bg-zinc-950 text-[10px] text-zinc-300 py-1 px-2 outline-none focus:border-purple-500 cursor-pointer font-bold"
                          >
                            <option value="">-- UNASSIGNED --</option>
                            {AGENCIES.map(agency => (
                              <option key={agency} value={agency}>{agency}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Status and Action Buttons */}
                      <div className="flex items-center gap-1.5 mt-2 sm:mt-0">
                        {/* Toggle resolve */}
                        <button
                          onClick={() => resolveAlert(alert.id)}
                          className={`flex items-center gap-1 rounded px-2 py-1.5 text-[10px] font-bold uppercase transition-all cursor-pointer border ${
                            alert.resolved 
                              ? 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-750' 
                              : 'bg-emerald-650/10 border-emerald-500/25 text-emerald-450 hover:bg-emerald-650/20 hover:text-emerald-300'
                          }`}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>{alert.resolved ? 'Re-open' : 'Resolve'}</span>
                        </button>

                        {/* Delete Report */}
                        <button
                          onClick={() => deleteAlert(alert.id)}
                          title="Erase report database entry"
                          className="flex items-center justify-center rounded border border-red-500/20 bg-red-950/10 hover:bg-red-500 p-1.5 text-red-400 hover:text-white transition-all cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <AlertOctagon className="h-10 w-10 text-zinc-650 mb-3 animate-pulse" />
                  <h4 className="text-zinc-450 font-bold text-sm">Awaiting Incident Data</h4>
                  <p className="text-xs text-zinc-550 mt-1 max-w-[240px]">
                    No emergency alerts recorded in system state. Activate the simulator or report an emergency.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Bottom Section: Custom Injector & Live Audit logs */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Custom On-Demand Simulator Trigger */}
          <div className="lg:col-span-5 rounded-2xl border border-zinc-900 bg-zinc-900/10 p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-zinc-900/60 pb-3">
              <Plus className="h-4.5 w-4.5 text-purple-400" />
              <h3 className="font-bold text-zinc-200 text-sm">Dispatch Custom Emergency</h3>
            </div>
            
            <form onSubmit={handleCustomTrigger} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Category</label>
                  <select
                    value={customCat}
                    onChange={(e) => setCustomCat(e.target.value as Category)}
                    className="w-full rounded border border-zinc-850 bg-zinc-950 py-1.5 px-2 text-xs text-zinc-300 outline-none focus:border-purple-500/50 cursor-pointer capitalize"
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Severity</label>
                  <select
                    value={customSev}
                    onChange={(e) => setCustomSev(e.target.value as Severity)}
                    className="w-full rounded border border-zinc-850 bg-zinc-950 py-1.5 px-2 text-xs text-zinc-300 outline-none focus:border-purple-500/50 cursor-pointer capitalize"
                  >
                    {SEVERITIES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Hazard Location</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Harbor Overpass Lane 3"
                  value={customLoc}
                  onChange={(e) => setCustomLoc(e.target.value)}
                  className="w-full rounded border border-zinc-850 bg-zinc-950 py-1.5 px-3 text-xs text-zinc-200 placeholder-zinc-600 outline-none focus:border-purple-500/50"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Coordinates (Optional - Leave blank for Random SF offset)</label>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="number"
                    step="any"
                    placeholder="Lat (e.g. 37.77)"
                    value={customLat}
                    onChange={(e) => setCustomLat(e.target.value)}
                    className="w-full rounded border border-zinc-850 bg-zinc-950 py-1.5 px-3 text-xs text-zinc-200 placeholder-zinc-650 outline-none focus:border-purple-500/50"
                  />
                  <input
                    type="number"
                    step="any"
                    placeholder="Lng (e.g. -122.41)"
                    value={customLng}
                    onChange={(e) => setCustomLng(e.target.value)}
                    className="w-full rounded border border-zinc-850 bg-zinc-950 py-1.5 px-3 text-xs text-zinc-200 placeholder-zinc-650 outline-none focus:border-purple-500/50"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Incident Description</label>
                <textarea
                  required
                  placeholder="Provide precise emergency response details..."
                  rows={2}
                  value={customDesc}
                  onChange={(e) => setCustomDesc(e.target.value)}
                  className="w-full rounded border border-zinc-850 bg-zinc-950 py-1.5 px-3 text-xs text-zinc-200 placeholder-zinc-600 outline-none focus:border-purple-500/50"
                />
              </div>

              <button
                type="submit"
                className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-purple-700 hover:bg-purple-650 text-white font-bold py-2 text-xs transition-all shadow-lg shadow-purple-950/20 active:scale-[0.98] cursor-pointer"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Inject Emergency</span>
              </button>
            </form>
          </div>

          {/* System Audit logs console */}
          <div className="lg:col-span-7 rounded-2xl border border-zinc-900 bg-zinc-900/10 p-5 space-y-4 flex flex-col h-[320px]">
            <div className="flex items-center gap-2 border-b border-zinc-900/60 pb-3 shrink-0">
              <Terminal className="h-4.5 w-4.5 text-zinc-450" />
              <h3 className="font-bold text-zinc-200 text-sm">System Audit Console</h3>
            </div>
            
            <div className="flex-1 overflow-y-auto font-mono text-[10px] text-zinc-450 p-3 bg-zinc-950/80 rounded-xl border border-zinc-900/70 space-y-1.5 scrollbar-thin">
              {logs.map((log, i) => (
                <div 
                  key={i} 
                  className={`leading-normal select-text ${
                    log.includes('[SYSTEM INITIALIZED]') ? 'text-purple-400 font-semibold' :
                    log.includes('[INCOMING REPORT]') ? 'text-red-400 font-semibold' :
                    log.includes('[STATUS CHANGE]') ? 'text-emerald-450' :
                    log.includes('[AGENCY DISPATCH]') ? 'text-orange-400 font-bold' :
                    log.includes('[DATABASE DELETE]') ? 'text-zinc-600' :
                    'text-zinc-450'
                  }`}
                >
                  {log}
                </div>
              ))}
            </div>
          </div>
        </section>

      </main>
    </div>
  );
};
