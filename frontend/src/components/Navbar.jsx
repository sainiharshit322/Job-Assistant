import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Home, LayoutDashboard, Briefcase, Menu, X, ArrowRight } from 'lucide-react';
import { useLocation, Link, useNavigate } from 'react-router-dom';

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500;600&display=swap');
  .nb-root { font-family: 'DM Sans', sans-serif; }
  .nb-root .display { font-family: 'Bebas Neue', sans-serif; letter-spacing: .04em; }

  .nb-link {
    display: inline-flex; align-items: center; gap: 7px;
    padding: 8px 14px; border-radius: 10px; font-size: 14px;
    font-weight: 500; text-decoration: none; transition: background .15s, color .15s;
    color: #888899;
  }
  .nb-link:hover  { background: #ffffff0a; color: #f5f5f5; }
  .nb-link.active { background: #c6ff0015; color: #c6ff00; }

  .nb-mobile-link {
    display: flex; align-items: center; gap: 12px;
    padding: 14px 20px; font-size: 15px; font-weight: 500;
    text-decoration: none; color: #888899;
    border-bottom: 1px solid #ffffff08; transition: color .15s, background .15s;
  }
  .nb-mobile-link:hover  { background: #ffffff06; color: #f5f5f5; }
  .nb-mobile-link.active { color: #c6ff00; background: #c6ff0010; }

  .nb-icon-btn {
    width: 38px; height: 38px; border-radius: 10px; border: 1px solid #ffffff14;
    background: #ffffff08; display: flex; align-items: center; justify-content: center;
    cursor: pointer; transition: background .15s, border-color .15s;
  }
  .nb-icon-btn:hover { background: #ffffff12; border-color: #ffffff22; }

  .nb-drawer {
    position: fixed; inset: 0; z-index: 200;
  }
  .nb-drawer-backdrop {
    position: absolute; inset: 0; background: #0a0a0fcc; backdrop-filter: blur(6px);
  }
  .nb-drawer-panel {
    position: absolute; top: 0; right: 0; bottom: 0; width: 260px;
    background: #12121a; border-left: 1px solid #ffffff10;
    display: flex; flex-direction: column;
  }
`;

const NAV_ITEMS = [
  { label: 'Home',      href: '/',          icon: Home },
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Jobs',      href: '/jobs',       icon: Briefcase },
];

const Navbar = () => {
  const [scrolled,    setScrolled]    = useState(false);
  const [mobileOpen,  setMobileOpen]  = useState(false);
  const [apiStatus,   setApiStatus]   = useState('checking'); // 'online'|'offline'|'checking'
  const location = useLocation();
  const navigate = useNavigate();

  const isHome = location.pathname === '/';
  const hasSession = !!localStorage.getItem('sessionId');

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  // close drawer on route change
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  // Only ping the API when on the home page
  useEffect(() => {
    if (!isHome) return;
    const check = async () => {
      try {
        const res = await fetch('/api/health');
        setApiStatus(res.ok ? 'online' : 'offline');
      } catch {
        setApiStatus('offline');
      }
    };
    check();
  }, [isHome]);

  const STATUS_COLOR = { online: '#22c55e', offline: '#ef4444', checking: '#f59e0b' };
  const STATUS_LABEL = { online: 'AI Online', offline: 'Service Offline', checking: 'Connecting…' };

  const isActive = (href) =>
    href === '/' ? location.pathname === '/' : location.pathname.startsWith(href);

  return (
    <>
      <style>{css}</style>
      <motion.nav
        initial={{ y: -72 }}
        animate={{ y: 0 }}
        transition={{ duration: .45, ease: 'easeOut' }}
        className="nb-root"
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
          height: 64,
          borderBottom: scrolled ? '1px solid #ffffff10' : '1px solid transparent',
          background: scrolled ? '#0a0a0fea' : 'transparent',
          backdropFilter: scrolled ? 'blur(24px)' : 'none',
          transition: 'background .3s, border-color .3s, backdrop-filter .3s',
        }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 5%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

          {/* ── LOGO ── */}
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
            <motion.div
              whileHover={{ scale: 1.06 }} whileTap={{ scale: .94 }}
              style={{ width: 34, height: 34, borderRadius: 10, background: '#c6ff00', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <Brain size={18} style={{ color: '#0a0a0f' }} />
            </motion.div>
            <span className="display" style={{ fontSize: 22, color: '#f5f5f5', lineHeight: 1 }}>HIREAI</span>
          </Link>

          {/* ── DESKTOP NAV ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }} className="desktop-nav">
            {NAV_ITEMS.map(({ label, href, icon: Icon }) => (
              <Link key={href} to={href} className={`nb-link ${isActive(href) ? 'active' : ''}`}>
                <Icon size={15} />
                {label}
              </Link>
            ))}
          </div>

          {/* ── DESKTOP RIGHT SIDE ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }} className="desktop-nav">
            {/* API status badge — only on home */}
            {isHome && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '5px 12px', borderRadius: 999, background: '#ffffff08', border: '1px solid #ffffff12', fontSize: 12, color: '#888899' }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: STATUS_COLOR[apiStatus], display: 'inline-block', animation: apiStatus !== 'offline' ? 'ping 1.5s ease-in-out infinite' : 'none' }} />
                {STATUS_LABEL[apiStatus]}
              </div>
            )}
            {/* Find Jobs CTA — only on home when resume is done */}
            {isHome && hasSession && (
              <button
                onClick={() => navigate('/jobs')}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 18px', borderRadius: 10, background: '#c6ff00', color: '#0a0a0f', fontSize: 13, fontWeight: 600, fontFamily: 'DM Sans, sans-serif', border: 'none', cursor: 'pointer', transition: 'box-shadow .15s' }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = '0 0 20px #c6ff0060'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
              >
                Find Jobs <ArrowRight size={13} />
              </button>
            )}
          </div>

          {/* ── MOBILE MENU BUTTON ── */}
          <button className="nb-icon-btn nb-mobile-only" onClick={() => setMobileOpen(true)} aria-label="Open menu">
            <Menu size={18} style={{ color: '#f5f5f5' }} />
          </button>
        </div>

        <style>{`
          @keyframes ping {
            0%,100%{opacity:1;transform:scale(1)}
            50%{opacity:.4;transform:scale(1.6)}
          }
          @media (min-width: 768px) { .nb-mobile-only { display: none !important; } }
          @media (max-width: 767px) { .desktop-nav { display: none !important; } }
        `}</style>
      </motion.nav>

      {/* ── MOBILE DRAWER ── */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="nb-drawer">
            <motion.div
              className="nb-drawer-backdrop"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              className="nb-drawer-panel"
              initial={{ x: 260 }} animate={{ x: 0 }} exit={{ x: 260 }}
              transition={{ type: 'spring', damping: 28, stiffness: 260 }}
            >
              {/* drawer header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 20px 16px', borderBottom: '1px solid #ffffff0e' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: '#c6ff00', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Brain size={14} style={{ color: '#0a0a0f' }} />
                  </div>
                  <span className="display" style={{ fontSize: 18, color: '#f5f5f5' }}>HIREAI</span>
                </div>
                <button className="nb-icon-btn" onClick={() => setMobileOpen(false)}>
                  <X size={16} style={{ color: '#888899' }} />
                </button>
              </div>

              {/* drawer links */}
              <div style={{ flex: 1, paddingTop: 8 }}>
                {NAV_ITEMS.map(({ label, href, icon: Icon }) => (
                  <Link key={href} to={href} className={`nb-mobile-link ${isActive(href) ? 'active' : ''}`}>
                    <Icon size={18} />
                    {label}
                  </Link>
                ))}
              </div>

              <div style={{ padding: 20, borderTop: '1px solid #ffffff0e' }}>
                <p style={{ fontSize: 11, color: '#555566', textAlign: 'center', letterSpacing: '.06em', textTransform: 'uppercase' }}>
                  AI-Powered · 2026 Edition
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;