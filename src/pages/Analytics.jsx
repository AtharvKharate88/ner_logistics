import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Analytics.css';
import UserProfileModal from '../components/UserProfileModal';

const Analytics = () => {
  const navigate = useNavigate();

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

  const [activeTab, setActiveTab] = useState('analytics');
  const [timeframe, setTimeframe] = useState('30D');

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
            className={`w-full flex items-center px-md py-md rounded-lg text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface transition-all group ${
              activeTab === 'fleet-map' ? 'bg-primary-container text-on-primary-container font-bold shadow-[0_0_8px_rgba(16,185,129,0.3)]' : ''
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
            className={`w-full flex items-center px-md py-md rounded-lg transition-all group ${
              activeTab === 'analytics'
                ? 'bg-primary-container text-on-primary-container font-bold shadow-[0_0_8px_rgba(16,185,129,0.3)]'
                : 'text-on-surface-variant hover:bg-surface-container-highest'
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

        {/* Analytics Main View */}
        <main className="relative pt-16 min-h-screen w-full bg-background">
          <div className="flex flex-col w-full px-lg py-xl gap-xl">
            {/* Top KPI Cards */}
            <div className="flex flex-col md:flex-row gap-lg">
              <div className="flex-1 bg-surface-container rounded-xl p-lg relative group overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="flex items-center justify-between mb-md relative z-10">
                  <span className="font-label-caps text-on-surface-variant">ML ACCURACY</span>
                  <span className="material-symbols-outlined text-primary text-[20px]">target</span>
                </div>
                <div className="flex items-end gap-md relative z-10">
                  <span className="font-display-lg text-primary leading-none">98.4%</span>
                  <div className="flex items-center text-primary bg-primary/10 px-xs py-xs rounded text-body-sm font-label-caps mb-sm">
                    <span className="material-symbols-outlined text-[16px]">arrow_upward</span>
                    <span>0.2%</span>
                  </div>
                </div>
                <div className="mt-lg relative h-2 bg-surface-container-high rounded-full overflow-hidden">
                  <div className="absolute left-0 top-0 h-full bg-primary w-[98.4%] shadow-[0_0_12px_rgba(78,222,163,0.5)]"></div>
                </div>
              </div>

              <div className="flex-1 bg-surface-container rounded-xl p-lg relative group overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-secondary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="flex items-center justify-between mb-md relative z-10">
                  <span className="font-label-caps text-on-surface-variant">AVG REROUTE EFFICIENCY</span>
                  <span className="material-symbols-outlined text-secondary text-[20px]">route</span>
                </div>
                <div className="flex items-end gap-md relative z-10">
                  <span className="font-display-lg text-on-surface leading-none">+14.2%</span>
                  <div className="flex items-center text-primary bg-primary/10 px-xs py-xs rounded text-body-sm font-label-caps mb-sm">
                    <span className="material-symbols-outlined text-[16px]">arrow_upward</span>
                    <span>3.1%</span>
                  </div>
                </div>
                <svg className="w-full h-12 mt-md text-secondary" preserveAspectRatio="none" viewBox="0 0 100 30">
                  <path
                    d="M0,25 L10,22 L20,24 L30,18 L40,20 L50,15 L60,18 L70,10 L80,14 L90,5 L100,8"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    vectorEffect="non-scaling-stroke"
                  ></path>
                  <path
                    d="M0,25 L10,22 L20,24 L30,18 L40,20 L50,15 L60,18 L70,10 L80,14 L90,5 L100,8 L100,30 L0,30 Z"
                    fill="currentColor"
                    opacity="0.1"
                  ></path>
                </svg>
              </div>

              <div className="flex-1 bg-surface-container rounded-xl p-lg relative group overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-tertiary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="flex items-center justify-between mb-md relative z-10">
                  <span className="font-label-caps text-on-surface-variant">TOTAL SEGMENT ANALYSIS</span>
                  <span className="material-symbols-outlined text-tertiary text-[20px]">data_exploration</span>
                </div>
                <div className="flex items-end gap-md relative z-10">
                  <span className="font-display-lg text-on-surface leading-none">74.1K</span>
                  <span className="text-body-sm text-on-surface-variant mb-sm">segments</span>
                </div>
                <div className="mt-lg flex gap-xs">
                  <div className="flex-1 h-2 bg-tertiary rounded-full shadow-[0_0_8px_rgba(255,185,95,0.4)]"></div>
                  <div className="flex-1 h-2 bg-tertiary/60 rounded-full"></div>
                  <div className="flex-1 h-2 bg-tertiary/30 rounded-full"></div>
                  <div className="flex-1 h-2 bg-surface-container-highest rounded-full"></div>
                </div>
              </div>
            </div>

            {/* Charts & Deployment Logs Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg">
              <div className="lg:col-span-2 bg-surface-container rounded-xl p-lg flex flex-col relative">
                <div className="flex items-center justify-between mb-xl">
                  <div>
                    <h2 className="font-headline-md text-on-surface">Risk Trend Analysis</h2>
                    <p className="font-body-sm text-on-surface-variant mt-xs">Historical risk anomalies detected by Isolation Forest over 30 days.</p>
                  </div>
                  <div className="flex gap-sm">
                    {['7D', '30D', '90D'].map((tf) => (
                      <button
                        key={tf}
                        className={`px-md py-xs rounded font-label-caps transition-colors cursor-pointer ${
                          timeframe === tf
                            ? 'bg-primary-container text-on-primary-container shadow-[0_0_8px_rgba(16,185,129,0.3)]'
                            : 'bg-surface-container-high text-on-surface hover:bg-surface-container-highest'
                        }`}
                        onClick={() => setTimeframe(tf)}
                      >
                        {tf}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex-1 min-h-[300px] w-full relative">
                  <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
                    <div className="w-full border-b border-on-surface-variant"></div>
                    <div className="w-full border-b border-on-surface-variant"></div>
                    <div className="w-full border-b border-on-surface-variant"></div>
                    <div className="w-full border-b border-on-surface-variant"></div>
                    <div className="w-full border-b border-on-surface-variant"></div>
                  </div>
                  <svg className="w-full h-full text-error" preserveAspectRatio="none" viewBox="0 0 1000 300">
                    <defs>
                      <linearGradient id="risk-gradient" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="currentColor" stopOpacity="0.3"></stop>
                        <stop offset="100%" stopColor="currentColor" stopOpacity="0.0"></stop>
                      </linearGradient>
                    </defs>
                    <path
                      d="M0,250 C100,240 150,100 200,120 C250,140 300,260 350,250 C400,240 450,80 500,50 C550,20 600,180 650,200 C700,220 750,100 800,90 C850,80 900,210 1000,220"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      style={{ filter: 'drop-shadow(0 0 6px rgba(255,180,171,0.5))' }}
                      vectorEffect="non-scaling-stroke"
                    ></path>
                    <path
                      d="M0,250 C100,240 150,100 200,120 C250,140 300,260 350,250 C400,240 450,80 500,50 C550,20 600,180 650,200 C700,220 750,100 800,90 C850,80 900,210 1000,220 L1000,300 L0,300 Z"
                      fill="url(#risk-gradient)"
                    ></path>
                    <circle cx="500" cy="50" fill="currentColor" r="6" stroke="#1E293B" strokeWidth="2">
                      <animate attributeName="r" dur="2s" repeatCount="indefinite" values="6;10;6"></animate>
                    </circle>
                    <circle cx="800" cy="90" fill="currentColor" r="4" stroke="#1E293B" strokeWidth="2"></circle>
                  </svg>
                </div>
                <div className="flex justify-between mt-md font-label-caps text-on-surface-variant text-xs">
                  <span>NOV 01</span>
                  <span>NOV 08</span>
                  <span>NOV 15</span>
                  <span>NOV 22</span>
                  <span>NOV 30</span>
                </div>
              </div>

              {/* Model Deployment Log */}
              <div className="bg-surface-container rounded-xl p-lg flex flex-col">
                <h2 className="font-headline-md text-on-surface mb-xs">Model Deployment Log</h2>
                <p className="font-body-sm text-on-surface-variant mb-lg">Recent graph engine & isolation forest updates.</p>
                <div className="flex-1 space-y-md overflow-y-auto pr-sm" style={{ maxHeight: '350px' }}>
                  <div className="flex gap-md bg-surface-container-high p-md rounded-lg border border-primary/20 relative group">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-l-lg shadow-[0_0_8px_rgba(78,222,163,0.5)]"></div>
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-primary text-[18px]">model_training</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-sm mb-xs">
                        <span className="font-label-caps text-on-surface">ISO-FOREST-v4.2</span>
                        <span className="bg-primary-container text-on-primary-container text-[10px] px-xs py-px rounded font-bold">ACTIVE</span>
                      </div>
                      <div className="font-body-sm text-on-surface-variant line-clamp-2 mb-sm">Retrained on new sensor node data. Precision improved by 2.4%.</div>
                      <div className="font-data-mono text-on-surface-variant text-xs">DEPLOYED: 2H AGO</div>
                    </div>
                  </div>

                  <div className="flex gap-md bg-surface-container-highest p-md rounded-lg group">
                    <div className="w-8 h-8 rounded-full bg-surface-container-lowest flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-on-surface-variant text-[18px]">schema</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-sm mb-xs">
                        <span className="font-label-caps text-on-surface text-opacity-80">GRAPH-ENGINE-v2.9</span>
                        <span className="bg-surface-container-low text-on-surface-variant text-[10px] px-xs py-px rounded border border-outline-variant">STABLE</span>
                      </div>
                      <div className="font-body-sm text-on-surface-variant text-opacity-80 line-clamp-2 mb-sm">Updated heuristic weights for urban traffic modeling.</div>
                      <div className="font-data-mono text-on-surface-variant text-opacity-80 text-xs">DEPLOYED: 1D AGO</div>
                    </div>
                  </div>
                </div>
                <button className="mt-md w-full py-sm bg-surface-container-highest hover:bg-surface-bright text-on-surface font-label-caps rounded transition-colors flex items-center justify-center gap-sm cursor-pointer">
                  <span>VIEW FULL LOGS</span>
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </button>
              </div>
            </div>

            {/* Cargo Bar Chart */}
            <div className="bg-surface-container rounded-xl p-lg">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-xl gap-md">
                <div>
                  <h2 className="font-headline-md text-on-surface">Cargo Efficiency vs Risk Mitigation</h2>
                  <p className="font-body-sm text-on-surface-variant mt-xs">Travel time indexing across major cargo categories.</p>
                </div>
                <div className="flex items-center gap-lg">
                  <div className="flex items-center gap-sm">
                    <div className="w-3 h-3 rounded-sm bg-secondary"></div>
                    <span className="font-label-caps text-on-surface-variant text-xs">TRAVEL TIME (HRS)</span>
                  </div>
                  <div className="flex items-center gap-sm">
                    <div className="w-3 h-3 rounded-sm bg-tertiary"></div>
                    <span className="font-label-caps text-on-surface-variant text-xs">RISK MITIGATION SCORE</span>
                  </div>
                </div>
              </div>

              <div className="h-64 flex items-end gap-lg px-md">
                {[
                  { title: 'MEDICINE', timeHeight: '80%', riskHeight: '95%', timeVal: '24H', riskVal: '0.92' },
                  { title: 'ELECTRONICS', timeHeight: '60%', riskHeight: '70%', timeVal: '18H', riskVal: '0.78' },
                  { title: 'GENERAL', timeHeight: '40%', riskHeight: '45%', timeVal: '12H', riskVal: '0.45' },
                  { title: 'HAZMAT', timeHeight: '90%', riskHeight: '85%', timeVal: '32H', riskVal: '0.85' },
                ].map((bar) => (
                  <div key={bar.title} className="flex-1 flex flex-col justify-end items-center gap-sm group">
                    <div className="flex w-full justify-center gap-xs items-end h-48 relative">
                      <div
                        className="w-1/3 bg-secondary rounded-t-sm opacity-80 group-hover:opacity-100 transition-opacity flex items-start justify-center pt-sm"
                        style={{ height: bar.timeHeight }}
                      >
                        <span className="font-data-mono text-on-secondary text-xs opacity-0 group-hover:opacity-100 -rotate-90 origin-center whitespace-nowrap mt-4">
                          {bar.timeVal}
                        </span>
                      </div>
                      <div
                        className="w-1/3 bg-tertiary rounded-t-sm opacity-80 group-hover:opacity-100 transition-opacity flex items-start justify-center pt-sm"
                        style={{ height: bar.riskHeight }}
                      >
                        <span className="font-data-mono text-on-tertiary text-xs opacity-0 group-hover:opacity-100 -rotate-90 origin-center whitespace-nowrap mt-4">
                          {bar.riskVal}
                        </span>
                      </div>
                    </div>
                    <span className="font-label-caps text-on-surface text-center">{bar.title}</span>
                  </div>
                ))}
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

export default Analytics;