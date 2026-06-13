import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { useAlerts, type Severity } from '../context/AlertContext';
import L from 'leaflet';
import { Flame, Droplet, HeartPulse, Car, Globe, HelpCircle } from 'lucide-react';

// Import Leaflet CSS directly
import 'leaflet/dist/leaflet.css';

// Custom Map Panner helper
const MapController: React.FC<{ center: [number, number] }> = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom(), {
      animate: true,
      duration: 0.8
    });
  }, [center, map]);
  return null;
};

const CATEGORY_ICONS: Record<string, any> = {
  fire: Flame,
  flood: Droplet,
  medical: HeartPulse,
  accident: Car,
  earthquake: Globe,
  other: HelpCircle
};

// Generates modern glowing custom HTML markers using Leaflet's L.divIcon
const createCustomIcon = (severity: Severity, resolved: boolean) => {
  let colorClass = 'bg-red-500';
  let ringClass = 'bg-red-500/40';
  
  if (resolved) {
    colorClass = 'bg-emerald-500 border-emerald-300';
    ringClass = 'bg-emerald-500/20';
  } else {
    switch (severity) {
      case 'critical':
        colorClass = 'bg-purple-600 border-purple-300 animate-pulse';
        ringClass = 'bg-purple-600/40 scale-[1.3]';
        break;
      case 'high':
        colorClass = 'bg-red-500 border-red-300';
        ringClass = 'bg-red-500/40 scale-110';
        break;
      case 'medium':
        colorClass = 'bg-orange-500 border-orange-300';
        ringClass = 'bg-orange-500/40';
        break;
      case 'low':
        colorClass = 'bg-yellow-500 border-yellow-300';
        ringClass = 'bg-yellow-500/35';
        break;
    }
  }

  return L.divIcon({
    html: `
      <div class="custom-radar-marker">
        <div class="radar-ring ${ringClass}"></div>
        <div class="radar-dot ${colorClass}"></div>
      </div>
    `,
    className: 'custom-leaflet-marker-wrapper',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -10]
  });
};

export const AlertsMap: React.FC = () => {
  const { alerts, mapCenter } = useAlerts();

  // Filter out resolved alerts or plot them with resolved styling
  const activeAlerts = alerts;

  return (
    <div className="relative h-full w-full rounded-2xl border border-zinc-800/60 overflow-hidden bg-zinc-950">
      
      {/* Map Container */}
      <MapContainer 
        center={mapCenter} 
        zoom={13} 
        scrollWheelZoom={true}
        className="h-full w-full z-10"
      >
        {/* High Contrast Voyager Tile Layer */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          maxZoom={20}
        />

        {/* View panner controller */}
        <MapController center={mapCenter} />

        {/* Plot alert markers */}
        {activeAlerts.map((alert) => {
          const AlertIcon = CATEGORY_ICONS[alert.category] || HelpCircle;
          return (
            <Marker
              key={alert.id}
              position={[alert.latitude, alert.longitude]}
              icon={createCustomIcon(alert.severity, alert.resolved)}
            >
              <Popup>
                <div className="p-1 space-y-2 text-zinc-200">
                  <div className="flex items-center gap-1.5 border-b border-zinc-800 pb-1.5">
                    <span className="p-1 rounded bg-zinc-900 text-zinc-300">
                      <AlertIcon className="h-3.5 w-3.5" />
                    </span>
                    <div>
                      <h4 className="text-xs font-bold capitalize text-zinc-100">{alert.category} Emergency</h4>
                      <span className="text-[9px] text-zinc-500 font-mono">ID: {alert.id.substring(0, 8)}</span>
                    </div>
                  </div>
                  
                  <p className="text-xs text-zinc-300 line-clamp-2 leading-relaxed">
                    {alert.description}
                  </p>

                  <div className="flex items-center justify-between pt-1 text-[10px] text-zinc-400">
                    <span className="font-semibold text-zinc-300">{alert.location}</span>
                    <span className={`font-mono text-[9px] px-1.5 py-0.5 rounded capitalize ${
                      alert.resolved 
                        ? 'bg-emerald-500/10 text-emerald-400' 
                        : alert.severity === 'critical'
                        ? 'bg-purple-500/10 text-purple-400 font-bold'
                        : 'bg-red-500/10 text-red-400'
                    }`}>
                      {alert.resolved ? 'resolved' : alert.severity}
                    </span>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Floating Map Info Overlay */}
      <div className="absolute bottom-4 left-4 z-20 flex flex-col gap-1.5 rounded-xl border border-zinc-850 bg-zinc-950/80 p-3 text-[10px] text-zinc-400 shadow-xl backdrop-blur-md">
        <span className="font-bold text-zinc-200 uppercase tracking-wider mb-1">Live Crisis Map</span>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-purple-500 shadow-[0_0_6px_rgba(168,85,247,0.8)]"></span>
          <span>Critical Severity (Incident Overload)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.8)]"></span>
          <span>High Severity (Immediate Threat)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-orange-500 shadow-[0_0_6px_rgba(249,115,22,0.8)]"></span>
          <span>Medium Severity</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-yellow-500 shadow-[0_0_6px_rgba(234,179,8,0.8)]"></span>
          <span>Low Severity</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]"></span>
          <span>Resolved Incidents</span>
        </div>
      </div>
    </div>
  );
};
