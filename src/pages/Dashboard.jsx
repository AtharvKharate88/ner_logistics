import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import RiskBadge from '../components/RiskBadge';
import UserProfileModal from '../components/UserProfileModal';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();

  // 1. Network Tracker State & Hook
  const [networkStats, setNetworkStats] = useState({
    type: '4G',
    speed: '10.0',
    fillPercent: 85,
    status: '4G (GOOD)',
  });

//   useEffect(() => {
//     const updateNetworkInfo = () => {
//       const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

//       if (!conn) {
//         setNetworkStats({ type: 'ONLINE', speed: '10+', fillPercent: 90, status: 'NETWORK SECURE' });
//         return;
//       }

//       const downlink = conn.downlink || 10;
//       const effectiveType = (conn.effectiveType || '4g').toUpperCase();

//       let fill = 100;
//       if (downlink >= 10) fill = 100;
//       else if (downlink >= 5) fill = 75;
//       else if (downlink >= 1) fill = 40;
//       else fill = 15;

//       setNetworkStats({
//         type: effectiveType,
//         speed: downlink,
//         fillPercent: fill,
//         status: `${effectiveType} (${downlink} Mbps)`,
//       });
//     };

//     updateNetworkInfo();

//     const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
//     if (conn) {
//       conn.addEventListener('change', updateNetworkInfo);
//       return () => conn.removeEventListener('change', updateNetworkInfo);
//     }
//   }, []);

//   Real time implementation for network measuring > 10Mbps
useEffect(() => {
  const measureActualSpeed = async () => {
    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    let typeLabel = conn?.effectiveType ? conn.effectiveType.toUpperCase() : 'ONLINE';

    // 1. Measure real-time latency & throughput with a lightweight ping (50KB sample asset)
    const startTime = performance.now();
    try {
      const response = await fetch('https://httpbin.org/bytes/51200?cachebust=' + Math.random(), {
        cache: 'no-store',
      });
      const blob = await response.blob();
      const endTime = performance.now();

      const durationInSeconds = (endTime - startTime) / 1000;
      const bitsLoaded = blob.size * 8;
      const speedMbps = parseFloat((bitsLoaded / durationInSeconds / 1000000).toFixed(1));

      // 2. Scale across high-speed benchmarks (Up to 100+ Mbps)
      let fill = 100;
      let quality = 'EXCELLENT';

      if (speedMbps >= 50) {
        fill = 100;
        quality = 'ULTRA (5G/FIBER)';
      } else if (speedMbps >= 20) {
        fill = 85;
        quality = 'FAST (5G/4G+)';
      } else if (speedMbps >= 10) {
        fill = 65;
        quality = 'GOOD (4G)';
      } else if (speedMbps >= 2) {
        fill = 35;
        quality = 'DEGRADED (3G)';
      } else {
        fill = 15;
        quality = 'CRITICAL';
      }

      setNetworkStats({
        type: typeLabel,
        speed: speedMbps,
        fillPercent: fill,
        status: `${speedMbps} Mbps (${quality})`,
      });
    } catch (err) {
      // Fallback if fetch fails or user is offline
      setNetworkStats({
        type: 'OFFLINE',
        speed: 0,
        fillPercent: 10,
        status: 'DISCONNECTED',
      });
    }
  };

  measureActualSpeed();
  const interval = setInterval(measureActualSpeed, 15000); // Re-check speed every 15s

  return () => clearInterval(interval);
}, []);

  // 2. Application & User Auth State
  const [activeTab, setActiveTab] = useState('dashboard-home');
  const [selectedRoute, setSelectedRoute] = useState('TRK-114B');
  const [timeFilter, setTimeFilter] = useState('Today (Live)');
  const [origin, setOrigin] = useState('JFK Logistics Center');
  const [destination, setDestination] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);
  const [simResult, setSimResult] = useState(null);

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

  const handleRunScenario = () => {
    if (!destination) return;
    setIsSimulating(true);
    setSimResult(null);

    setTimeout(() => {
      setIsSimulating(false);
      setSimResult({
        id: `SIM-${Math.floor(1000 + Math.random() * 9000)}`,
        status: 'Optimal Route Computed',
        level: 'LOW',
        score: 95,
      });
    }, 1000);
  };

  return (
    <div className="bg-surface font-body-md text-on-surface min-h-screen">
      {/* Sidebar Navigation */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-surface-container-lowest z-50 flex flex-col border-r border-outline-variant/10">
        <div className="h-20 flex items-center px-xl gap-sm cursor-pointer" onClick={() => navigate('/')}>
          <img
            alt="NER Logistics logo"
            className="h-8 w-auto"
            src="https://lh3.googleusercontent.com/aida/AEtjO1VmLsx7BRnTAm4NpIDQtjsZ1kvY3ZuYyLjMv6Fn-gQcvQ9LKOA4sFsIw-8ZBob9EDDr1hsfkt5QvOHt9cGfANm00w3nbPK-64vwiAtktPIim0V9T0mNBvxQk-VE9Q4gphcrsF9AwBHkcoF5Ek-Ebsun4SvRGiHcZWvJ2OMZVDQNA12PeSv3dLy_F-kAJh2bEl0yG0wmZK-fQf4zCOsTsU_b7_TxXFnaZAkDAaY7qhBHuIbXdVgTM8Bn0g"
          />
          <span className="font-headline-md text-headline-md tracking-tight">CORE</span>
        </div>

        <nav className="flex-1 px-md mt-md space-y-xs">
          <button
            className={`w-full flex items-center gap-md px-md py-sm rounded-lg transition-all ${
              activeTab === 'dashboard-home'
                ? 'bg-primary text-on-primary font-bold'
                : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
            }`}
            onClick={() => {
              setActiveTab('dashboard-home');
              navigate('/dashboard');
            }}
          >
            <span className="material-symbols-outlined">dashboard</span>
            <span className="font-label-caps">DASHBOARD</span>
          </button>

          <button
            className={`w-full flex items-center gap-md px-md py-sm rounded-lg transition-all ${
              activeTab === 'fleet-map'
                ? 'bg-primary text-on-primary font-bold'
                : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
            }`}
            onClick={() => {
              setActiveTab('fleet-map');
              navigate('/fleet');
            }}
          >
            <span className="material-symbols-outlined">map</span>
            <span className="font-label-caps">FLEET MAP</span>
          </button>

          <button
            className={`w-full flex items-center gap-md px-md py-sm rounded-lg transition-all ${
              activeTab === 'real-time-analytics'
                ? 'bg-primary text-on-primary font-bold'
                : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
            }`}
            onClick={() => {
              setActiveTab('real-time-analytics');
              navigate('/analytics');
            }}
          >
            <span className="material-symbols-outlined">monitoring</span>
            <span className="font-label-caps">ANALYTICS</span>
          </button>
        </nav>

        {/* Dynamic Network Health Sidebar Component */}
        <div className="p-md">
          <div className="bg-surface-container p-md rounded-xl border border-outline-variant/20">
            <div className="flex justify-between items-center mb-xs">
              <span className="text-label-caps text-on-surface-variant text-[10px]">NETWORK HEALTH</span>
              <span className="font-data-mono text-[10px] text-primary font-bold">{networkStats.status}</span>
            </div>
            <div className="h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  networkStats.fillPercent < 30 ? 'bg-error shadow-[0_0_8px_#ffb4ab]' : 'bg-primary shadow-[0_0_8px_#4edea3]'
                }`}
                style={{ width: `${networkStats.fillPercent}%` }}
              ></div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Dashboard Panel */}
      <div className="pl-64">
        {/* Top Header Bar */}
        <header className="fixed top-0 left-64 right-0 h-16 bg-surface/80 backdrop-blur-md shadow-[0_1px_8px_rgba(0,0,0,0.1)] z-40 flex items-center justify-between px-xl">
          <div className="font-headline-md text-body-lg text-on-surface-variant">Operational Console</div>
          <div className="flex items-center gap-lg">
            <div className="flex items-center gap-xs px-sm py-xs bg-surface-container-low rounded border border-outline-variant/20">
              <span className="w-2 h-2 rounded-full bg-primary"></span>
              <span className="font-data-mono text-body-sm text-primary">SYSTEM SECURE</span>
            </div>
            
            {/* Interactive Profile Block */}
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

        <main className="relative pt-16 bg-surface min-h-screen">
          <div className="flex flex-col w-full h-full relative p-lg gap-xl">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-surface to-surface pointer-events-none -z-10"></div>

            {/* Title Bar */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-md relative">
              <div className="flex flex-col gap-xs">
                <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight font-light mix-blend-plus-lighter">
                  Global Operations
                </h1>
                <div className="flex items-center gap-md">
                  <div className="flex items-center gap-xs px-sm py-[2px] bg-primary/10 rounded-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_#4edea3] animate-pulse"></span>
                    <span className="font-label-caps text-label-caps text-primary tracking-widest uppercase">
                      Engine Operational
                    </span>
                  </div>
                  <div className="w-px h-4 bg-outline-variant/30"></div>
                  <span className="font-data-mono text-body-sm text-on-surface-variant/70">SYNC: 14:32:05 UTC</span>
                </div>
              </div>

              <div className="flex gap-md w-full md:w-auto">
                <div className="flex-1 md:flex-none relative group">
                  <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
                    calendar_month
                  </span>
                  <select
                    className="w-full appearance-none bg-surface-container-high/50 hover:bg-surface-container-high backdrop-blur-sm text-on-surface font-body-sm pl-xl pr-lg py-sm rounded focus:outline-none focus:ring-1 focus:ring-primary transition-all duration-300"
                    value={timeFilter}
                    onChange={(e) => setTimeFilter(e.target.value)}
                  >
                    <option>Today (Live)</option>
                    <option>Last 24 Hours</option>
                    <option>Last 7 Days</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-sm top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px] pointer-events-none">
                    expand_more
                  </span>
                </div>

                <button
                  className="relative overflow-hidden group bg-primary hover:bg-primary-fixed text-on-primary font-label-caps text-label-caps px-md py-sm rounded flex items-center gap-xs transition-colors duration-300 shadow-[0_0_15px_rgba(78,222,163,0.3)] hover:shadow-[0_0_20px_rgba(78,222,163,0.5)] cursor-pointer"
                  onClick={() => navigate('/fleet')}
                >
                  <span className="material-symbols-outlined text-[18px]">route</span>
                  QUICK PLAN
                </button>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-sm w-full">
              <div className="bg-surface-container-low/60 backdrop-blur-md p-md rounded-lg group hover:bg-surface-container-low transition-all duration-300">
                <div className="flex justify-between items-start mb-lg">
                  <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">
                    Total Routes
                  </span>
                  <span className="material-symbols-outlined text-outline-variant group-hover:text-primary transition-colors text-[20px]">
                    moving
                  </span>
                </div>
                <div className="flex items-end gap-sm">
                  <span className="font-display-lg text-headline-lg text-on-surface leading-none">2,450</span>
                  <span className="font-data-mono text-label-caps text-primary mb-1 flex items-center">
                    <span className="material-symbols-outlined text-[14px]">arrow_upward</span>12%
                  </span>
                </div>
                <div className="mt-md h-1 w-full bg-surface-container-highest rounded-full overflow-hidden">
                  <div className="h-full bg-surface-tint w-[70%]"></div>
                </div>
              </div>

              <div className="bg-surface-container-low/60 backdrop-blur-md p-md rounded-lg group hover:bg-surface-container-low transition-all duration-300">
                <div className="flex justify-between items-start mb-lg">
                  <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">
                    Safe Routes
                  </span>
                  <span className="material-symbols-outlined text-outline-variant group-hover:text-primary transition-colors text-[20px]">
                    verified_user
                  </span>
                </div>
                <div className="flex items-end gap-sm">
                  <span className="font-display-lg text-headline-lg text-on-surface leading-none">2,102</span>
                  <span className="font-data-mono text-label-caps text-on-surface-variant mb-1">85.8%</span>
                </div>
                <div className="mt-md h-1 w-full bg-surface-container-highest rounded-full overflow-hidden flex gap-[2px]">
                  <div className="h-full bg-primary w-[85%]"></div>
                  <div className="h-full bg-surface-variant flex-1"></div>
                </div>
              </div>

              <div className="bg-surface-container-low/60 backdrop-blur-md p-md rounded-lg group hover:bg-surface-container-low transition-all duration-300 relative overflow-hidden">
                <div className="flex justify-between items-start mb-lg relative">
                  <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">
                    High Risk
                  </span>
                  <span className="material-symbols-outlined text-outline-variant group-hover:text-error transition-colors text-[20px]">
                    warning
                  </span>
                </div>
                <div className="flex items-end gap-sm relative">
                  <span className="font-display-lg text-headline-lg text-error leading-none group-hover:animate-pulse">
                    14
                  </span>
                  <span className="font-data-mono text-label-caps text-error mb-1 flex items-center">
                    <span className="material-symbols-outlined text-[14px]">arrow_upward</span>3
                  </span>
                </div>
                <div className="mt-md flex items-center gap-xs relative">
                  <span className="w-1.5 h-1.5 rounded-full bg-error animate-pulse"></span>
                  <span className="font-label-caps text-[10px] text-error/80 uppercase">Immediate Action</span>
                </div>
              </div>

              <div className="bg-surface-container-low/60 backdrop-blur-md p-md rounded-lg group hover:bg-surface-container-low transition-all duration-300">
                <div className="flex justify-between items-start mb-lg">
                  <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">
                    Avg Anomaly
                  </span>
                  <span className="material-symbols-outlined text-outline-variant group-hover:text-tertiary transition-colors text-[20px]">
                    analytics
                  </span>
                </div>
                <div className="flex items-end gap-sm">
                  <span className="font-display-lg text-headline-lg text-on-surface leading-none">32</span>
                  <span className="font-data-mono text-label-caps text-on-surface-variant mb-1">/100</span>
                </div>
                <svg className="mt-md w-full h-8 text-outline-variant/30 group-hover:text-tertiary/50 transition-colors" preserveAspectRatio="none" viewBox="0 0 100 20">
                  <path d="M0 15 Q 10 5, 20 15 T 40 10 T 60 15 T 80 5 T 100 15" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2"></path>
                </svg>
              </div>

              <div className="bg-surface-container-low/60 backdrop-blur-md p-md rounded-lg group hover:bg-surface-container-low transition-all duration-300 col-span-2 md:col-span-1">
                <div className="flex justify-between items-start mb-lg">
                  <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">
                    ML Coverage
                  </span>
                  <span className="material-symbols-outlined text-outline-variant group-hover:text-primary transition-colors text-[20px]">
                    model_training
                  </span>
                </div>
                <div className="flex items-end gap-sm">
                  <span className="font-display-lg text-headline-lg text-on-surface leading-none">
                    95.6<span className="text-headline-md">%</span>
                  </span>
                </div>
                <div className="mt-md flex gap-1">
                  <div className="h-1.5 flex-1 bg-primary rounded-full shadow-[0_0_5px_#4edea3]"></div>
                  <div className="h-1.5 flex-1 bg-primary rounded-full shadow-[0_0_5px_#4edea3]"></div>
                  <div className="h-1.5 flex-1 bg-primary rounded-full shadow-[0_0_5px_#4edea3]"></div>
                  <div className="h-1.5 w-1/4 bg-surface-variant rounded-full"></div>
                </div>
              </div>
            </div>

            {/* Active Corridors & System Events Section */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg flex-1 min-h-0">
              {/* Active Corridors Table */}
              <div className="lg:col-span-8 flex flex-col bg-surface-container-lowest/80 backdrop-blur-md rounded-xl overflow-hidden shadow-lg relative group/panel">
                <div className="px-lg py-md border-b border-outline-variant/10 flex justify-between items-center relative z-10">
                  <div className="flex items-center gap-sm">
                    <span className="material-symbols-outlined text-on-surface-variant">list_alt</span>
                    <h2 className="font-headline-md text-body-lg text-on-surface">Active Corridors</h2>
                  </div>
                  <div className="flex items-center gap-xs">
                    <span className="font-data-mono text-[10px] text-on-surface-variant/50 uppercase">Live Update</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_4px_#4edea3]"></span>
                  </div>
                </div>

                <div className="flex-1 overflow-auto relative z-10">
                  <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 bg-surface-container-lowest/90 backdrop-blur-md z-20">
                      <tr>
                        <th className="font-label-caps text-label-caps text-on-surface-variant py-sm px-md font-medium uppercase border-b border-outline-variant/10">Origin → Dest</th>
                        <th className="font-label-caps text-label-caps text-on-surface-variant py-sm px-md font-medium uppercase border-b border-outline-variant/10">Vehicle ID</th>
                        <th className="font-label-caps text-label-caps text-on-surface-variant py-sm px-md font-medium uppercase border-b border-outline-variant/10">Dist</th>
                        <th className="font-label-caps text-label-caps text-on-surface-variant py-sm px-md font-medium uppercase border-b border-outline-variant/10">Risk Level</th>
                        <th className="font-label-caps text-label-caps text-on-surface-variant py-sm px-md font-medium uppercase border-b border-outline-variant/10">Score</th>
                        <th className="font-label-caps text-label-caps text-on-surface-variant py-sm px-md font-medium uppercase border-b border-outline-variant/10 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="font-body-sm divide-y divide-outline-variant/5">
                      {[
                        { id: 'TRK-902A', origin: 'Guwahati Hub', dest: 'Shillong Depot', dist: '62mi', level: 'LOW', score: 94 },
                        { id: 'TRK-114B', origin: 'Tezpur Station', dest: 'Tawang Sector', dist: '204mi', level: 'HIGH', score: 42 },
                        { id: 'TRK-882C', origin: 'Silchar Terminal', dest: 'Imphal Central', dist: '158mi', level: 'MED', score: 76 },
                        { id: 'TRK-405D', origin: 'Dimapur Station', dest: 'Kohima Hub', dist: '44mi', level: 'LOW', score: 91 },
                        { id: 'TRK-211E', origin: 'Jorhat Junction', dest: 'Dibrugarh Terminal', dist: '85mi', level: 'LOW', score: 88 },
                      ].map((row) => (
                        <tr
                          key={row.id}
                          className={`hover:bg-surface-container-low/50 transition-colors cursor-pointer ${
                            selectedRoute === row.id ? 'bg-surface-container' : ''
                          } ${row.level === 'HIGH' ? 'bg-error/5' : ''}`}
                          onClick={() => setSelectedRoute(row.id)}
                        >
                          <td className="py-md px-md">
                            <div className="flex flex-col">
                              <span className="text-on-surface truncate max-w-[150px]">{row.origin}</span>
                              <span className="text-on-surface-variant text-[11px] truncate max-w-[150px]">{row.dest}</span>
                            </div>
                          </td>
                          <td className="py-md px-md">
                            <span className="font-data-mono text-on-surface-variant group-hover:text-primary transition-colors">
                              {row.id}
                            </span>
                          </td>
                          <td className="py-md px-md"><span className="font-data-mono text-on-surface-variant">{row.dist}</span></td>
                          <td className="py-md px-md"><RiskBadge level={row.level} /></td>
                          <td className="py-md px-md">
                            <span className={`font-data-mono ${row.level === 'HIGH' ? 'text-error font-bold' : 'text-on-surface'}`}>
                              {row.score}
                            </span>
                          </td>
                          <td className="py-md px-md text-right">
                            <button
                              className="text-on-surface-variant hover:text-primary transition-colors p-xs rounded hover:bg-surface-container cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate('/fleet');
                              }}
                            >
                              <span className="material-symbols-outlined text-[20px]">
                                {row.level === 'HIGH' ? 'warning' : 'explore'}
                              </span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="px-lg py-sm border-t border-outline-variant/10 bg-surface-container-highest/20 flex justify-between items-center z-10">
                  <span className="font-data-mono text-[11px] text-on-surface-variant">Showing 5 of 2,450 records</span>
                  <div className="flex gap-xs">
                    <button className="p-xs text-on-surface-variant hover:text-primary disabled:opacity-30">
                      <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                    </button>
                    <button className="p-xs text-on-surface-variant hover:text-primary">
                      <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* System Events & Simulation Bay Column */}
              <div className="lg:col-span-4 flex flex-col gap-lg min-h-0">
                <div className="flex-1 bg-surface-container-low/40 rounded-xl border border-outline-variant/10 overflow-hidden flex flex-col relative group">
                  <div className="px-md py-sm border-b border-outline-variant/10 flex items-center justify-between z-10 bg-surface-container/50">
                    <h3 className="font-label-caps text-label-caps text-on-surface-variant tracking-widest uppercase">System Events</h3>
                    <span className="material-symbols-outlined text-[16px] text-outline-variant">stream</span>
                  </div>
                  <div className="flex-1 p-sm flex flex-col gap-xs overflow-y-auto z-10">
                    <div className="p-sm rounded bg-surface/50 border-l-2 border-error flex gap-sm items-start hover:bg-surface-container transition-colors">
                      <span className="material-symbols-outlined text-error text-[18px] mt-[2px]">gpp_bad</span>
                      <div className="flex flex-col gap-[2px]">
                        <span className="font-body-sm text-on-surface leading-tight">Anomaly Detected: TRK-114B</span>
                        <span className="font-data-mono text-[10px] text-on-surface-variant">Landslide risk cross-reference</span>
                        <span className="font-data-mono text-[9px] text-error/70 mt-1">1 MIN AGO</span>
                      </div>
                    </div>

                    <div className="p-sm rounded bg-surface/50 border-l-2 border-tertiary flex gap-sm items-start hover:bg-surface-container transition-colors">
                      <span className="material-symbols-outlined text-tertiary text-[18px] mt-[2px]">warning</span>
                      <div className="flex flex-col gap-[2px]">
                        <span className="font-body-sm text-on-surface leading-tight">Traffic Delay: NH-27 Corridor</span>
                        <span className="font-data-mono text-[10px] text-on-surface-variant">ETA delay estimated +25 mins</span>
                        <span className="font-data-mono text-[9px] text-tertiary/70 mt-1">12 MINS AGO</span>
                      </div>
                    </div>

                    <div className="p-sm rounded bg-surface/50 border-l-2 border-primary flex gap-sm items-start hover:bg-surface-container transition-colors">
                      <span className="material-symbols-outlined text-primary text-[18px] mt-[2px]">check_circle</span>
                      <div className="flex flex-col gap-[2px]">
                        <span className="font-body-sm text-on-surface leading-tight">Delivery Confirmed: TRK-902A</span>
                        <span className="font-data-mono text-[10px] text-on-surface-variant">Shillong Depot Facility</span>
                        <span className="font-data-mono text-[9px] text-primary/70 mt-1">22 MINS AGO</span>
                      </div>
                    </div>

                    <div className="p-sm rounded bg-surface/50 border-l-2 border-outline-variant flex gap-sm items-start hover:bg-surface-container transition-colors opacity-70">
                      <span className="material-symbols-outlined text-outline-variant text-[18px] mt-[2px]">info</span>
                      <div className="flex flex-col gap-[2px]">
                        <span className="font-body-sm text-on-surface leading-tight">Model Retraining Complete</span>
                        <span className="font-data-mono text-[10px] text-on-surface-variant">v4.2.1 deployed to edge nodes</span>
                        <span className="font-data-mono text-[9px] text-outline-variant mt-1">1 HR AGO</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Simulation Bay Form */}
                <div className="bg-surface-container p-md rounded-xl border border-outline-variant/10 relative overflow-hidden group">
                  <h3 className="font-label-caps text-label-caps text-secondary tracking-widest uppercase mb-md relative z-10 flex items-center gap-xs">
                    <span className="material-symbols-outlined text-[16px]">science</span> Simulation Bay
                  </h3>
                  <form className="flex flex-col gap-sm relative z-10" onSubmit={(e) => e.preventDefault()}>
                    <div className="relative">
                      <span className="font-label-caps text-[10px] text-on-surface-variant absolute -top-2 left-2 bg-surface-container px-1">
                        ORIGIN
                      </span>
                      <input
                        className="w-full bg-surface/50 border border-outline-variant/30 text-on-surface font-body-sm rounded px-sm py-2 focus:outline-none focus:border-secondary transition-colors"
                        type="text"
                        value={origin}
                        onChange={(e) => setOrigin(e.target.value)}
                      />
                    </div>
                    <div className="relative mt-1">
                      <span className="font-label-caps text-[10px] text-on-surface-variant absolute -top-2 left-2 bg-surface-container px-1">
                        DESTINATION
                      </span>
                      <input
                        className="w-full bg-surface/50 border border-outline-variant/30 text-on-surface font-body-sm rounded px-sm py-2 focus:outline-none focus:border-secondary transition-colors"
                        placeholder="Enter node ID or location..."
                        type="text"
                        value={destination}
                        onChange={(e) => setDestination(e.target.value)}
                      />
                    </div>
                    <button
                      className="mt-sm w-full bg-surface border border-secondary/30 text-secondary hover:bg-secondary hover:text-on-secondary font-label-caps text-label-caps py-2 rounded transition-colors flex justify-center items-center gap-xs cursor-pointer"
                      type="button"
                      onClick={handleRunScenario}
                      disabled={isSimulating}
                    >
                      <span className="material-symbols-outlined text-[16px]">play_arrow</span>
                      {isSimulating ? 'COMPUTING...' : 'RUN SCENARIO'}
                    </button>
                  </form>

                  {simResult && (
                    <div className="mt-md p-sm bg-surface/60 rounded border border-primary/40 flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="font-label-caps text-[10px] text-primary">{simResult.status}</span>
                        <span className="font-data-mono text-[11px] text-on-surface-variant">{simResult.id}</span>
                      </div>
                      <RiskBadge level={simResult.level} score={simResult.score} />
                    </div>
                  )}
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

export default Dashboard;