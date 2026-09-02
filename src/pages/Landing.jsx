import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './Landing.css';
import UserProfileModal from '../components/UserProfileModal';

const Landing = () => {
  const navigate = useNavigate();
  const [activeArchModal, setActiveArchModal] = useState(null); // 'graph' | 'risk' | 'routing' | null
  // 1. STATE & HOOKS (MUST BE AT TOP OF COMPONENT BODY)
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

// 2. LEAFLET MAP EFFECT
useEffect(() => {
  let isMounted = true; // Tracks component mounting state

  const mapContainer = document.getElementById('leaflet-map-container');
  if (!mapContainer || mapContainer._leaflet_id) return;

  const defaultCenter = [26.14, 91.73];
  const map = L.map('leaflet-map-container', {
    zoomControl: false,
    attributionControl: false,
  }).setView(defaultCenter, 7);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    className: 'dark-map-tiles',
  }).addTo(map);

  const customIcon = (color) =>
    L.divIcon({
      className: 'custom-div-icon',
      html: `<div style="background-color: ${color}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid #0e1511; box-shadow: 0 0 10px ${color};"></div>`,
      iconSize: [12, 12],
      iconAnchor: [6, 6],
    });

  const routeCoords = [
    [26.14, 91.73],
    [25.57, 91.88],
    [24.81, 93.93],
  ];

  L.polyline(routeCoords, {
    color: '#4edea3',
    weight: 3,
    dashArray: '10, 10',
    opacity: 0.8,
  }).addTo(map);

  L.marker([26.14, 91.73], { icon: customIcon('#4edea3') })
    .addTo(map)
    .bindPopup('Guwahati Depot');

  L.marker([24.81, 93.93], { icon: customIcon('#4edea3') })
    .addTo(map)
    .bindPopup('Imphal Terminal');

  // Geolocation Request with Mounting Guard
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        // Guard check: cancel execution if component unmounted or map destroyed
        if (!isMounted || !map || !map._container) return;

        const { latitude, longitude } = position.coords;
        map.flyTo([latitude, longitude], 9, { duration: 1.5 });

        L.marker([latitude, longitude], { icon: customIcon('#38bdf8') })
          .addTo(map)
          .bindPopup('📍 Your Active Dispatch Hub')
          .openPopup();
      },
      (error) => {
        console.info('Geolocation skipped or unavailable.', error.message);
      },
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 60000 }
    );
  }

  // Cleanup on component unmount
  return () => {
    isMounted = false;
    map.remove();
  };
}, []);

  return (
    <div className="bg-surface font-body-md text-on-surface min-h-screen">
      {/* Header / Navbar */}
      <header className="fixed top-0 w-full z-50 bg-surface/90 backdrop-blur-md shadow-[0_4px_20px_-2px_rgba(78,222,163,0.15)] border-b border-outline-variant/10">
        <div className="h-20 max-w-7xl mx-auto px-lg flex items-center justify-between">
          <div className="flex items-center gap-xl">
            <div className="flex items-center gap-sm cursor-pointer" onClick={() => navigate('/')}>
              <img
                alt="NER Logistics logo"
                className="h-8 w-auto object-contain"
                src="https://lh3.googleusercontent.com/aida/AEtjO1VmLsx7BRnTAm4NpIDQtjsZ1kvY3ZuYyLjMv6Fn-gQcvQ9LKOA4sFsIw-8ZBob9EDDr1hsfkt5QvOHt9cGfANm00w3nbPK-64vwiAtktPIim0V9T0mNBvxQk-VE9Q4gphcrsF9AwBHkcoF5Ek-Ebsun4SvRGiHcZWvJ2OMZVDQNA12PeSv3dLy_F-kAJh2bEl0yG0wmZK-fQf4zCOsTsU_b7_TxXFnaZAkDAaY7qhBHuIbXdVgTM8Bn0g"
              />
              <span className="font-headline-md text-headline-md tracking-tight text-on-surface">
                NER LOGISTICS
              </span>
            </div>
            <nav className="hidden md:flex items-center gap-lg">
              <a className="font-label-caps text-label-caps text-on-surface-variant hover:text-primary transition-colors" href="#features">
                FEATURES
              </a>
              <a className="font-label-caps text-label-caps text-on-surface-variant hover:text-primary transition-colors" href="#routing">
                ROUTING
              </a>
              <button
                className="font-label-caps text-label-caps text-on-surface-variant hover:text-primary transition-colors bg-transparent border-none cursor-pointer"
                onClick={() => navigate('/analytics')}
              >
                ANALYTICS
              </button>
              <button
                className="font-label-caps text-label-caps text-primary hover:underline underline-offset-4 bg-transparent border-none cursor-pointer"
                onClick={() => navigate('/login')}
              >
                SIGN IN
              </button>
            </nav>
          </div>

          <div className="flex items-center gap-xl">
            <div className="hidden lg:flex items-center gap-xs px-md py-xs rounded-full bg-surface-container border border-outline-variant">
              <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse-emerald"></span>
              <span className="font-data-mono text-data-mono text-on-surface-variant">
                Engine Status: <span className="text-primary">Operational</span>
              </span>
            </div>

            <button
              className="px-xl py-sm bg-primary text-on-primary font-headline-md text-body-md rounded-lg shadow-[0_0_15px_rgba(78,222,163,0.4)] hover:bg-primary-fixed-dim transition-all cursor-pointer"
              onClick={() => navigate('/dashboard')}
            >
              Launch Dashboard
            </button>

            {/* Profile Avatar Button */}
            <div
              className="w-10 h-10 rounded-full bg-primary hover:bg-primary-fixed-dim flex items-center justify-center cursor-pointer transition-all shadow-[0_0_10px_rgba(78,222,163,0.3)] hover:scale-105"
              onClick={handleAvatarClick}
              title={isLoggedIn ? `Logged in as ${userData.fullName}` : 'Sign In'}
            >
              <span className="material-symbols-outlined text-on-primary text-[22px]">person</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full pt-20 bg-surface min-h-screen">
        <div className="flex flex-col w-full">
          {/* Hero Section */}
          <section className="relative min-h-[90vh] flex items-center pt-24 pb-16 overflow-hidden">
            <div className="absolute inset-0 z-0 opacity-40">
              <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="emerald-glow" x1="0%" x2="100%" y1="0%" y2="100%">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.15" />
                    <stop offset="50%" stopColor="#4edea3" stopOpacity="0.05" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.2" />
                  </linearGradient>
                  <radialGradient cx="50%" cy="50%" id="spotlight" r="50%">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#0e1511" stopOpacity="0" />
                  </radialGradient>
                  <pattern height="40" id="grid" patternUnits="userSpaceOnUse" width="40">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#2b322d" strokeDasharray="2,2" strokeWidth="0.5" />
                  </pattern>
                </defs>
                <rect fill="url(#grid)" height="100%" width="100%" />
                <rect fill="url(#emerald-glow)" height="100%" mixblendmode="overlay" width="100%" />
                <circle className="animate-pulse" cx="20%" cy="30%" fill="url(#spotlight)" r="40%" style={{ animationDuration: '8s' }} />
                <circle className="animate-pulse" cx="80%" cy="70%" fill="url(#spotlight)" r="40%" style={{ animationDuration: '12s', animationDelay: '2s' }} />
              </svg>
            </div>

            <div className="max-w-7xl mx-auto px-lg z-10 w-full relative">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-xl items-center">
                <div className="lg:col-span-7 flex flex-col gap-lg z-20">
                  <div className="inline-flex items-center gap-sm px-md py-xs bg-surface-container/50 backdrop-blur-md rounded-full text-primary w-max">
                    <span className="material-symbols-outlined text-[16px] animate-pulse">radar</span>
                    <span className="font-label-caps text-label-caps">System Active • V 2.4.1</span>
                  </div>
                  <h1 className="font-display-lg text-display-lg text-on-surface tracking-tight max-w-2xl leading-tight">
                    AI-Powered Route Engine &{' '}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-fixed-dim drop-shadow-[0_0_15px_rgba(78,222,163,0.3)]">
                      Environmental Risk Intelligence
                    </span>
                  </h1>
                  <p className="font-body-lg text-body-lg text-on-surface-variant max-w-xl">
                    Real-time route optimization using machine learning for complex logistics networks. Navigate environmental anomalies with sub-second computation.
                  </p>
                  <div className="flex flex-wrap items-center gap-md mt-md">
                    <button
                      className="px-xl py-md bg-primary-container text-on-primary-container font-headline-md text-body-md rounded-lg shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:bg-primary transition-all duration-300 hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] transform hover:-translate-y-1 group flex items-center gap-sm cursor-pointer"
                      onClick={() => navigate('/dashboard')}
                    >
                      <span>Plan Route Now</span>
                      <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
                    </button>
                    <button
                      className="px-xl py-md bg-transparent text-primary font-headline-md text-body-md rounded-lg outline-none ring-1 ring-primary/50 shadow-[0_0_10px_rgba(78,222,163,0.1)] hover:bg-primary/10 transition-all duration-300 flex items-center gap-sm cursor-pointer"
                      onClick={() => navigate('/fleet')}
                    >
                      <span className="material-symbols-outlined">map</span>
                      <span>View Live Risk Map</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-xl mt-xl pt-lg border-t border-outline-variant/30">
                    <div className="flex flex-col gap-xs">
                      <span className="font-data-mono text-body-sm text-primary">95.57%</span>
                      <span className="font-label-caps text-label-caps text-on-surface-variant">ML Coverage %</span>
                    </div>
                    <div className="w-px h-10 bg-outline-variant/30"></div>
                    <div className="flex flex-col gap-xs">
                      <span className="font-data-mono text-body-sm text-primary">3.5M+</span>
                      <span className="font-label-caps text-label-caps text-on-surface-variant">Graph Edges</span>
                    </div>
                    <div className="w-px h-10 bg-outline-variant/30"></div>
                    <div className="flex flex-col gap-xs">
                      <span className="font-data-mono text-body-sm text-primary">&lt;500ms</span>
                      <span className="font-label-caps text-label-caps text-on-surface-variant">Computation Time</span>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-5 relative z-10 h-[500px] w-full group">
                  <div id="leaflet-map-container" key="leaflet-map-container" className="absolute inset-0 bg-surface-container-high rounded-2xl overflow-hidden ring-1 ring-primary/50 shadow-[0_0_30px_rgba(16,185,129,0.4)] z-10 border border-primary/20"></div>
                </div>
              </div>
            </div>
          </section>

          {/* Features Grid Section */}
          <section className="py-24 relative z-20 bg-surface-dim" id="features">
            <div className="max-w-7xl mx-auto px-lg">
              <div className="mb-xl flex items-end justify-between border-b border-outline-variant/20 pb-md">
                <div>
                  <span className="font-label-caps text-label-caps text-primary tracking-[0.2em] uppercase mb-sm block">Core Architecture</span>
                  <h2 className="font-headline-lg text-headline-lg text-on-surface">Engine Capabilities</h2>
                </div>
                <div className="hidden md:block">
                  <span className="font-data-mono text-data-mono text-on-surface-variant [writing-mode:vertical-rl] transform rotate-180 opacity-50">SYS.ARCH.01</span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-lg">
                <div className="group relative bg-surface-container-low p-xl rounded-xl overflow-hidden transition-all duration-300 hover:-translate-y-2 ring-1 ring-outline-variant/30 hover:ring-primary/40 shadow-lg hover:shadow-[0_0_30px_rgba(78,222,163,0.15)]">
                  <div className="absolute top-0 right-0 p-md opacity-20 group-hover:opacity-100 transition-opacity">
                    <span className="font-data-mono text-display-lg text-primary">01</span>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-lg group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-primary text-[24px]">hub</span>
                  </div>
                  <h3 className="font-headline-md text-headline-md text-on-surface mb-sm">FastAPI & NetworkX Graph Engine</h3>
                  <div className="w-full h-px bg-outline-variant/20 mb-md"></div>
                  <p className="font-body-md text-body-md text-on-surface-variant mb-md">
                    High-performance graph routing handling 1.7M+ nodes snapped in real-time, ensuring optimal pathfinding across vast logistical networks.
                  </p>
                  <div className="mt-auto pt-md inline-flex items-center gap-xs font-label-caps text-label-caps text-primary cursor-pointer hover:underline underline-offset-4"
                       onClick={() => setActiveArchModal('graph')}>
                    Explore Architecture <span className="material-symbols-outlined text-[14px]">arrow_outward</span>
                  </div>
                </div>
                {/* small error the below div                 <div className="group relative bg-surface-container p-xl rounded-xl overflow-hidden transition-all duration-300 hover:-translate-y-2 ring-1 ring-outline-variant/30 hover:ring-error/40 shadow-lg hover:shadow-[0_0_30px_rgba(255,180,171,0.15)] -mt-md">
                       has some issue the mid part in landing page forest thing doesnt show anything */}
                <div className="group relative bg-surface-container p-xl rounded-xl overflow-hidden transition-all duration-300 hover:-translate-y-2 ring-1 ring-outline-variant/30 hover:ring-error/40 shadow-lg hover:shadow-[0_0_30px_rgba(255,180,171,0.15)] -mt-md">
                  <div className="absolute inset-0 bg-gradient-to-br from-error/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="absolute top-0 right-0 p-md opacity-20 group-hover:opacity-100 transition-opacity">
                    <span className="font-data-mono text-display-lg text-error">02</span>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-error/10 flex items-center justify-center mb-lg group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-error text-[24px]">warning</span>
                  </div>
                  <h3 className="font-headline-md text-headline-md text-on-surface mb-sm">Isolation Forest Risk Model</h3>
                  <div className="w-full h-px bg-outline-variant/20 mb-md"></div>
                  <p className="font-body-md text-body-md text-on-surface-variant mb-md">
                    Unsupervised learning model scoring environmental anomalies dynamically to preemptively reroute critical assets away from emerging hazards.
                  </p>
                  <div className="mt-auto pt-md inline-flex items-center gap-xs font-label-caps text-label-caps text-error cursor-pointer hover:underline underline-offset-4"
                       onClick={() => setActiveArchModal('risk')}>
                    View Risk Matrix <span className="material-symbols-outlined text-[14px]">arrow_outward</span>
                  </div>
                </div>

                <div className="group relative bg-surface-container-low p-xl rounded-xl overflow-hidden transition-all duration-300 hover:-translate-y-2 ring-1 ring-outline-variant/30 hover:ring-secondary/40 shadow-lg hover:shadow-[0_0_30px_rgba(173,198,255,0.15)]">
                  <div className="absolute top-0 right-0 p-md opacity-20 group-hover:opacity-100 transition-opacity">
                    <span className="font-data-mono text-display-lg text-secondary">03</span>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center mb-lg group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-secondary text-[24px]">route</span>
                  </div>
                  <h3 className="font-headline-md text-headline-md text-on-surface mb-sm">Multi-Candidate Routing</h3>
                  <div className="w-full h-px bg-outline-variant/20 mb-md"></div>
                  <p className="font-body-md text-body-md text-on-surface-variant mb-md">
                    Advanced Dijkstra edge-penalty optimization calculates multiple viable paths simultaneously, balancing speed, safety, and fuel efficiency.
                  </p>
                  <div className="mt-auto pt-md inline-flex items-center gap-xs font-label-caps text-label-caps text-secondary cursor-pointer hover:underline underline-offset-4"
                       onClick={() => setActiveArchModal('routing')}>
                    Analyze Algorithms <span className="material-symbols-outlined text-[14px]">arrow_outward</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Interactive Data Telemetry Section */}
          <section className="py-24 relative overflow-hidden bg-surface">
            <div className="absolute -right-1/4 top-1/4 w-[800px] h-[800px] rounded-full bg-primary/5 blur-[100px] mix-blend-screen pointer-events-none"></div>
            <div className="max-w-7xl mx-auto px-lg relative z-10 flex flex-col md:flex-row items-center gap-xl">
              <div className="w-full md:w-1/2 flex flex-col gap-md">
                <span className="font-label-caps text-label-caps text-primary-fixed-dim bg-primary/10 w-max px-sm py-xs rounded border border-primary/20">LIVE TELEMETRY</span>
                <h2 className="font-headline-lg text-headline-lg text-on-surface max-w-md">Real-time edge penalty adjustment across 3.5M+ nodes.</h2>
                <p className="font-body-md text-body-md text-on-surface-variant max-w-md mb-lg">
                  Our infrastructure ingests weather, traffic, and socio-political data feeds, updating graph edge weights globally every 60 seconds to ensure routing decisions are based on current reality, not historical averages.
                </p>
                <div className="bg-surface-container rounded-lg ring-1 ring-outline-variant/30 overflow-hidden shadow-lg w-full max-w-lg">
                  <div className="grid grid-cols-3 p-sm border-b border-outline-variant/20 font-label-caps text-label-caps text-on-surface-variant bg-surface-container-high">
                    <div>NODE_ID</div>
                    <div>STATUS</div>
                    <div className="text-right">PENALTY_SCORE</div>
                  </div>
                  <div className="grid grid-cols-3 p-sm border-b border-outline-variant/10 font-data-mono text-data-mono text-on-surface items-center">
                    <div>NX-7829-A</div>
                    <div className="flex items-center gap-xs"><span className="w-2 h-2 rounded-full bg-primary"></span> OK</div>
                    <div className="text-right text-primary">0.92</div>
                  </div>
                  <div className="grid grid-cols-3 p-sm border-b border-outline-variant/10 font-data-mono text-data-mono text-on-surface items-center bg-error/5">
                    <div>NX-7830-B</div>
                    <div className="flex items-center gap-xs"><span className="w-2 h-2 rounded-full bg-error animate-pulse"></span> HAZARD</div>
                    <div className="text-right text-error font-bold">+4.50</div>
                  </div>
                  <div className="grid grid-cols-3 p-sm font-data-mono text-data-mono text-on-surface items-center">
                    <div>NX-7831-C</div>
                    <div className="flex items-center gap-xs"><span className="w-2 h-2 rounded-full bg-primary"></span> OK</div>
                    <div className="text-right text-primary">1.05</div>
                  </div>
                </div>
              </div>

              <div className="w-full md:w-1/2 flex justify-center">
                <div className="relative w-full max-w-[500px] aspect-square rounded-full border border-outline-variant/20 flex items-center justify-center p-xl">
                  <div className="absolute inset-0 border border-primary/20 rounded-full animate-[spin_60s_linear_infinite] border-dashed"></div>
                  <div className="absolute inset-4 border border-secondary/20 rounded-full animate-[spin_40s_linear_infinite_reverse] border-dotted"></div>
                  <div className="absolute inset-12 border border-outline-variant/30 rounded-full flex items-center justify-center bg-surface-container-low shadow-[inset_0_0_50px_rgba(0,0,0,0.5)]">
                    <div className="text-center flex flex-col gap-xs">
                      <span className="font-display-lg text-display-lg text-primary tracking-tighter">99.9%</span>
                      <span className="font-label-caps text-label-caps text-on-surface-variant">UPTIME SLAS</span>
                    </div>
                  </div>
                  <div className="absolute top-0 left-1/2 w-4 h-4 bg-primary rounded-full shadow-[0_0_15px_#4edea3] -translate-x-1/2 -translate-y-1/2"></div>
                  <div className="absolute bottom-1/4 right-0 w-3 h-3 bg-error rounded-full shadow-[0_0_10px_#ffb4ab] translate-x-1/2 translate-y-1/2"></div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        user={userData}
        onSave={handleSaveProfile}
        onLogout={handleLogout}
      />

      {/* ARCHITECTURE DEEP-DIVE MODALS */}
{activeArchModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-md animate-fadeIn">
    <div className="bg-surface-container-low border border-outline-variant/30 rounded-2xl p-xl max-w-2xl w-full relative shadow-2xl">
      {/* Modal Header */}
      <div className="flex justify-between items-center mb-lg border-b border-outline-variant/10 pb-md">
        <div className="flex items-center gap-sm">
          <span className="material-symbols-outlined text-primary text-[24px]">
            {activeArchModal === 'graph' ? 'hub' : activeArchModal === 'risk' ? 'warning' : 'route'}
          </span>
          <h3 className="font-headline-md text-headline-md text-on-surface">
            {activeArchModal === 'graph' && 'FastAPI & NetworkX Graph Engine'}
            {activeArchModal === 'risk' && 'Isolation Forest Risk Matrix'}
            {activeArchModal === 'routing' && 'Multi-Candidate Routing Engine'}
          </h3>
        </div>
        <button
          className="text-on-surface-variant hover:text-on-surface p-xs rounded cursor-pointer"
          onClick={() => setActiveArchModal(null)}
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>
      </div>

      {/* MODAL 01: GRAPH ENGINE */}
      {activeArchModal === 'graph' && (
        <div className="space-y-md">
          <div className="grid grid-cols-3 gap-md">
            <div className="bg-surface p-md rounded-lg border border-outline-variant/20">
              <span className="block font-label-caps text-[10px] text-on-surface-variant">SNAPPED NODES</span>
              <span className="font-data-mono text-headline-md text-primary">1.74M</span>
            </div>
            <div className="bg-surface p-md rounded-lg border border-outline-variant/20">
              <span className="block font-label-caps text-[10px] text-on-surface-variant">GRAPH MEMORY</span>
              <span className="font-data-mono text-headline-md text-on-surface">1.2 GB</span>
            </div>
            <div className="bg-surface p-md rounded-lg border border-outline-variant/20">
              <span className="block font-label-caps text-[10px] text-on-surface-variant">EXEC TIME</span>
              <span className="font-data-mono text-headline-md text-primary">&lt;350ms</span>
            </div>
          </div>

          <div className="p-md bg-surface rounded-lg border border-outline-variant/20 space-y-sm">
            <span className="font-label-caps text-xs text-primary">GRAPH NODE TOPOLOGY</span>
            <div className="flex items-center justify-between font-data-mono text-xs text-on-surface-variant p-sm bg-surface-container rounded">
              <span className="text-primary">GHY-DEPOT [01]</span>
              <span className="text-outline-variant">── 342 Nodes ──▶</span>
              <span className="text-tertiary">SHL-HUB [04]</span>
              <span className="text-outline-variant">── 891 Nodes ──▶</span>
              <span className="text-primary">IMP-TERM [09]</span>
            </div>
          </div>

          <p className="font-body-sm text-on-surface-variant">
            Leveraging NetworkX with custom Rust-backed C extensions to perform Dijkstra pathing over millions of road segments, with edge spatial snapping powered by FastAPI asynchronous endpoints.
          </p>
        </div>
      )}

      {/* MODAL 02: RISK MODEL */}
      {activeArchModal === 'risk' && (
        <div className="space-y-md">
          <p className="font-body-sm text-on-surface-variant">
            Unsupervised Isolation Forest isolates environmental anomalies (landslides, heavy downpours, road blockages) and assigns edge weight multipliers in real-time.
          </p>

          <div className="bg-surface rounded-lg border border-outline-variant/20 overflow-hidden">
            <div className="grid grid-cols-3 p-sm border-b border-outline-variant/20 font-label-caps text-[10px] text-on-surface-variant bg-surface-container">
              <div>HAZARD CONDITION</div>
              <div>RISK SCORE</div>
              <div className="text-right">PENALTY MULTIPLIER</div>
            </div>
            <div className="grid grid-cols-3 p-sm border-b border-outline-variant/10 font-data-mono text-xs items-center">
              <div>Heavy Downpour / Flash Flood</div>
              <div className="text-error">0.88 (Critical)</div>
              <div className="text-right text-error font-bold">+4.5x</div>
            </div>
            <div className="grid grid-cols-3 p-sm border-b border-outline-variant/10 font-data-mono text-xs items-center">
              <div>Dense Fog (&lt;50m visibility)</div>
              <div className="text-tertiary">0.52 (Moderate)</div>
              <div className="text-right text-tertiary font-bold">+1.8x</div>
            </div>
            <div className="grid grid-cols-3 p-sm font-data-mono text-xs items-center">
              <div>Optimal Highway Conditions</div>
              <div className="text-primary">0.05 (Clear)</div>
              <div className="text-right text-primary font-bold">+0.0x</div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 03: MULTI-CANDIDATE ROUTING */}
      {activeArchModal === 'routing' && (
        <div className="space-y-md">
          <p className="font-body-sm text-on-surface-variant">
            Edge-penalty optimization evaluates alternative candidates simultaneously to optimize for time, safety, and fuel consumption.
          </p>

          <div className="grid grid-cols-3 gap-sm">
            <div className="p-sm bg-surface rounded-lg border border-outline-variant/20 space-y-xs">
              <span className="font-label-caps text-[10px] text-on-surface-variant">ROUTE A (FASTEST)</span>
              <div className="font-data-mono text-xs text-on-surface">340 km | 6h 15m</div>
              <div className="text-[10px] text-error">High Hazard Risk</div>
            </div>

            <div className="p-sm bg-surface rounded-lg border-2 border-primary/60 bg-primary/5 space-y-xs relative">
              <span className="font-label-caps text-[10px] text-primary font-bold">ROUTE B (PREFERRED ⭐)</span>
              <div className="font-data-mono text-xs text-on-surface">365 km | 6h 30m</div>
              <div className="text-[10px] text-primary">0.4 Anomaly Score</div>
            </div>

            <div className="p-sm bg-surface rounded-lg border border-outline-variant/20 space-y-xs">
              <span className="font-label-caps text-[10px] text-on-surface-variant">ROUTE C (ECO)</span>
              <div className="font-data-mono text-xs text-on-surface">350 km | 6h 50m</div>
              <div className="text-[10px] text-tertiary">Fuel Optimized (-12%)</div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Close Action */}
      <div className="mt-lg pt-md border-t border-outline-variant/10 flex justify-end">
        <button
          className="px-md py-xs bg-primary text-on-primary rounded font-label-caps text-xs cursor-pointer"
          onClick={() => setActiveArchModal(null)}
        >
          DISMISS VIEW
        </button>
      </div>
    </div>
  </div>
)}

      {/* Footer */}
      <footer className="w-full bg-surface-container-lowest py-xl border-t border-outline-variant/10">
        <div className="max-w-7xl mx-auto px-lg flex flex-col md:flex-row justify-between items-center gap-md">
          <div className="flex items-center gap-sm text-on-surface-variant">
            <img
              alt="NER Logistics logo"
              className="h-5 w-auto grayscale opacity-50"
              src="https://lh3.googleusercontent.com/aida/AEtjO1VmLsx7BRnTAm4NpIDQtjsZ1kvY3ZuYyLjMv6Fn-gQcvQ9LKOA4sFsIw-8ZBob9EDDr1hsfkt5QvOHt9cGfANm00w3nbPK-64vwiAtktPIim0V9T0mNBvxQk-VE9Q4gphcrsF9AwBHkcoF5Ek-Ebsun4SvRGiHcZWvJ2OMZVDQNA12PeSv3dLy_F-kAJh2bEl0yG0wmZK-fQf4zCOsTsU_b7_TxXFnaZAkDAaY7qhBHuIbXdVgTM8Bn0g"
            />
            <span className="font-label-caps text-label-caps">NER LOGISTICS © 2026</span>
          </div>
          <div className="flex gap-lg font-label-caps text-label-caps text-on-surface-variant">
            <a className="hover:text-primary" href="#">Privacy Policy</a>
            <a className="hover:text-primary" href="#">Terms of Service</a>
            <a className="hover:text-primary" href="#">API Status</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;