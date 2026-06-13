import React from 'react';
import { useAlerts, type Category, type Severity } from '../context/AlertContext';
import { Radio, Play, Pause, Zap, Info } from 'lucide-react';

const MOCK_MESSAGES: Record<Category, string[]> = {
  fire: [
    'Major chemical container leak ignited at sorting station. Evacuation orders active.',
    'Residential roof fire sparked by kitchen flare-up. Smoke spreading to neighboring flats.',
    'Forest margin fire near reservoir trail. Winds pushing embers toward local park cabins.',
  ],
  flood: [
    'Severe highway underpass flooding has marooned three compact vehicles.',
    'Reservoir drainage canal overflowed. Standing water blocking commuter routes.',
    'Torrential stormwater runoff buckling basement walls at municipal hospital.',
  ],
  medical: [
    'Construction worker sustained heat shock at commercial skyscraper site.',
    'Individual exhibiting critical stroke indicators at downtown light rail terminal.',
    'Gym participant collapsed from suspected respiratory failure. CPR initiated.',
  ],
  accident: [
    'Fuel tanker collision blocking all lanes. Hazardous materials unit responding.',
    'Courier vehicle collision at major intersection. Driver trapped by cargo shift.',
    'Bicyclist collision with delivery door. Severe head impact warning.',
  ],
  earthquake: [
    'Active structural cracking spotted along river bridge support pillars.',
    'Seismic tremors ruptured commercial water mains, causing streets to buckle.',
    'Glass facades shattered across historical brick offices in city square.',
  ],
  other: [
    'Sparking electrical transmission wires hanging low over pedestrian lanes.',
    'Pungent chemical exhaust venting from industrial storage zones.',
    'Civil blockade restricting movement on central access highway.'
  ]
};

const LOCATIONS = [
  'Civic Center Plaza East',
  'Commercial Wharf Sector C',
  'Market St Shopping District',
  'Financial Core Access Path',
  'SOMA Industrial Sector',
  'Mission District Promenade',
  'Chinatown Gate Intersection',
  'Potrero Access Roadways'
];

export const SimulatorControl: React.FC = () => {
  const { 
    simulatorActive, setSimulatorActive, 
    simulatorSpeed, setSimulatorSpeed,
    createAlert, mapCenter
  } = useAlerts();

  const handleManualTrigger = () => {
    const categories: Category[] = ['fire', 'flood', 'medical', 'accident', 'earthquake', 'other'];
    const severities: Severity[] = ['low', 'medium', 'high', 'critical'];
    
    const randomCategory = categories[Math.floor(Math.random() * categories.length)];
    const randomSeverity = severities[Math.floor(Math.random() * severities.length)];
    
    const descriptions = MOCK_MESSAGES[randomCategory];
    const randomDescription = descriptions[Math.floor(Math.random() * descriptions.length)];
    
    const randomLocation = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];
    
    // Generate coordinates near active mapCenter
    const latOffset = (Math.random() - 0.5) * 0.03;
    const lngOffset = (Math.random() - 0.5) * 0.03;
    const newLat = mapCenter[0] + latOffset;
    const newLng = mapCenter[1] + lngOffset;

    const mockImages: Record<Category, string[]> = {
      fire: [
        'https://images.unsplash.com/photo-1542397284385-601017642477?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1508873696983-2df519f0397e?auto=format&fit=crop&w=600&q=80'
      ],
      flood: [
        'https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1482862549707-f63cb32c5fd9?auto=format&fit=crop&w=600&q=80'
      ],
      medical: [
        'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=80'
      ],
      accident: [
        'https://images.unsplash.com/photo-1518972559570-7cc1309f3229?auto=format&fit=crop&w=600&q=80'
      ],
      earthquake: [
        'https://images.unsplash.com/photo-1594897030264-ab7d87efc473?auto=format&fit=crop&w=600&q=80'
      ],
      other: [
        'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?auto=format&fit=crop&w=600&q=80'
      ]
    };

    const imagesForCat = mockImages[randomCategory];
    const hasImage = Math.random() > 0.3; // 70% chance of image
    const imageUrl = hasImage && imagesForCat ? imagesForCat[Math.floor(Math.random() * imagesForCat.length)] : undefined;

    createAlert({
      category: randomCategory,
      severity: randomSeverity,
      location: randomLocation,
      latitude: parseFloat(newLat.toFixed(6)),
      longitude: parseFloat(newLng.toFixed(6)),
      description: randomDescription,
      imageUrl,
    });
  };

  return (
    <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-4 backdrop-blur-md">
      
      {/* Title Header */}
      <div className="flex items-center justify-between border-b border-zinc-800/85 pb-3">
        <div className="flex items-center gap-2">
          <Radio className={`h-4.5 w-4.5 ${simulatorActive ? 'text-red-500 animate-pulse' : 'text-zinc-500'}`} />
          <h4 className="text-sm font-bold text-zinc-200">Incident Simulator</h4>
        </div>
        
        {/* Status Indicator Badge */}
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wider ${
          simulatorActive 
            ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
            : 'bg-zinc-800 text-zinc-500 border border-zinc-800/50'
        }`}>
          <span className={`h-1.5 w-1.5 rounded-full ${simulatorActive ? 'bg-red-500 animate-ping' : 'bg-zinc-600'}`}></span>
          {simulatorActive ? 'LIVE GENERATOR ON' : 'SIMULATION OFF'}
        </span>
      </div>

      <p className="mt-2 text-xs leading-relaxed text-zinc-500 flex gap-1 items-start">
        <Info className="h-3.5 w-3.5 text-zinc-600 shrink-0 mt-0.5" />
        <span>Simulate real-time crisis events to test alert cards animation, filters, sorting, and coordinate pinning on the map.</span>
      </p>

      {/* Simulator Action controls */}
      <div className="mt-4 space-y-3">
        {/* Speed toggle & Start/Stop controls */}
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => setSimulatorActive(!simulatorActive)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold tracking-wide transition-all ${
              simulatorActive 
                ? 'bg-zinc-800 hover:bg-zinc-700 text-white' 
                : 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-950/20'
            }`}
          >
            {simulatorActive ? (
              <>
                <Pause className="h-3.5 w-3.5 fill-current" />
                <span>Pause Engine</span>
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5 fill-current animate-pulse" />
                <span>Start Simulation</span>
              </>
            )}
          </button>

          <button
            onClick={handleManualTrigger}
            className="flex items-center justify-center gap-1 rounded-lg border border-zinc-850 bg-zinc-950/40 hover:bg-zinc-800 hover:border-zinc-700 px-3 py-2 text-xs font-medium text-zinc-300 transition-all"
            title="Dispatch a mock hazard report immediately"
          >
            <Zap className="h-3.5 w-3.5 text-orange-500 animate-bounce" />
            <span>Dispatch Mock</span>
          </button>
        </div>

        {/* Speed Controls (Only visible when active) */}
        {simulatorActive && (
          <div className="border-t border-zinc-800/40 pt-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-zinc-500">Dispatch Intervals:</span>
              <div className="flex gap-1">
                {(['slow', 'medium', 'fast'] as const).map((speed) => {
                  const isSelected = simulatorSpeed === speed;
                  const labels = { slow: '35s', medium: '18s', fast: '8s' };
                  return (
                    <button
                      key={speed}
                      onClick={() => setSimulatorSpeed(speed)}
                      className={`rounded px-2 py-0.5 text-[10px] font-bold capitalize transition-all ${
                        isSelected 
                          ? 'bg-red-600 text-white' 
                          : 'bg-zinc-950/40 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'
                      }`}
                    >
                      {speed} ({labels[speed]})
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
