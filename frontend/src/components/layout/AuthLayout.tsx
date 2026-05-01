import { type ReactNode, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plane, MapPin, Sparkles } from 'lucide-react';
import { pageVariants } from '@/lib/animations';

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

// ─── Load premium fonts ───────────────────────────────────────────────────────
function usePremiumFont() {
  useEffect(() => {
    const id = 'auth-premium-font';
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href =
      'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400;1,600&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&display=swap';
    document.head.appendChild(link);
  }, []);
}

// ─── Main layout ──────────────────────────────────────────────────────────────
export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  usePremiumFont();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: '"DM Sans", sans-serif' }}>

      {/* ── LEFT — Form panel ─────────────────────────────────────────── */}
      <motion.div
        variants={pageVariants}
        initial="hidden"
        animate="visible"
        style={{
          width: '44%', minHeight: '100vh',
          background: '#FFFCF8',
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
          padding: '56px 68px',
          position: 'relative', zIndex: 2,
          boxShadow: '6px 0 80px rgba(0,0,0,0.08)',
        }}
      >
        {/* Saffron left edge accent */}
        <div style={{
          position: 'absolute', left: 0, top: '10%', bottom: '10%', width: 3,
          background: 'linear-gradient(180deg, transparent, #E8622A 30%, #FF9A6C 70%, transparent)',
          borderRadius: '0 2px 2px 0',
        }} />

        {/* Subtle corner mesh decoration */}
        <svg
          style={{ position: 'absolute', top: 0, right: 0, opacity: 0.07, pointerEvents: 'none' }}
          width="220" height="220" viewBox="0 0 220 220"
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <line key={i} x1={220} y1={i * 36} x2={i * 36} y2={220}
              stroke="#E8622A" strokeWidth="1" />
          ))}
          <circle cx="220" cy="0" r="60" fill="none" stroke="#E8622A" strokeWidth="1" />
          <circle cx="220" cy="0" r="110" fill="none" stroke="#E8622A" strokeWidth="0.6" />
        </svg>

        {/* Bottom subtle dot grid */}
        <svg
          style={{ position: 'absolute', bottom: 0, left: 0, opacity: 0.055, pointerEvents: 'none' }}
          width="180" height="180" viewBox="0 0 180 180"
        >
          {Array.from({ length: 6 }).map((_, row) =>
            Array.from({ length: 6 }).map((_, col) => (
              <circle key={`${row}-${col}`} cx={col * 30 + 15} cy={row * 30 + 15} r="2" fill="#E8622A" />
            ))
          )}
        </svg>

        <div style={{ maxWidth: 360, width: '100%', margin: '0 auto' }}>

          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          >
            <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 48, textDecoration: 'none' }}>
              <div style={{
                width: 40, height: 40, borderRadius: 11,
                background: 'linear-gradient(135deg, #FF8B5A, #E8622A)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 6px 22px rgba(232,98,42,0.38)',
              }}>
                <Plane size={17} color="white" />
              </div>
              <span style={{
                fontFamily: '"Cormorant Garamond", serif',
                fontSize: 24, letterSpacing: '0.01em',
              }}>
                <span style={{ fontWeight: 600, color: '#E8622A' }}>Travel</span>
                <span style={{ fontWeight: 400, color: '#1A1208' }}> Sarthi</span>
              </span>
            </Link>
          </motion.div>

          {/* Section tag */}
          <motion.div
            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}
          >
            <div style={{ width: 22, height: 1.5, background: '#E8622A', borderRadius: 2 }} />
            <span style={{
              fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase',
              color: '#C47040', fontWeight: 500,
            }}>
              Voyager Portal
            </span>
          </motion.div>

          {/* Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            style={{
              fontFamily: '"Cormorant Garamond", serif',
              fontSize: 50, fontWeight: 300, lineHeight: 1.08,
              color: '#1A1208', letterSpacing: '-0.025em',
              marginBottom: subtitle ? 10 : 32,
            }}
          >
            {title}
          </motion.h1>

          {subtitle && (
            <motion.p
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.22 }}
              style={{ fontSize: 13.5, color: '#9A7A60', marginBottom: 32, lineHeight: 1.55 }}
            >
              {subtitle}
            </motion.p>
          )}

          {/* Ornamental rule before form */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            marginBottom: 28,
          }}>
            <div style={{ flex: 1, height: 1, background: 'linear-gradient(to right, rgba(232,98,42,0.25), transparent)' }} />
            <Sparkles size={12} color="#E8622A" opacity={0.6} />
            <div style={{ flex: 1, height: 1, background: 'linear-gradient(to left, rgba(232,98,42,0.25), transparent)' }} />
          </div>

          {/* Form content from LoginPage / RegisterPage */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.28, ease: [0.16, 1, 0.3, 1] }}
          >
            {children}
          </motion.div>
        </div>

        {/* Bottom destinations ticker */}
        <div style={{
          position: 'absolute', bottom: 26, left: 68, right: 68,
          display: 'flex', alignItems: 'center', gap: 0, overflow: 'hidden',
        }}>
          <span style={{ fontSize: 9.5, color: '#C4A898', letterSpacing: '0.16em', textTransform: 'uppercase', marginRight: 14, flexShrink: 0 }}>Explore</span>
          {['Goa · ', 'Rajasthan · ', 'Kerala · ', 'Bali · ', 'Santorini · ', 'Maldives · ', 'Himachal · '].map((d) => (
            <span key={d} style={{ fontSize: 10, color: '#BFAA98', letterSpacing: '0.05em', flexShrink: 0 }}>{d}</span>
          ))}
        </div>
      </motion.div>

      {/* ── RIGHT — Immersive visual panel ───────────────────────────── */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>

        {/* Hero image */}
        <img
          src="https://images.unsplash.com/photo-1598091383021-15ddea10925d?w=1600&q=88"
          alt="Rajasthan palace"
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            objectFit: 'cover', objectPosition: 'center 40%',
          }}
        />

        {/* Gradient layers */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(255,252,248,0.12) 0%, transparent 25%)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(160deg, rgba(12,8,4,0.18) 0%, transparent 50%, rgba(12,8,4,0.65) 100%)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(10,6,2,0.82) 0%, transparent 55%)' }} />

        {/* Giant italic watermark */}
        <div style={{
          position: 'absolute', top: '12%', left: '50%',
          transform: 'translateX(-52%)',
          fontFamily: '"Cormorant Garamond", serif',
          fontSize: 160, fontWeight: 300, fontStyle: 'italic',
          color: 'rgba(255,255,255,0.055)',
          whiteSpace: 'nowrap', userSelect: 'none',
          letterSpacing: '-0.04em', lineHeight: 1,
          pointerEvents: 'none',
        }}>
          VOYAGE
        </div>

        {/* Top right badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          style={{
            position: 'absolute', top: 32, right: 32,
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'rgba(255,255,255,0.10)',
            backdropFilter: 'blur(18px)',
            border: '1px solid rgba(255,255,255,0.22)',
            borderRadius: 40, padding: '8px 18px',
          }}
        >
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#4ADE80', boxShadow: '0 0 10px #4ADE80' }} />
          <span style={{ fontSize: 11.5, color: 'white', fontWeight: 500, letterSpacing: '0.04em' }}>350+ Destinations Live</span>
        </motion.div>

        {/* Floating cards — right side */}
        <motion.div
          initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.45, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          style={{ position: 'absolute', top: '28%', right: 36 }}
        >
          {/* Itinerary card */}
          <div style={{
            background: 'rgba(255,255,255,0.10)',
            backdropFilter: 'blur(28px)',
            border: '1px solid rgba(255,255,255,0.20)',
            borderRadius: 20, padding: '22px 26px',
            marginBottom: 14, maxWidth: 248,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
              <MapPin size={12} color="#FFB84A" />
              <span style={{ fontSize: 10, color: 'rgba(255,230,180,0.80)', letterSpacing: '0.13em', textTransform: 'uppercase' }}>
                AI Crafted
              </span>
            </div>
            <p style={{
              fontFamily: '"Cormorant Garamond", serif',
              fontSize: 20, fontWeight: 500, color: 'white',
              margin: '0 0 12px', lineHeight: 1.3,
            }}>
              7-day Rajasthan Itinerary
            </p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {['Jaipur', 'Jodhpur', 'Udaipur'].map((c) => (
                <span key={c} style={{
                  fontSize: 10, padding: '4px 10px',
                  background: 'rgba(232,98,42,0.38)',
                  border: '1px solid rgba(232,98,42,0.45)',
                  borderRadius: 99, color: '#FFD4A8',
                  letterSpacing: '0.05em',
                }}>{c}</span>
              ))}
            </div>
          </div>

          {/* Savings card */}
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
            style={{
              background: 'linear-gradient(135deg, rgba(232,98,42,0.35), rgba(200,70,20,0.45))',
              backdropFilter: 'blur(24px)',
              border: '1px solid rgba(255,160,90,0.35)',
              borderRadius: 16, padding: '18px 22px',
              maxWidth: 200,
            }}
          >
            <p style={{ fontSize: 10, color: 'rgba(255,220,170,0.75)', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 6px' }}>
              Avg. Savings
            </p>
            <p style={{
              fontFamily: '"Cormorant Garamond", serif',
              fontSize: 38, color: 'white', fontWeight: 600,
              margin: '0 0 4px', letterSpacing: '-0.02em', lineHeight: 1,
            }}>₹12,400</p>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.60)', margin: 0 }}>
              per booking vs. others
            </p>
          </motion.div>
        </motion.div>

        {/* Bottom editorial copy */}
        <motion.div
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.38, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          style={{ position: 'absolute', bottom: 44, left: 44, right: 44 }}
        >
          <p style={{
            fontSize: 10.5, color: 'rgba(255,255,255,0.45)',
            letterSpacing: '0.18em', textTransform: 'uppercase',
            marginBottom: 14,
          }}>
            — The ultimate AI travel companion
          </p>
          <h2 style={{
            fontFamily: '"Cormorant Garamond", serif',
            fontSize: 46, fontWeight: 300, fontStyle: 'italic',
            color: 'white', lineHeight: 1.18,
            letterSpacing: '-0.02em', margin: 0,
            textShadow: '0 4px 32px rgba(0,0,0,0.5)',
          }}>
            Every journey deserves<br />
            a <em style={{ color: '#FFB84A', fontWeight: 600, fontStyle: 'normal' }}>perfect plan.</em>
          </h2>

          {/* Stat row */}
          <div style={{
            display: 'flex', gap: 32, marginTop: 24,
            paddingTop: 20,
            borderTop: '1px solid rgba(255,255,255,0.12)',
          }}>
            {[
              { val: '350+', label: 'Destinations' },
              { val: '2M+',  label: 'Trips Planned' },
              { val: '4.9★', label: 'User Rating' },
            ].map((s) => (
              <div key={s.label}>
                <p style={{
                  fontFamily: '"Cormorant Garamond", serif',
                  fontSize: 26, fontWeight: 600, color: 'white',
                  margin: '0 0 2px', letterSpacing: '-0.01em',
                }}>{s.val}</p>
                <p style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.50)', letterSpacing: '0.08em', margin: 0 }}>
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
