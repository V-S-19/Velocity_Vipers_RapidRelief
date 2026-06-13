import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type Severity = 'low' | 'medium' | 'high' | 'critical';
export type Category = 'fire' | 'flood' | 'medical' | 'accident' | 'earthquake' | 'other';

export interface Alert {
  id: string;
  category: Category;
  severity: Severity;
  location: string;
  latitude: number;
  longitude: number;
  description: string;
  timestamp: Date;
  imageUrl?: string;
  resolved: boolean;
  reporter: string;
}

interface User {
  email: string;
}

interface AlertContextType {
  alerts: Alert[];
  user: User | null;
  simulatorActive: boolean;
  simulatorSpeed: 'slow' | 'medium' | 'fast';
  mapCenter: [number, number];
  setMapCenter: (center: [number, number]) => void;
  createAlert: (alertData: Omit<Alert, 'id' | 'timestamp' | 'resolved' | 'reporter'>) => void;
  resolveAlert: (id: string) => void;
  deleteAlert: (id: string) => void;
  login: (email: string) => Promise<boolean>;
  logout: () => void;
  signup: (email: string) => Promise<boolean>;
  setSimulatorActive: (active: boolean) => void;
  setSimulatorSpeed: (speed: 'slow' | 'medium' | 'fast') => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

// Initial Mock Alerts
const INITIAL_ALERTS: Alert[] = [
  {
    id: 'alert-1',
    category: 'fire',
    severity: 'critical',
    location: 'Warehouse District, Lane 5',
    latitude: 37.7833,
    longitude: -122.4167,
    description: 'Active structure fire reported at the central shipping warehouse. Heavy smoke visible. Multiple fire engines en route.',
    timestamp: new Date(Date.now() - 12 * 60000), // 12 mins ago
    imageUrl: 'https://images.unsplash.com/photo-1542397284385-601017642477?auto=format&fit=crop&w=600&q=80',
    resolved: false,
    reporter: 'fire_marshall@city.gov',
  },
  {
    id: 'alert-2',
    category: 'flood',
    severity: 'high',
    location: 'Lower Riverbed Parkway',
    latitude: 37.7650,
    longitude: -122.4300,
    description: 'Flash flooding has overflowed the main storm drains. Water depth approx 1.5 feet on roadway. Avoid driving through.',
    timestamp: new Date(Date.now() - 45 * 60000), // 45 mins ago
    imageUrl: 'https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=600&q=80',
    resolved: false,
    reporter: 'citizen_observer99',
  },
  {
    id: 'alert-3',
    category: 'medical',
    severity: 'medium',
    location: 'Metro Station Entrance, Sector B',
    latitude: 37.7795,
    longitude: -122.4110,
    description: 'Elderly citizen collapsed due to heat exhaustion. Paramedics dispatched and on scene performing triage.',
    timestamp: new Date(Date.now() - 110 * 60000), // ~2 hours ago
    resolved: true,
    reporter: 'metro_staff_4',
  },
  {
    id: 'alert-4',
    category: 'accident',
    severity: 'high',
    location: 'Highway 101 Northbound, Exit 433',
    latitude: 37.7500,
    longitude: -122.4000,
    description: 'Multi-vehicle collision blocking two right lanes. Expect major traffic backlogs. Tow services requested.',
    timestamp: new Date(Date.now() - 180 * 60000), // 3 hours ago
    imageUrl: 'https://images.unsplash.com/photo-1518972559570-7cc1309f3229?auto=format&fit=crop&w=600&q=80',
    resolved: false,
    reporter: 'hwy_patrol_officer',
  }
];

const MOCK_MESSAGES = {
  fire: [
    'Residential kitchen fire spreading to roof. Need immediate assistance.',
    'Brush fire sparked near electric subgrid line. Dry wind is driving it north.',
    'Gas station transformer explosion, small localized fire active in garage.',
  ],
  flood: [
    'Basement flooding in historic municipal archives. Sandbags urgently needed.',
    'Severe riverbank erosion warning. Street surface collapsing under running water.',
    'Underpass flooded, two vehicles stalled in deep water.',
  ],
  medical: [
    'Severe allergic reaction (anaphylaxis) at school. EpiPen administered but paramedic needed.',
    'Heat stroke victim unconscious but breathing in central town square.',
    'Cardiac arrest in local gym. CPR in progress, AED has been deployed.',
  ],
  accident: [
    'Delivery van overturned blocking main downtown intersection. Fuel leak observed.',
    'Bicyclist struck by vehicle door. Minor injuries, head trauma warning. Ambulance en route.',
    'Tree branch fell directly onto moving vehicle. Driver is safe but trapped inside.',
  ],
  earthquake: [
    'Minor structural cracking reported on 3rd St bridge after the tremors.',
    'Water line rupture reported on Broadway, water gushing onto sidewalk.',
    'Glass facades shattered on old brick facade buildings in downtown sector.',
  ],
  other: [
    'Power lines down across pedestrian walkway. Sparking actively, stay clear.',
    'Chemical odor emanating from commercial storage facility near residential border.',
    'Civil blockade observed on East Avenue. Traffic is fully diverted.',
  ]
};

const LOCATIONS = [
  '7th & Mission Streets',
  'Civic Center Plaza East',
  'Potrero Hill Overpass',
  'Market St Transit Hub',
  'Financial District Alleyway',
  'Marina Blvd Pedestrian Route',
  'Golden Gate Park Entrance',
  'Chinatown Gate Sector A',
  'SOMA Technology Complex',
  'Mission District Promenade'
];

export const AlertProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [alerts, setAlerts] = useState<Alert[]>(() => {
    const saved = localStorage.getItem('rapidrelief_alerts');
    if (saved) {
      try {
        return JSON.parse(saved).map((a: any) => ({
          ...a,
          timestamp: new Date(a.timestamp)
        }));
      } catch (e) {
        console.error('Error loading alerts from localStorage', e);
      }
    }
    return INITIAL_ALERTS;
  });

  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('rapidrelief_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [simulatorActive, setSimulatorActive] = useState<boolean>(false);
  const [simulatorSpeed, setSimulatorSpeed] = useState<'slow' | 'medium' | 'fast'>('medium');
  const [mapCenter, setMapCenter] = useState<[number, number]>([37.7749, -122.4194]); // SF default

  // Update map center to user's real location on load if available
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setMapCenter([position.coords.latitude, position.coords.longitude]);
        },
        (error) => {
          console.log('Using default map coordinates due to location access: ', error.message);
        }
      );
    }
  }, []);

  // Save alerts to localStorage
  useEffect(() => {
    localStorage.setItem('rapidrelief_alerts', JSON.stringify(alerts));
  }, [alerts]);

  const createAlert = useCallback((alertData: Omit<Alert, 'id' | 'timestamp' | 'resolved' | 'reporter'>) => {
    const newAlert: Alert = {
      ...alertData,
      id: `alert-${Date.now()}`,
      timestamp: new Date(),
      resolved: false,
      reporter: user ? user.email : 'Anonymous Citizen',
    };
    setAlerts(prev => [newAlert, ...prev]);
  }, [user]);

  const resolveAlert = useCallback((id: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === id ? { ...alert, resolved: !alert.resolved } : alert
    ));
  }, []);

  const deleteAlert = useCallback((id: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id));
  }, []);

  const login = async (email: string) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    const loggedUser = { email };
    setUser(loggedUser);
    localStorage.setItem('rapidrelief_user', JSON.stringify(loggedUser));
    return true;
  };

  const signup = async (email: string) => {
    await new Promise(resolve => setTimeout(resolve, 800));
    const loggedUser = { email };
    setUser(loggedUser);
    localStorage.setItem('rapidrelief_user', JSON.stringify(loggedUser));
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('rapidrelief_user');
  };

  // Simulator Effect
  useEffect(() => {
    if (!simulatorActive) return;

    const intervalDurations = {
      slow: 35000,
      medium: 18000,
      fast: 8000
    };

    const intervalTime = intervalDurations[simulatorSpeed];

    const generateMockAlert = () => {
      const categories: Category[] = ['fire', 'flood', 'medical', 'accident', 'earthquake', 'other'];
      const severities: Severity[] = ['low', 'medium', 'high', 'critical'];
      
      const randomCategory = categories[Math.floor(Math.random() * categories.length)];
      const randomSeverity = severities[Math.floor(Math.random() * severities.length)];
      
      // Select description based on category
      const descriptions = MOCK_MESSAGES[randomCategory];
      const randomDescription = descriptions[Math.floor(Math.random() * descriptions.length)];
      
      const randomLocation = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];
      
      // Generate coordinates centered around active mapCenter (+/- ~1.5km to 3km radius)
      const latOffset = (Math.random() - 0.5) * 0.04;
      const lngOffset = (Math.random() - 0.5) * 0.04;
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
      const hasImage = Math.random() > 0.4;
      const imageUrl = hasImage && imagesForCat ? imagesForCat[Math.floor(Math.random() * imagesForCat.length)] : undefined;

      const simulatorAlert: Alert = {
        id: `sim-${Date.now()}`,
        category: randomCategory,
        severity: randomSeverity,
        location: randomLocation,
        latitude: parseFloat(newLat.toFixed(6)),
        longitude: parseFloat(newLng.toFixed(6)),
        description: randomDescription,
        timestamp: new Date(),
        imageUrl,
        resolved: false,
        reporter: 'Simulated Alert Dispatcher',
      };

      setAlerts(prev => [simulatorAlert, ...prev]);

      // Push notification if permission granted
      if (Notification.permission === 'granted') {
        new Notification(`NEW EMERGENCY: ${randomSeverity.toUpperCase()} ${randomCategory.toUpperCase()}`, {
          body: `${randomLocation} - ${randomDescription}`,
        });
      }
    };

    const timer = setInterval(generateMockAlert, intervalTime);
    return () => clearInterval(timer);
  }, [simulatorActive, simulatorSpeed, mapCenter]);

  // Request notification permissions
  useEffect(() => {
    if (simulatorActive && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [simulatorActive]);

  return (
    <AlertContext.Provider value={{
      alerts,
      user,
      simulatorActive,
      simulatorSpeed,
      mapCenter,
      setMapCenter,
      createAlert,
      resolveAlert,
      deleteAlert,
      login,
      logout,
      signup,
      setSimulatorActive,
      setSimulatorSpeed
    }}>
      {children}
    </AlertContext.Provider>
  );
};

export const useAlerts = () => {
  const context = useContext(AlertContext);
  if (context === undefined) {
    throw new Error('useAlerts must be used within an AlertProvider');
  }
  return context;
};
