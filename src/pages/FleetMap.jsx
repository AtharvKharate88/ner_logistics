import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import RiskBadge from '../components/RiskBadge';
import './FleetMap.css';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import UserProfileModal from '../components/UserProfileModal';

const fleetData = [
  {
    id: 'TRK-902',
    status: 'ACTIVE',
    route: 'EN ROUTE • SHILLONG',
    cargo: 'Med Supplies',
    level: 'LOW',
    score: 24,
    borderClass: 'border-primary',
  },
  {
    id: 'TRK-114',
    status: 'ALERT',
    route: 'REROUTING • TAWANG',
    cargo: 'Heavy Mach.',
    level: 'HIGH',
    score: 85,
    borderClass: 'border-error',
  },
  {
    id: 'TRK-77B',
    status: 'STANDBY',
    route: 'IDLE • GUWAHATI DEPOT',
    cargo: 'Empty',
    level: 'MED',
    score: 5,
    borderClass: 'border-tertiary',
  },
];

const FleetMap = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('fleet-map');
  const [selectedFilter, setSelectedFilter] = useState('ALL');
  const [selectedTruck, setSelectedTruck] = useState(fleetData[0]);

  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem('isLoggedIn') === 'true';
  });
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [userData, setUserData] = useState(() => {
    const saved = localStorage.getItem('userData');
    return saved
      ? JSON.parse(saved)
      : {
          fullName: 'Commander Alpha',
          email: 'operator@ner-logistics.com',
          fleetId: 'NER-FLT-9021',
          role: 'Fleet Operator',
        };
  });

  const handleAvatarClick = () => {
    if (!isLoggedIn) {
      navigate('/login');
    } else {
      setIsProfileOpen(true);
    }
  };

  const handleSaveProfile = (updated) => {
    setUserData(updated);
    localStorage.setItem('userData', JSON.stringify(updated));
  };

  const handleLogout = () => {
    localStorage.setItem('isLoggedIn', 'false');
    setIsLoggedIn(false);
    setIsProfileOpen(false);
    navigate('/login');
  };

  const filteredFleet = fleetData.filter((truck) => {
    if (selectedFilter === 'ALL') return true;
    if (selectedFilter === 'LOW RISK') return truck.level === 'LOW';
    if (selectedFilter === 'MED') return truck.level === 'MED';
    if (selectedFilter === 'HIGH RISK') return truck.level === 'HIGH';
    return true;
  });

  useEffect(() => {
    let isMounted = true;
    const mapContainer = document.getElementById('leaflet-map-container');
    if (!mapContainer || mapContainer._leaflet_id) return;

    // 1. Initialize Map
    const map = L.map('leaflet-map-container', {
      zoomControl: false,
      attributionControl: false,
    });

    // 2. Public Free Dark Theme Tile Layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      className: 'dark-map-tiles',
    }).addTo(map);

    // Custom Icon Marker Helper
    const customIcon = (color) =>
      L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="background-color: ${color}; width: 14px; height: 14px; border-radius: 50%; border: 2px solid #0e1511; box-shadow: 0 0 12px ${color};"></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });

    // 3. Candidate Routes Data
    const candidateRoutes = [
      {
        id: 'route-safest',
        name: 'Route A (ML Preferred / Safest)',
        color: '#4edea3',
        dashArray: null,
        weight: 5,
        coords: [
          [26.14, 91.73], // Guwahati
          [25.57, 91.88], // Shillong
          [24.81, 93.93], // Imphal
        ],
      },
      {
        id: 'route-fastest',
        name: 'Route B (Fastest Highway Path)',
        color: '#38bdf8',
        dashArray: '6, 6',
        weight: 3,
        coords: [
          [26.14, 91.73],
          [26.27, 92.93],
          [24.81, 93.93],
        ],
      },
      {
        id: 'route-eco',
        name: 'Route C (Eco / Fuel Efficient)',
        color: '#f59e0b',
        dashArray: '4, 8',
        weight: 3,
        coords: [
          [26.14, 91.73],
          [25.15, 92.83],
          [24.81, 93.93],
        ],
      },
    ];

    const allPolylines = [];

    // 4. Render Polyline Paths for Each Candidate Route
    candidateRoutes.forEach((route) => {
      const polyline = L.polyline(route.coords, {
        color: route.color,
        weight: route.weight,
        dashArray: route.dashArray,
        opacity: 0.85,
      }).addTo(map);

      allPolylines.push(polyline);

      polyline.bindPopup(`
        <div style="font-family: sans-serif; padding: 4px;">
          <strong style="color: ${route.color}">${route.name}</strong>
          <br/><span style="font-size: 11px; color: #86948a;">Candidate Route Framework</span>
        </div>
      `);
    });

    // 5. Waypoint Hub Markers
    L.marker([26.14, 91.73], { icon: customIcon('#4edea3') })
      .addTo(map)
      .bindPopup('<b>Guwahati Central Hub</b>');

    L.marker([24.81, 93.93], { icon: customIcon('#4edea3') })
      .addTo(map)
      .bindPopup('<b>Imphal Terminal</b>');

    L.marker([25.57, 91.88], { icon: customIcon('#f59e0b') })
      .addTo(map)
      .bindPopup('<b>Sector 7G Checkpoint (Shillong)</b>');

    // 6. Auto-fit Map View to Routes (Offsetting left sidebar area)
    const group = new L.featureGroup(allPolylines);
    map.fitBounds(group.getBounds(), {
      paddingTopLeft: [420, 40],
      paddingBottomRight: [40, 40],
      maxZoom: 8,
    });

    // 7. Geolocation Marker
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (!isMounted || !map || !map._container) return;
          const { latitude, longitude } = position.coords;

          L.marker([latitude, longitude], { icon: customIcon('#38bdf8') })
            .addTo(map)
            .bindPopup('📍 Your Active Dispatch Station');
        },
        (err) => console.info('Geolocation skipped:', err.message)
      );
    }

    return () => {
      isMounted = false;
      map.remove();
    };
  }, []);

  return (
    <div className="bg-background font-body-md text-on-background dark min-h-screen">
      {/* Sidebar Navigation */}
      <aside className="fixed left-0 top-0 h-full w-72 bg-surface-container-lowest z-50 flex flex-col border-r border-outline-variant/10 shadow-[2px_0_12px_rgba(0,0,0,0.2)]">
        <div className="p-lg flex items-center gap-md border-b border-outline-variant/10 cursor-pointer" onClick={() => navigate('/')}>
          <img
            alt="NER Logistics logo"
            className="h-8 w-auto object-contain"
            src="https://lh3.googleusercontent.com/aida/AEtjO1VmLsx7BRnTAm4NpIDQtjsZ1kvY3ZuYyLjMv6Fn-gQcvQ9LKOA4sFsIw-8ZBob9EDDr1hsfkt5QvOHt9cGfANm00w3nbPK-64vwiAtktPIim0V9T0mNBvxQk-VE9Q4gphcrsF9AwBHkcoF5Ek-Ebsun4SvRGiHcZWvJ2OMZVDQNA12PeSv3dLy_F-kAJh2bEl0yG0wmZK-fQf4zCOsTsU_b7_TxXFnaZAkDAaY7qhBHuIbXdVgTM8Bn0g"
          />
          <span className="font-headline-md text-headline-md text-primary tracking-tight">NER LOGISTICS</span>
        </div>

        <nav className="flex-1 px-md py-xl space-y-xs">
          <button
            className={`w-full flex items-center px-md py-md rounded-lg text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface transition-all group ${
              activeTab === 'dashboard' ? 'bg-primary-container text-on-primary-container font-bold shadow-[0_0_8px_rgba(16,185,129,0.3)]' : ''
            }`}
            onClick={() => {
              setActiveTab('dashboard');
              navigate('/dashboard');
            }}
          >
            <span className="material-symbols-outlined mr-md">dashboard</span>
            <span className="font-label-caps">DASHBOARD</span>
          </button>

          <button
            className={`w-full flex items-center px-md py-md rounded-lg transition-all group ${
              activeTab === 'fleet-map' ? 'bg-primary-container text-on-primary-container font-bold shadow-[0_0_8px_rgba(16,185,129,0.3)]' : 'text-on-surface-variant hover:bg-surface-container-highest'
            }`}
            onClick={() => {
              setActiveTab('fleet-map');
              navigate('/fleet');
            }}
          >
            <span className="material-symbols-outlined mr-md">map</span>
            <span className="font-label-caps">FLEET MAP</span>
          </button>

          <button
            className={`w-full flex items-center px-md py-md rounded-lg text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface transition-all group ${
              activeTab === 'analytics' ? 'bg-primary-container text-on-primary-container font-bold shadow-[0_0_8px_rgba(16,185,129,0.3)]' : ''
            }`}
            onClick={() => {
              setActiveTab('analytics');
              navigate('/analytics');
            }}
          >
            <span className="material-symbols-outlined mr-md">analytics</span>
            <span className="font-label-caps">ANALYTICS</span>
          </button>
        </nav>

        <div className="p-lg border-t border-outline-variant/10">
          <div className="flex items-center gap-md text-primary">
            <span className="material-symbols-outlined">verified_user</span>
            <span className="font-label-caps text-xs">SYSTEM SECURE</span>
          </div>
        </div>
      </aside>

      {/* Header Bar */}
      <div className="pl-72">
        <header className="fixed top-0 left-72 right-0 h-16 bg-surface-container/80 backdrop-blur-xl z-40 flex items-center justify-between px-xl border-b border-outline-variant/10">
          <div className="flex items-center gap-md">
            <span className="material-symbols-outlined text-primary text-[20px]">shield</span>
            <span className="font-label-caps text-on-surface-variant">ACTIVE OPS PROTOCOL</span>
          </div>
          <div className="flex items-center gap-lg">
            <div className="flex items-center gap-sm bg-surface-container-high px-md py-xs rounded-full border border-primary/20">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
              <span className="text-body-sm font-label-caps text-primary">SYSTEM SECURE</span>
            </div>

            {/* Dynamic User Profile Header Block */}
            <div className="flex items-center gap-md border-l border-outline-variant/20 pl-lg">
              <div className="text-right hidden sm:block">
                <div className="text-body-sm font-bold text-on-surface leading-none">
                  {isLoggedIn ? userData.fullName : 'Guest Operator'}
                </div>
                <div className="text-xs font-label-caps text-on-surface-variant uppercase">
                  {isLoggedIn ? userData.role : 'NOT LOGGED IN'}
                </div>
              </div>

              <div
                className="w-8 h-8 rounded-full bg-primary flex items-center justify-center border border-primary/40 shadow-[0_0_8px_rgba(78,222,163,0.3)] cursor-pointer hover:scale-105 transition-all"
                onClick={handleAvatarClick}
                title={isLoggedIn ? `Logged in as ${userData.fullName}` : 'Sign In'}
              >
                <span className="material-symbols-outlined text-on-primary text-[18px]">person</span>
              </div>
            </div>
          </div>
        </header>

        {/* Fleet Map Main Interface */}
        <main className="relative pt-16 min-h-screen w-full bg-background">
          <div className="flex flex-col w-full h-[calc(100vh-64px)] overflow-hidden relative">
            
            {/* Live Leaflet Map Container */}
            <div
              id="leaflet-map-container"
              className="absolute inset-0 z-0 bg-surface-dim"
            ></div>

            {/* Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-r from-surface/90 via-surface/40 to-transparent z-10 pointer-events-none w-1/3"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-surface/90 via-transparent to-transparent z-10 pointer-events-none h-full"></div>

            {/* Content Layout */}
            <div className="relative z-20 flex w-full h-full p-lg gap-lg">
              {/* Left Panel: Fleet List & Controls */}
              <div className="flex flex-col w-96 bg-surface-container/90 backdrop-blur-xl rounded-xl shadow-2xl overflow-hidden pointer-events-auto flex-shrink-0">
                <div className="p-md bg-surface-container-high/50 flex flex-col gap-sm">
                  <div className="flex items-center justify-between">
                    <h2 className="font-headline-md text-on-surface tracking-tight">Active Fleet</h2>
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-primary">
                      <span className="material-symbols-outlined text-[16px]">local_shipping</span>
                    </span>
                  </div>

                  {/* Filter Pills */}
                  <div className="flex gap-xs mt-sm">
                    {['ALL', 'LOW RISK', 'MED', 'HIGH RISK'].map((filterBtn) => (
                      <button
                        key={filterBtn}
                        className={`px-sm py-xs rounded-md font-label-caps text-xs transition-colors cursor-pointer ${
                          selectedFilter === filterBtn && filterBtn === 'HIGH RISK'
                            ? 'bg-red-500 text-white shadow-[0_0_8px_rgba(239,68,68,0.5)]'
                            : selectedFilter === filterBtn && filterBtn === 'MED'
                            ? 'bg-yellow-500 text-black shadow-[0_0_8px_rgba(234,179,8,0.5)]'
                            : selectedFilter === filterBtn
                            ? 'bg-primary text-on-primary'
                            : 'bg-surface-container-highest text-on-surface-variant hover:bg-surface-variant'
                        }`}
                        onClick={() => setSelectedFilter(filterBtn)}
                      >
                        {filterBtn}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Fleet List Scrollable */}
                <div className="flex-1 overflow-y-auto px-md py-sm space-y-sm custom-scrollbar">
                  {filteredFleet.map((truck, index) => (
                    <div
                      key={truck.id || index}
                      className={`group p-md rounded-lg bg-surface hover:bg-surface-container-highest transition-all cursor-pointer relative overflow-hidden ${
                        selectedTruck.id === truck.id ? 'ring-1 ring-primary' : ''
                      }`}
                      onClick={() => setSelectedTruck(truck)}
                    >
                      <div className={`absolute left-0 top-0 bottom-0 w-1 ${truck.level === 'HIGH' ? 'bg-error animate-pulse' : truck.level === 'MED' ? 'bg-tertiary' : 'bg-primary'}`}></div>
                      <div className="flex justify-between items-start mb-sm">
                        <div>
                          <span className="font-data-mono text-on-surface text-body-sm font-bold">{truck.id}</span>
                          <div className="font-label-caps text-on-surface-variant text-[10px] mt-xs">{truck.route}</div>
                        </div>
                        <div className={`flex items-center gap-xs px-2 py-1 rounded-full ${truck.level === 'HIGH' ? 'bg-error-container text-on-error-container' : 'bg-primary/10 text-primary'}`}>
                          {truck.level === 'HIGH' && <span className="material-symbols-outlined text-[14px]">warning</span>}
                          <span className="font-label-caps text-[10px]">{truck.status}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-sm">
                        <div>
                          <span className="block text-[10px] font-label-caps text-on-surface-variant uppercase">Cargo</span>
                          <span className="font-body-sm text-on-surface">{truck.cargo}</span>
                        </div>
                        <div>
                          <span className="block text-[10px] font-label-caps text-on-surface-variant uppercase">Risk Idx</span>
                          <div className="flex items-center gap-xs mt-0.5">
                            <div className="flex-1 h-1 bg-surface-container-highest rounded-full overflow-hidden">
                              <div
                                className={`h-full ${truck.level === 'HIGH' ? 'bg-error' : truck.level === 'MED' ? 'bg-tertiary' : 'bg-primary'}`}
                                style={{ width: `${truck.score}%` }}
                              ></div>
                            </div>
                            <span className={`font-data-mono text-xs ${truck.level === 'HIGH' ? 'text-error font-bold' : 'text-primary'}`}>
                              {truck.score}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Side Floating Controls & Legend */}
              <div className="flex-1 flex flex-col justify-between items-end pointer-events-none">
                <div className="flex flex-col gap-sm pointer-events-auto mt-md mr-md">
                  <button className="w-10 h-10 rounded-full bg-surface-container-high/80 backdrop-blur text-on-surface hover:text-primary hover:bg-surface-container-highest flex items-center justify-center transition-colors shadow-lg cursor-pointer">
                    <span className="material-symbols-outlined text-[20px]">layers</span>
                  </button>
                  <button className="w-10 h-10 rounded-full bg-surface-container-high/80 backdrop-blur text-on-surface hover:text-primary hover:bg-surface-container-highest flex items-center justify-center transition-colors shadow-lg cursor-pointer">
                    <span className="material-symbols-outlined text-[20px]">my_location</span>
                  </button>
                </div>

                {/* Floating Route Legend Overlay */}
                <div className="bg-surface-container-low/90 backdrop-blur-md border border-outline-variant/30 rounded-lg p-md shadow-xl pointer-events-auto mb-md mr-md">
                  <span className="block font-label-caps text-[10px] text-on-surface-variant uppercase mb-xs font-bold">
                    Active Path Candidates
                  </span>
                  <div className="space-y-xs font-data-mono text-xs">
                    <div className="flex items-center gap-xs">
                      <span className="w-3 h-1 bg-[#4edea3] rounded-full"></span>
                      <span className="text-on-surface">Route A (ML Preferred)</span>
                    </div>
                    <div className="flex items-center gap-xs">
                      <span className="w-3 h-1 bg-[#38bdf8] rounded-full"></span>
                      <span className="text-on-surface-variant">Route B (Fastest)</span>
                    </div>
                    <div className="flex items-center gap-xs">
                      <span className="w-3 h-1 bg-[#f59e0b] rounded-full"></span>
                      <span className="text-on-surface-variant">Route C (Eco)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* User Profile Modal Component */}
      <UserProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        user={userData}
        onSave={handleSaveProfile}
        onLogout={handleLogout}
      />
    </div>
  );
};

export default FleetMap;