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

      {/* Right panel: animated globe scene (hidden on mobile) */}
      <AuthVisualPanel />
    </div>
  );
}

// ─── Animated Globe + Flight Scene ────────────────────────────────────────────

function AuthVisualPanel() {
  // Cities scattered across the globe surface (approximate "lat/long" → x/y on globe)
  const cities = [
    { x: 38, y: 42, label: 'DEL' },
    { x: 70, y: 55, label: 'SIN' },
    { x: 28, y: 60, label: 'GOA' },
    { x: 60, y: 35, label: 'NRT' },
  ];

  return (
    <div
      className="hidden lg:block lg:w-1/2 relative overflow-hidden"
      style={{
        background:
          'linear-gradient(135deg, #FF8B5A 0%, #E8622A 45%, #C94E1A 100%)',
      }}
    >
      {/* Decorative glow blobs */}
      <div
        style={{
          position: 'absolute', top: '-12%', right: '-15%',
          width: 460, height: 460, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.18), transparent 70%)',
          filter: 'blur(40px)',
        }}
      />
      <div
        style={{
          position: 'absolute', bottom: '-18%', left: '-12%',
          width: 380, height: 380, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,200,150,0.30), transparent 70%)',
          filter: 'blur(50px)',
        }}
      />

      {/* Star/dot particle backdrop */}
      {Array.from({ length: 22 }).map((_, i) => {
        const top = (i * 47) % 100;
        const left = (i * 73) % 100;
        const delay = (i * 0.27) % 4;
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0.25 }}
            animate={{ opacity: [0.25, 0.85, 0.25], scale: [1, 1.4, 1] }}
            transition={{ duration: 3 + (i % 3), repeat: Infinity, ease: 'easeInOut', delay }}
            style={{
              position: 'absolute',
              top: `${top}%`, left: `${left}%`,
              width: i % 4 === 0 ? 4 : 2,
              height: i % 4 === 0 ? 4 : 2,
              borderRadius: '50%',
              background: 'white',
              boxShadow: '0 0 8px rgba(255,255,255,0.7)',
            }}
          />
        );
      })}

      {/* Brand */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="absolute top-10 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10"
      >
        <span
          style={{
            width: 32, height: 32, borderRadius: 10,
            background: 'rgba(255,255,255,0.18)',
            border: '1px solid rgba(255,255,255,0.4)',
            backdropFilter: 'blur(12px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Plane size={15} color="white" />
        </span>
        <span className="font-display font-bold text-xl text-white">Travel Sarthi</span>
      </motion.div>

      {/* Globe + orbit + planes */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div style={{ position: 'relative', width: 480, height: 480 }}>

          {/* Outer rotating orbit ring */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
            style={{
              position: 'absolute', inset: 0,
              border: '1.5px dashed rgba(255,255,255,0.32)',
              borderRadius: '50%',
            }}
          />
          {/* Inner counter-rotating ring */}
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 45, repeat: Infinity, ease: 'linear' }}
            style={{
              position: 'absolute', inset: 60,
              border: '1px dashed rgba(255,255,255,0.20)',
              borderRadius: '50%',
            }}
          />

          {/* Globe */}
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              position: 'absolute', top: '50%', left: '50%',
              width: 200, height: 200,
              marginTop: -100, marginLeft: -100,
            }}
          >
            <div
              style={{
                width: '100%', height: '100%',
                borderRadius: '50%',
                background:
                  'radial-gradient(circle at 32% 30%, #FFFFFF 0%, #FFE0CC 40%, #FFB48A 75%, #E8622A 100%)',
                boxShadow:
                  '0 24px 70px rgba(0,0,0,0.30), inset -14px -16px 36px rgba(180,60,15,0.35), inset 6px 8px 20px rgba(255,255,255,0.45)',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Continent silhouettes */}
              <svg
                viewBox="0 0 100 100"
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.42 }}
              >
                <path d="M18,32 Q26,26 38,30 Q44,38 42,48 Q34,54 26,50 Q20,42 18,32 Z" fill="#7A2E0A" />
                <path d="M52,22 Q62,20 72,26 Q74,36 68,42 Q58,42 52,34 Z" fill="#7A2E0A" />
                <path d="M55,55 Q67,52 78,60 Q76,72 64,72 Q54,66 55,55 Z" fill="#7A2E0A" />
                <path d="M22,62 Q32,60 38,68 Q34,76 26,74 Q20,70 22,62 Z" fill="#7A2E0A" />
                <circle cx="48" cy="65" r="3" fill="#7A2E0A" />
              </svg>

              {/* City pulse markers on the globe */}
              {cities.map((c, i) => (
                <div
                  key={i}
                  style={{
                    position: 'absolute',
                    top: `${c.y}%`, left: `${c.x}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  <motion.div
                    animate={{ scale: [1, 2.2, 1], opacity: [0.7, 0, 0.7] }}
                    transition={{ duration: 2.4, repeat: Infinity, ease: 'easeOut', delay: i * 0.4 }}
                    style={{
                      position: 'absolute', inset: -3,
                      width: 12, height: 12, borderRadius: '50%',
                      background: 'rgba(255,255,255,0.55)',
                    }}
                  />
                  <div
                    style={{
                      width: 6, height: 6, borderRadius: '50%',
                      background: 'white',
                      boxShadow: '0 0 8px rgba(255,255,255,0.95)',
                      position: 'relative',
                    }}
                  />
                </div>
              ))}

              {/* Highlight shine */}
              <div
                style={{
                  position: 'absolute', top: '8%', left: '15%',
                  width: '35%', height: '25%',
                  borderRadius: '50%',
                  background: 'radial-gradient(ellipse, rgba(255,255,255,0.55), transparent 70%)',
                  filter: 'blur(8px)',
                }}
              />
            </div>
          </motion.div>

          {/* Flight paths (curved arcs) + animated planes */}
          <svg
            style={{
              position: 'absolute', inset: 0, width: '100%', height: '100%',
              overflow: 'visible',
            }}
            viewBox="0 0 480 480"
          >
            <defs>
              <path id="flightArc1" d="M 90,210 Q 240,60 390,210" fill="none" />
              <path id="flightArc2" d="M 110,290 Q 240,440 370,290" fill="none" />
            </defs>

            {/* Dashed arc traces */}
            <use
              href="#flightArc1"
              stroke="rgba(255,255,255,0.45)"
              strokeWidth="1.5"
              strokeDasharray="5 7"
              fill="none"
            />
            <use
              href="#flightArc2"
              stroke="rgba(255,255,255,0.30)"
              strokeWidth="1.5"
              strokeDasharray="5 7"
              fill="none"
            />

            {/* Origin / destination markers */}
            <circle cx="90" cy="210" r="6" fill="white" />
            <circle cx="90" cy="210" r="11" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" />
            <circle cx="390" cy="210" r="6" fill="white" />
            <circle cx="390" cy="210" r="11" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" />
            <circle cx="110" cy="290" r="5" fill="white" opacity="0.85" />
            <circle cx="370" cy="290" r="5" fill="white" opacity="0.85" />

            {/* Plane 1 traveling along arc1 */}
            <g>
              <animateMotion dur="6s" repeatCount="indefinite" rotate="auto">
                <mpath href="#flightArc1" />
              </animateMotion>
              <g transform="translate(-9,-9)">
                <circle cx="9" cy="9" r="11" fill="rgba(255,255,255,0.25)" />
                <circle cx="9" cy="9" r="9" fill="white" />
                <path
                  d="M 6,9 L 13,6 L 12,9 L 13,12 Z M 9,8 L 9,10"
                  fill="#E8622A"
                  stroke="#E8622A"
                  strokeWidth="0.5"
                />
              </g>
            </g>

            {/* Plane 2 traveling along arc2 (opposite direction, slower) */}
            <g>
              <animateMotion dur="8s" repeatCount="indefinite" rotate="auto" keyPoints="1;0" keyTimes="0;1" calcMode="linear">
                <mpath href="#flightArc2" />
              </animateMotion>
              <g transform="translate(-7,-7)">
                <circle cx="7" cy="7" r="9" fill="rgba(255,255,255,0.20)" />
                <circle cx="7" cy="7" r="7" fill="white" />
                <path
                  d="M 4.5,7 L 10,5 L 9,7 L 10,9 Z"
                  fill="#E8622A"
                />
              </g>
            </g>
          </svg>

          {/* Floating service icons at cardinal positions on the OUTER orbit */}
          {[
            { icon: <Plane size={18} />,           top: -4,    left: '50%',  tx: '-50%', ty: '-50%', delay: 0 },
            { icon: <Bed size={18} />,             top: '50%', right: -4,    tx: '50%',  ty: '-50%', delay: 0.6 },
            { icon: <UtensilsCrossed size={18} />, bottom: -4, left: '50%',  tx: '-50%', ty: '50%',  delay: 1.2 },
            { icon: <Train size={18} />,           top: '50%', left: -4,     tx: '-50%', ty: '-50%', delay: 1.8 },
          ].map((p, i) => (
            <motion.div
              key={i}
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: p.delay }}
              style={{
                position: 'absolute',
                top: p.top as any, left: p.left as any,
                right: p.right as any, bottom: p.bottom as any,
                transform: `translate(${p.tx}, ${p.ty})`,
                width: 54, height: 54,
                borderRadius: '50%',
                background: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 10px 28px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.9)',
                color: '#E8622A',
                zIndex: 5,
              }}
            >
              {p.icon}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Bottom tagline */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.4 }}
        className="absolute bottom-12 left-1/2 -translate-x-1/2 text-center px-8"
        style={{ width: '100%', maxWidth: 460 }}
      >
        <div
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full mb-3"
          style={{
            background: 'rgba(255,255,255,0.18)',
            border: '1px solid rgba(255,255,255,0.32)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <Sparkles size={11} color="white" />
          <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-white">
            AI-Powered
          </span>
        </div>
        <h2
          className="font-display text-3xl font-bold text-white"
          style={{ letterSpacing: '-0.02em', textShadow: '0 2px 16px rgba(0,0,0,0.18)' }}
        >
          Your trip planned in{' '}
          <span style={{ fontStyle: 'italic', color: '#FFE4BA' }}>moments</span>
        </h2>
        <p className="text-white/85 text-sm mt-2.5" style={{ letterSpacing: '0.01em' }}>
          Plan smarter, spend less, travel more — across 350+ destinations.
        </p>
      </motion.div>
    </div>
  );
}
