import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('signin');
  const [showPassword, setShowPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRecoverModal, setShowRecoverModal] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoverySent, setRecoverySent] = useState(false);

  // Form State
  const [signInData, setSignInData] = useState({ email: '', password: '' });
  const [signUpData, setSignUpData] = useState({
    fullName: '',
    fleetId: '',
    email: '',
    password: '',
    role: 'operator',
  });

  const handleSignIn = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      navigate('/dashboard');
    }, 1200);
  };

  const handleSignUp = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      navigate('/dashboard');
    }, 1200);
  };

  const handleRecoverAccess = (e) => {
    e.preventDefault();
    if (!recoveryEmail) return;
    setRecoverySent(true);
    setTimeout(() => {
      setRecoverySent(false);
      setShowRecoverModal(false);
      setRecoveryEmail('');
    }, 2000);
  };

  return (
    <div className="bg-surface font-body-md text-on-surface min-h-screen relative">
      {/* Top Header */}
      <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-sm border-b border-outline-variant/10">
        <div className="h-20 max-w-7xl mx-auto px-lg flex items-center justify-between">
          <div className="flex items-center gap-sm cursor-pointer" onClick={() => navigate('/')}>
            <img
              alt="NER Logistics logo"
              className="h-10 w-auto object-contain"
              src="https://lh3.googleusercontent.com/aida/AEtjO1VmLsx7BRnTAm4NpIDQtjsZ1kvY3ZuYyLjMv6Fn-gQcvQ9LKOA4sFsIw-8ZBob9EDDr1hsfkt5QvOHt9cGfANm00w3nbPK-64vwiAtktPIim0V9T0mNBvxQk-VE9Q4gphcrsF9AwBHkcoF5Ek-Ebsun4SvRGiHcZWvJ2OMZVDQNA12PeSv3dLy_F-kAJh2bEl0yG0wmZK-fQf4zCOsTsU_b7_TxXFnaZAkDAaY7qhBHuIbXdVgTM8Bn0g"
            />
            <span className="font-headline-md text-headline-md tracking-tight text-on-surface uppercase">
              NER Logistics
            </span>
          </div>

          <button
            className="px-md py-xs bg-surface-container border border-outline-variant text-on-surface-variant hover:text-primary rounded font-label-caps text-xs cursor-pointer"
            onClick={() => navigate('/')}
          >
            ← BACK TO HOME
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="w-full pt-20 min-h-screen flex items-center justify-center">
        <div className="flex flex-col w-full lg:flex-row h-full min-h-[calc(100vh-5rem)]">
          {/* Left Form Column */}
          <div className="w-full lg:w-1/2 flex items-center justify-center p-xl bg-surface relative z-10">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute -top-32 -left-32 w-96 h-96 bg-primary/5 rounded-full blur-[100px]"></div>
              <div className="absolute bottom-0 right-0 w-full h-1/2 bg-gradient-to-t from-surface-container/20 to-transparent"></div>
            </div>

            <div className="w-full max-w-md relative">
              <div className="relative bg-surface-container-low backdrop-blur-xl rounded-2xl p-xl shadow-2xl ring-1 ring-white/5">
                {/* Tab Switcher */}
                <div className="mb-lg flex gap-lg relative">
                  <button
                    className={`pb-xs font-headline-md text-headline-md transition-colors duration-300 relative cursor-pointer ${
                      activeTab === 'signin' ? 'text-on-surface' : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                    onClick={() => setActiveTab('signin')}
                  >
                    Sign In
                    <div
                      className={`absolute bottom-0 left-0 w-full h-0.5 bg-primary transition-transform duration-300 transform origin-left ${
                        activeTab === 'signin' ? 'scale-x-100' : 'scale-x-0'
                      }`}
                    ></div>
                  </button>

                  <button
                    className={`pb-xs font-headline-md text-headline-md transition-colors duration-300 relative cursor-pointer ${
                      activeTab === 'signup' ? 'text-on-surface' : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                    onClick={() => setActiveTab('signup')}
                  >
                    Create Account
                    <div
                      className={`absolute bottom-0 left-0 w-full h-0.5 bg-primary transition-transform duration-300 transform origin-left ${
                        activeTab === 'signup' ? 'scale-x-100' : 'scale-x-0'
                      }`}
                    ></div>
                  </button>
                </div>

                {/* SIGN IN FORM */}
                {activeTab === 'signin' && (
                  <form className="space-y-lg" onSubmit={handleSignIn}>
                    <div className="space-y-sm group">
                      <label className="block font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider group-focus-within:text-primary transition-colors">
                        Work Email
                      </label>
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors text-[20px]">
                          mail
                        </span>
                        <input
                          className="w-full bg-surface border border-outline-variant rounded-lg py-md pl-12 pr-md text-on-surface font-body-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all shadow-inner placeholder:text-on-surface-variant/50"
                          placeholder="operator@ner-logistics.com"
                          required
                          type="email"
                          value={signInData.email}
                          onChange={(e) => setSignInData({ ...signInData, email: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="space-y-sm group">
                      <label className="block font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider group-focus-within:text-primary transition-colors">
                        Access Key
                      </label>
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors text-[20px]">
                          lock
                        </span>
                        <input
                          className={`w-full bg-surface border border-outline-variant rounded-lg py-md pl-12 pr-12 text-on-surface focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all shadow-inner ${
                            showPassword ? 'font-body-md' : 'font-data-mono tracking-widest'
                          }`}
                          placeholder="••••••••"
                          required
                          type={showPassword ? 'text' : 'password'}
                          value={signInData.password}
                          onChange={(e) => setSignInData({ ...signInData, password: e.target.value })}
                        />
                        <button
                          className="absolute right-md top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors focus:outline-none cursor-pointer"
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          <span className="material-symbols-outlined text-[20px]">
                            {showPassword ? 'visibility_off' : 'visibility'}
                          </span>
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-xs">
                      <label className="flex items-center gap-xs cursor-pointer group">
                        <input
                          className="w-4 h-4 rounded border-outline-variant bg-surface text-primary focus:ring-primary cursor-pointer"
                          type="checkbox"
                        />
                        <span className="font-body-sm text-body-sm text-on-surface-variant group-hover:text-on-surface transition-colors">
                          Remember device
                        </span>
                      </label>

                      <button
                        className="font-label-caps text-label-caps text-primary hover:text-primary-fixed transition-colors bg-transparent border-none cursor-pointer"
                        type="button"
                        onClick={() => setShowRecoverModal(true)}
                      >
                        RECOVER ACCESS
                      </button>
                    </div>

                    <button
                      className="w-full bg-primary text-on-primary font-headline-md text-headline-md py-md rounded-lg shadow-[0_0_15px_rgba(78,222,163,0.3)] hover:shadow-[0_0_25px_rgba(78,222,163,0.5)] transition-all duration-300 relative overflow-hidden group cursor-pointer disabled:opacity-50"
                      disabled={isSubmitting}
                      type="submit"
                    >
                      <span className="relative z-10 flex items-center justify-center gap-xs">
                        {isSubmitting ? 'INITIALIZING SESSION...' : 'INITIALIZE SESSION'}
                        <span className="material-symbols-outlined text-[20px] group-hover:translate-x-1 transition-transform">
                          arrow_forward
                        </span>
                      </span>
                    </button>
                  </form>
                )}

                {/* CREATE ACCOUNT FORM */}
                {activeTab === 'signup' && (
                  <form className="space-y-md" onSubmit={handleSignUp}>
                    <div className="space-y-sm group">
                      <label className="block font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider group-focus-within:text-primary transition-colors">
                        Full Name
                      </label>
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors text-[20px]">
                          person
                        </span>
                        <input
                          className="w-full bg-surface border border-outline-variant rounded-lg py-md pl-12 pr-md text-on-surface font-body-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all shadow-inner placeholder:text-on-surface-variant/50"
                          placeholder="Jane Doe"
                          required
                          type="text"
                          value={signUpData.fullName}
                          onChange={(e) => setSignUpData({ ...signUpData, fullName: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="space-y-sm group">
                      <label className="block font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider group-focus-within:text-primary transition-colors">
                        Fleet / Org ID
                      </label>
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors text-[20px]">
                          tag
                        </span>
                        <input
                          className="w-full bg-surface border border-outline-variant rounded-lg py-md pl-12 pr-md text-on-surface font-data-mono uppercase focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all shadow-inner placeholder:text-on-surface-variant/50 placeholder:normal-case"
                          placeholder="NER-FLT-XXXX"
                          required
                          type="text"
                          value={signUpData.fleetId}
                          onChange={(e) => setSignUpData({ ...signUpData, fleetId: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="space-y-sm group">
                      <label className="block font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider group-focus-within:text-primary transition-colors">
                        Work Email
                      </label>
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors text-[20px]">
                          mail
                        </span>
                        <input
                          className="w-full bg-surface border border-outline-variant rounded-lg py-md pl-12 pr-md text-on-surface font-body-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all shadow-inner placeholder:text-on-surface-variant/50"
                          placeholder="jane.doe@ner-logistics.com"
                          required
                          type="email"
                          value={signUpData.email}
                          onChange={(e) => setSignUpData({ ...signUpData, email: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="space-y-sm group">
                      <label className="block font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider group-focus-within:text-primary transition-colors">
                        Set Access Key
                      </label>
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors text-[20px]">
                          lock
                        </span>
                        <input
                          className={`w-full bg-surface border border-outline-variant rounded-lg py-md pl-12 pr-12 text-on-surface focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all shadow-inner ${
                            showSignupPassword ? 'font-body-md' : 'font-data-mono tracking-widest'
                          }`}
                          placeholder="••••••••"
                          required
                          type={showSignupPassword ? 'text' : 'password'}
                          value={signUpData.password}
                          onChange={(e) => setSignUpData({ ...signUpData, password: e.target.value })}
                        />
                        <button
                          className="absolute right-md top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors focus:outline-none cursor-pointer"
                          type="button"
                          onClick={() => setShowSignupPassword(!showSignupPassword)}
                        >
                          <span className="material-symbols-outlined text-[20px]">
                            {showSignupPassword ? 'visibility_off' : 'visibility'}
                          </span>
                        </button>
                      </div>
                    </div>

                    <div className="space-y-sm group">
                      <label className="block font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider group-focus-within:text-primary transition-colors">
                        Role Designation
                      </label>
                      <div className="relative">
                        <select
                          className="w-full bg-surface border border-outline-variant rounded-lg py-md pl-md pr-12 text-on-surface font-body-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all shadow-inner appearance-none cursor-pointer"
                          value={signUpData.role}
                          onChange={(e) => setSignUpData({ ...signUpData, role: e.target.value })}
                        >
                          <option value="operator">Fleet Operator</option>
                          <option value="dispatcher">Dispatcher</option>
                          <option value="admin">System Administrator</option>
                        </select>
                        <span className="material-symbols-outlined absolute right-md top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-[20px]">
                          expand_more
                        </span>
                      </div>
                    </div>

                    <button
                      className="w-full bg-primary text-on-primary font-headline-md text-headline-md py-md rounded-lg shadow-[0_0_15px_rgba(78,222,163,0.3)] hover:shadow-[0_0_25px_rgba(78,222,163,0.5)] transition-all duration-300 mt-md relative overflow-hidden group cursor-pointer disabled:opacity-50"
                      disabled={isSubmitting}
                      type="submit"
                    >
                      <span className="relative z-10 flex items-center justify-center gap-xs">
                        {isSubmitting ? 'PROVISIONING...' : 'PROVISION CREDENTIALS'}
                        <span className="material-symbols-outlined text-[20px] group-hover:translate-x-1 transition-transform">
                          how_to_reg
                        </span>
                      </span>
                    </button>
                  </form>
                )}
              </div>

              <div className="mt-lg text-center font-data-mono text-label-caps text-on-surface-variant/50">
                SYS.REQ.092 // SECURE CONNECTION ESTABLISHED
              </div>
            </div>
          </div>

          {/* Right Visual Map Side */}
          <div className="hidden lg:flex w-1/2 relative bg-surface-dim overflow-hidden shadow-[-20px_0_40px_rgba(0,0,0,0.5)] z-20">
            <div
              className="absolute inset-0 z-0 bg-cover bg-center"
              style={{
                backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuAuNXCltp6g1gtVhliU47BHjUnfOnfc7U4ZGgNTJfrexLhNVNhUDPdZRv0C-3vsGKBSzQep43JVYTYV69Z7g_SZa3zS1dSUSoOdd-2ldrMN0MlYr1NQpal3ps8KM_WrSd3fNhN5AonWVowRS-DON-mrv2GoOMAGjy5oQ2EpRRvNeyHNSyB545kKbYnlPCErPr6zKSMaiMKySCNhVhokMC2impjOa1_aZUUtegAQ9Ros5Xcvm8uNOitz')`,
              }}
            ></div>
            <div className="absolute inset-0 z-10 bg-surface/70 mix-blend-multiply"></div>
            <div className="absolute inset-0 z-10 bg-gradient-to-r from-surface via-transparent to-transparent"></div>
            <div className="absolute inset-0 z-10 bg-gradient-to-t from-surface via-transparent to-surface/50"></div>

            {/* SVG Interactive Animated Node Overlay */}
            <div className="absolute inset-0 z-20 pointer-events-none opacity-60">
              <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                <path className="text-primary/30" d="M 20 80 Q 40 50 60 40 T 85 20" fill="none" stroke="currentColor" strokeWidth="0.2" />
                <path className="text-primary route-line" d="M 20 80 Q 40 50 60 40 T 85 20" fill="none" stroke="currentColor" strokeWidth="0.5" />
                <circle className="text-primary" cx="20" cy="80" fill="currentColor" r="1" />
                <circle className="text-primary node-pulse origin-[20px_80px]" cx="20" cy="80" fill="currentColor" r="1" />
                <circle className="text-on-surface" cx="60" cy="40" fill="currentColor" r="0.5" />
                <circle className="text-primary" cx="85" cy="20" fill="currentColor" r="1" />
                <circle className="text-primary node-pulse origin-[85px_20px]" cx="85" cy="20" fill="currentColor" r="1" />
                <g className="font-data-mono text-[1.5px] fill-current text-primary/70">
                  <text x="22" y="79">GHY-ALPHA</text>
                  <text x="87" y="19">JRH-OMEGA</text>
                </g>
              </svg>
            </div>

            <div className="absolute bottom-xl left-xl z-30 space-y-sm">
              <div className="flex items-center gap-sm">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                </span>
                <h2 className="font-display-lg text-display-lg text-on-surface uppercase tracking-tight">
                  Intelligence Secured.
                </h2>
              </div>
              <p className="font-data-mono text-body-lg text-primary tracking-widest uppercase pl-md border-l-2 border-primary">
                Systems Operational.
              </p>
            </div>

            <div className="absolute top-xl right-xl z-30 font-data-mono text-label-caps text-on-surface-variant/60 text-right [writing-mode:vertical-rl] rotate-180 tracking-[0.2em]">
              NER_GRID_ACT_v4.2.1 // LAT:26.14 LON:91.73
            </div>
          </div>
        </div>
      </main>

      {/* RECOVER ACCESS (FORGOT PASSWORD) MODAL */}
      {showRecoverModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-md">
          <div className="bg-surface-container-low border border-outline-variant/30 rounded-2xl p-xl max-w-md w-full relative">
            <h3 className="font-headline-md text-headline-md text-on-surface mb-xs">Recover Access</h3>
            <p className="font-body-sm text-on-surface-variant mb-lg">
              Enter your registered work email to receive a password reset key.
            </p>

            {recoverySent ? (
              <div className="p-md bg-primary/10 border border-primary/40 rounded-lg text-primary font-body-sm text-center">
                ✓ Password reset instructions dispatched!
              </div>
            ) : (
              <form onSubmit={handleRecoverAccess} className="space-y-md">
                <div className="space-y-sm">
                  <label className="block font-label-caps text-xs text-on-surface-variant uppercase">Work Email</label>
                  <input
                    className="w-full bg-surface border border-outline-variant rounded-lg p-md text-on-surface font-body-md focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="operator@ner-logistics.com"
                    required
                    type="email"
                    value={recoveryEmail}
                    onChange={(e) => setRecoveryEmail(e.target.value)}
                  />
                </div>
                <div className="flex gap-md pt-sm">
                  <button
                    className="flex-1 py-md bg-surface-container border border-outline-variant text-on-surface hover:bg-surface-container-high rounded font-label-caps text-xs cursor-pointer"
                    type="button"
                    onClick={() => setShowRecoverModal(false)}
                  >
                    CANCEL
                  </button>
                  <button
                    className="flex-1 py-md bg-primary text-on-primary rounded font-label-caps text-xs font-bold shadow-[0_0_12px_rgba(78,222,163,0.4)] cursor-pointer"
                    type="submit"
                  >
                    SEND KEY
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;