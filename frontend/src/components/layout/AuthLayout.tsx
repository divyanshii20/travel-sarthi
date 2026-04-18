import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plane, Bed, UtensilsCrossed, Train, Sparkles } from 'lucide-react';
import { pageVariants } from '@/lib/animations';

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex">
      {/* Left panel: form */}
      <motion.div
        className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-12 bg-page"
        variants={pageVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="max-w-sm w-full mx-auto">
          <Link to="/" className="flex items-center gap-1.5 font-display font-bold text-xl mb-8">
            <span className="text-gradient-saffron">Travel</span>
            <span className="text-primary">Sarthi</span>
          </Link>
          <h1 className="text-3xl font-display font-bold text-primary mb-1">{title}</h1>
          {subtitle != null && <p className="text-sm text-secondary mb-6">{subtitle}</p>}
          {children}
        </div>
      </motion.div>

      {/* Right panel */}
      <AuthVisualPanel />
    </div>
  );
}

// ─── Animated Globe Visual Panel ─────────────────────────────────────────────

function AuthVisualPanel() {
  const ICON_NODES = [
    { icon: <Plane size={20} />,           top: 80,  left: 80,  delay: 0 },
    { icon: <Bed size={20} />,             top: 80,  right: 80, delay: 0.8 },
    { icon: <UtensilsCrossed size={20} />, bottom: 180, left: 80,  delay: 1.6 },
    { icon: <Train size={20} />,           bottom: 180, right: 80, delay: 2.4 },
  ];

  // Star positions seeded
  const stars = Array.from({ length: 28 }, (_, i) => ({
    top:  ((i * 53 + 7)  % 100),
    left: ((i * 79 + 13) % 100),
    size: i % 5 === 0 ? 3 : 2,
    delay: (i * 0.19) % 5,
    dur:   2.5 + (i % 4) * 0.7,
  }));

  return (
    <div
      className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col"
      style={{
        background: 'linear-gradient(160deg, #FFCBA4 0%, #FF9A6C 40%, #E8622A 100%)',
      }}
    >
      {/* Ambient glow behind globe */}
      <div style={{
        position: 'absolute', top: '35%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 500, height: 500, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,255,255,0.22) 0%, transparent 70%)',
        filter: 'blur(50px)', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '10%', left: '20%',
        width: 200, height: 200, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,255,255,0.18) 0%, transparent 70%)',
        filter: 'blur(40px)', pointerEvents: 'none',
      }} />

      {/* Stars */}
      {stars.map((s, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0.2 }}
          animate={{ opacity: [0.2, 0.9, 0.2], scale: [1, 1.5, 1] }}
          transition={{ duration: s.dur, repeat: Infinity, ease: 'easeInOut', delay: s.delay }}
          style={{
            position: 'absolute',
            top: `${s.top}%`, left: `${s.left}%`,
            width: s.size, height: s.size,
            borderRadius: '50%',
            background: 'white',
            pointerEvents: 'none',
          }}
        />
      ))}

      {/* Brand – top centre */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.15 }}
        style={{
          position: 'absolute', top: 32, left: '50%',
          transform: 'translateX(-50%)', zIndex: 10,
          display: 'flex', alignItems: 'center', gap: 10,
        }}
      >
        <span style={{
          width: 34, height: 34, borderRadius: 10,
          background: 'rgba(255,255,255,0.12)',
          border: '1px solid rgba(255,255,255,0.28)',
          backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Plane size={15} color="white" />
        </span>
        <span style={{ fontFamily: 'serif', fontWeight: 700, fontSize: 20, color: 'white', letterSpacing: '-0.01em' }}>
          Travel Sarthi
        </span>
      </motion.div>

      {/* ── Globe scene – vertically centred, shifted up to leave room for text ── */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        paddingBottom: 160,
      }}>
        <div style={{ position: 'relative', width: 380, height: 380 }}>

          {/* 4 floating service icon nodes */}
          {ICON_NODES.map((n, i) => (
            <motion.div
              key={i}
              animate={{ y: [0, -9, 0] }}
              transition={{ duration: 4 + i * 0.4, repeat: Infinity, ease: 'easeInOut', delay: n.delay }}
              style={{
                position: 'absolute',
                top: n.top as any, left: n.left as any,
                right: (n as any).right as any, bottom: (n as any).bottom as any,
                width: 52, height: 52, borderRadius: '50%',
                background: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 8px 28px rgba(0,0,0,0.30)',
                color: '#E8622A', zIndex: 6,
              }}
            >
              {n.icon}
            </motion.div>
          ))}

          {/* Main SVG – globe + grid + flights */}
          <motion.svg
            viewBox="0 0 380 380"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible' }}
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          >
            <defs>
              {/* Globe radial gradient */}
              <radialGradient id="gGrad" cx="35%" cy="28%" r="68%">
                <stop offset="0%"   stopColor="#7BA8FF" />
                <stop offset="45%"  stopColor="#2255D8" />
                <stop offset="100%" stopColor="#0B2A99" />
              </radialGradient>
              {/* Shine overlay */}
              <radialGradient id="gShine" cx="30%" cy="25%" r="55%">
                <stop offset="0%"   stopColor="white" stopOpacity="0.28" />
                <stop offset="100%" stopColor="white" stopOpacity="0" />
              </radialGradient>
              {/* Clip globe */}
              <clipPath id="gClip">
                <circle cx="190" cy="190" r="125" />
              </clipPath>
              {/* Flight arc paths */}
              <path id="fa1" d="M 60,155 Q 190,30  320,155" />
              <path id="fa2" d="M 75,240 Q 190,360 305,240" />
            </defs>

            {/* Globe fill */}
            <circle cx="190" cy="190" r="125" fill="url(#gGrad)" />

            {/* Latitude lines */}
            <g clipPath="url(#gClip)" fill="none" stroke="white" strokeWidth="0.9">
              <ellipse cx="190" cy="190" rx="125" ry="40"  opacity="0.28" />
              <ellipse cx="190" cy="160" rx="108" ry="35"  opacity="0.20" />
              <ellipse cx="190" cy="130" rx="63"  ry="21"  opacity="0.16" />
              <ellipse cx="190" cy="220" rx="108" ry="35"  opacity="0.20" />
              <ellipse cx="190" cy="250" rx="63"  ry="21"  opacity="0.16" />
            </g>

            {/* Longitude lines */}
            <g clipPath="url(#gClip)" fill="none" stroke="white" strokeWidth="0.9">
              <ellipse cx="190" cy="190" rx="39"  ry="125" opacity="0.22" />
              <ellipse cx="190" cy="190" rx="28"  ry="125" opacity="0.16" transform="rotate(50 190 190)" />
              <ellipse cx="190" cy="190" rx="28"  ry="125" opacity="0.16" transform="rotate(-50 190 190)" />
              <line x1="65" y1="190" x2="315" y2="190"     opacity="0.18" />
            </g>

            {/* Globe shine */}
            <circle cx="190" cy="190" r="125" fill="url(#gShine)" />

            {/* Outer soft ring */}
            <circle cx="190" cy="190" r="148"
              fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="1.5"
              strokeDasharray="3 8" />

            {/* City dots on globe */}
            {[
              { cx: 228, cy: 178 }, // Delhi-ish
              { cx: 260, cy: 208 }, // SE Asia
              { cx: 155, cy: 172 }, // Europe
              { cx: 142, cy: 205 }, // Middle East
            ].map((p, i) => (
              <g key={i}>
                <motion.circle
                  cx={p.cx} cy={p.cy} r={7}
                  fill="none" stroke="rgba(255,190,100,0.65)" strokeWidth="1"
                  animate={{ r: [7, 13, 7], opacity: [0.65, 0, 0.65] }}
                  transition={{ duration: 2.8, repeat: Infinity, ease: 'easeOut', delay: i * 0.55 }}
                />
                <circle cx={p.cx} cy={p.cy} r={4} fill="#FFB84A" />
              </g>
            ))}

            {/* ── Flight arc 1 (above globe) ── */}
            <path d="M 60,155 Q 190,30 320,155"
              fill="none" stroke="rgba(255,200,100,0.45)"
              strokeWidth="1.5" strokeDasharray="5 8" />

            {/* Arc 1 endpoint dots */}
            <circle cx="60"  cy="155" r="5" fill="#FFB84A" />
            <circle cx="60"  cy="155" r="10" fill="none" stroke="rgba(255,184,74,0.45)" strokeWidth="1.5" />
            <circle cx="320" cy="155" r="5" fill="#FFB84A" />
            <circle cx="320" cy="155" r="10" fill="none" stroke="rgba(255,184,74,0.45)" strokeWidth="1.5" />

            {/* Plane 1 along arc 1 */}
            <g>
              <animateMotion dur="8s" repeatCount="indefinite" rotate="auto">
                <mpath href="#fa1" />
              </animateMotion>
              <circle r="10" fill="white" fillOpacity="0.95" />
              <path d="M -5.5,0 L 6,-2.5 L 5,0 L 6,2.5 Z M 0,-2.5 L 0,2.5"
                fill="#E8622A" stroke="#E8622A" strokeWidth="0.5" />
            </g>

            {/* ── Flight arc 2 (below globe) ── */}
            <path d="M 75,240 Q 190,360 305,240"
              fill="none" stroke="rgba(180,210,255,0.40)"
              strokeWidth="1.2" strokeDasharray="5 8" />

            <circle cx="75"  cy="240" r="4.5" fill="rgba(180,210,255,0.8)" />
            <circle cx="305" cy="240" r="4.5" fill="rgba(180,210,255,0.8)" />

            {/* Plane 2 along arc 2 (reverse direction) */}
            <g>
              <animateMotion dur="11s" repeatCount="indefinite" rotate="auto"
                keyPoints="1;0" keyTimes="0;1" calcMode="linear">
                <mpath href="#fa2" />
              </animateMotion>
              <circle r="8" fill="white" fillOpacity="0.90" />
              <path d="M -4.5,0 L 5,-2 L 4,0 L 5,2 Z"
                fill="#4A80FF" />
            </g>
          </motion.svg>
        </div>
      </div>

      {/* ── Tagline – pinned at bottom ── */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.35 }}
        style={{
          position: 'absolute', bottom: 40, left: 0, right: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
          padding: '0 40px',
        }}
      >
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '5px 14px', borderRadius: 99,
          background: 'rgba(255,255,255,0.10)',
          border: '1px solid rgba(255,255,255,0.22)',
          backdropFilter: 'blur(8px)',
        }}>
          <Sparkles size={11} color="#FFB84A" />
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.13em', color: 'rgba(255,255,255,0.90)', textTransform: 'uppercase' }}>
            AI-Powered Travel
          </span>
        </div>

        <h2 style={{
          fontFamily: 'serif', fontWeight: 700, fontSize: 28,
          color: 'white', textAlign: 'center',
          letterSpacing: '-0.02em', lineHeight: 1.25,
          textShadow: '0 2px 20px rgba(0,0,0,0.30)',
          margin: 0,
        }}>
          Your trip planned in{' '}
          <em style={{ fontStyle: 'italic', color: '#FFB84A' }}>moments</em>
        </h2>

        <p style={{
          fontSize: 13.5, color: 'rgba(255,255,255,0.70)',
          textAlign: 'center', lineHeight: 1.55,
          maxWidth: 320, margin: 0,
        }}>
          Plan smarter, spend less, travel more —<br />
          AI insights built for Indian travellers.
        </p>
      </motion.div>
    </div>
  );
}
