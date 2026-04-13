import { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Plane, Map, Tag, Bell, User, LogOut, ChevronDown, Sparkles } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { authService } from '@/services/auth.service';
import { clearTokens } from '@/services/api';
import { CDN_IMAGES } from '@/constants/cdnImages';

const NAV_LINKS = [
  { to: '/plan', label: 'Plan Trip', icon: <Plane size={15} /> },
  { to: '/discover', label: 'Discover', icon: <Map size={15} /> },
  { to: '/deals', label: 'Deals', icon: <Tag size={15} /> },
];

export function Navbar() {
  const { user, isAuthenticated, clearAuth } = useAuthStore();
  const { isNavDrawerOpen, toggleNavDrawer, closeNavDrawer } = useUIStore();
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  useEffect(() => {
    const handler = () => setIsScrolled(window.scrollY > 12);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const handleLogout = async () => {
    try {
      await authService.logout();
    } finally {
      clearAuth();
      clearTokens();
      navigate('/login');
    }
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-500 ${isScrolled ? 'glass' : 'bg-transparent'}`}
        style={isScrolled ? { borderBottom: '1px solid rgba(17,17,24,0.06)' } : {}}
      >
        <div className="page-container">
          <div className="flex items-center justify-between h-[68px]">

            {/* ── Logo ── */}
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-sm transition-all duration-300 group-hover:scale-105 group-hover:shadow-md"
                style={{ background: 'linear-gradient(135deg,#FF7A40,#E8622A)' }}>
                <Sparkles size={15} />
              </div>
              <span className="font-display font-bold text-[1.25rem] tracking-display">
                <span className="text-gradient-saffron">Travel</span>
                <span style={{ color: 'var(--text-primary)' }}> Sarthi</span>
              </span>
            </Link>

            {/* ── Desktop Nav ── */}
            <nav className="hidden md:flex items-center gap-0.5 rounded-full px-2 py-1.5"
              style={{ background: 'rgba(255,255,255,0.70)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.85)' }}>
              {NAV_LINKS.map(({ to, label, icon }) => (
                <NavLink key={to} to={to}
                  className={({ isActive }) => `flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${isActive ? 'text-white' : 'hover:bg-white/80'}`}
                  style={({ isActive }) => isActive
                    ? { background: 'linear-gradient(135deg,#FF7A40,#E8622A)', boxShadow: '0 2px 12px rgba(232,98,42,0.30)', color: '#fff' }
                    : { color: 'var(--text-secondary)' }}
                >
                  {icon}{label}
                </NavLink>
              ))}
            </nav>

            {/* ── Desktop Auth ── */}
            <div className="hidden md:flex items-center gap-2.5">
              {isAuthenticated && user != null ? (
                <div className="relative">
                  <button onClick={() => setProfileMenuOpen((p) => !p)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-full transition-all duration-200 hover:bg-white/70"
                    style={{ border: '1px solid rgba(17,17,24,0.08)' }}>
                    <div className="relative">
                      <img src={user.avatarUrl ?? CDN_IMAGES.avatarPlaceholder} alt={user.displayName} className="w-8 h-8 rounded-full object-cover ring-2 ring-white shadow-sm" />
                      <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-white" />
                    </div>
                    <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{user.displayName.split(' ')[0]}</span>
                    <ChevronDown size={13} style={{ color: 'var(--text-muted)' }} />
                  </button>
                  <AnimatePresence>
                    {profileMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.18, ease: [0.16,1,0.3,1] }}
                        className="absolute right-0 top-full mt-2 w-56 rounded-2xl overflow-hidden z-50"
                        style={{ background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(32px)', boxShadow: '0 20px 60px rgba(17,17,24,0.14)', border: '1px solid rgba(17,17,24,0.07)' }}
                        onMouseLeave={() => setProfileMenuOpen(false)}
                      >
                        <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(17,17,24,0.06)' }}>
                          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{user.displayName}</p>
                          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{user.email}</p>
                        </div>
                        <div className="py-1.5">
                          {[
                            { to: '/profile', icon: <User size={14} />, label: 'Profile' },
                            { to: '/my-trips', icon: <Plane size={14} />, label: 'My Trips' },
                            { to: '/fare-alerts', icon: <Bell size={14} />, label: 'Fare Alerts' },
                          ].map((item) => (
                            <Link key={item.to} to={item.to} onClick={() => setProfileMenuOpen(false)}
                              className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium transition-all hover:bg-black/[0.04]"
                              style={{ color: 'var(--text-secondary)' }}>
                              {item.icon}{item.label}
                            </Link>
                          ))}
                        </div>
                        <div className="pb-1.5" style={{ borderTop: '1px solid rgba(17,17,24,0.06)' }}>
                          <button onClick={handleLogout} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-red-500 transition-colors hover:bg-red-50">
                            <LogOut size={14} /> Sign Out
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link to="/login" className="btn-ghost px-5 py-2.5 text-sm">Sign In</Link>
                  <Link to="/register" className="btn-primary px-5 py-2.5 text-sm">Get Started</Link>
                </div>
              )}
            </div>

            {/* ── Mobile Hamburger ── */}
            <button className="md:hidden p-2.5 rounded-xl transition-colors hover:bg-white/60" onClick={toggleNavDrawer} aria-label="Toggle menu">
              {isNavDrawerOpen ? <X size={20} style={{ color: 'var(--text-primary)' }} /> : <Menu size={20} style={{ color: 'var(--text-primary)' }} />}
            </button>
          </div>
        </div>
      </header>

      {/* ── Mobile Drawer ── */}
      <AnimatePresence>
        {isNavDrawerOpen && (
          <>
            <motion.div className="fixed inset-0 z-30 md:hidden"
              style={{ background: 'rgba(10,10,15,0.50)', backdropFilter: 'blur(6px)' }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={closeNavDrawer}
            />
            <motion.div className="fixed top-[76px] left-3 right-3 rounded-2xl z-30 md:hidden overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(32px)', boxShadow: '0 24px 60px rgba(17,17,24,0.16)', border: '1px solid rgba(17,17,24,0.07)' }}
              initial={{ opacity: 0, y: -12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.97 }}
              transition={{ duration: 0.22, ease: [0.16,1,0.3,1] }}
            >
              <div className="p-3 flex flex-col gap-1">
                {NAV_LINKS.map(({ to, label, icon }) => (
                  <NavLink key={to} to={to} onClick={closeNavDrawer}
                    className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${isActive ? 'text-white' : 'hover:bg-black/[0.04]'}`}
                    style={({ isActive }) => isActive ? { background: 'linear-gradient(135deg,#FF7A40,#E8622A)', color: '#fff' } : { color: 'var(--text-secondary)' }}
                  >
                    {icon}{label}
                  </NavLink>
                ))}
                <div className="my-1 h-px" style={{ background: 'rgba(17,17,24,0.06)' }} />
                {isAuthenticated ? (
                  <>
                    <Link to="/profile" onClick={closeNavDrawer} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold hover:bg-black/[0.04] transition-colors" style={{ color: 'var(--text-secondary)' }}><User size={15} /> Profile</Link>
                    <button onClick={() => { closeNavDrawer(); void handleLogout(); }} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors"><LogOut size={15} /> Sign Out</button>
                  </>
                ) : (
                  <div className="flex gap-2 py-1">
                    <Link to="/login" onClick={closeNavDrawer} className="btn-ghost flex-1 py-2.5 text-sm text-center">Sign In</Link>
                    <Link to="/register" onClick={closeNavDrawer} className="btn-primary flex-1 py-2.5 text-sm text-center">Get Started</Link>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
