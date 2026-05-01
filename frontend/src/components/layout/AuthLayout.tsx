import { type ReactNode, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plane } from 'lucide-react';
import { pageVariants } from '@/lib/animations';

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

// ─── Premium fonts ────────────────────────────────────────────────────────────
function usePremiumFont() {
  useEffect(() => {
    const id = 'auth-premium-font';
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href =
      'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&display=swap';
    document.head.appendChild(link);
  }, []);
}

// ─── Layout ──────────────────────────────────────────────────────────────────
export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  usePremiumFont();

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        fontFamily: '"DM Sans", system-ui, sans-serif',
        background: '#FBF7F2',
      }}
    >
      {/* ─────────── LEFT — Form ─────────── */}
      <motion.section
        variants={pageVariants}
        initial="hidden"
        animate="visible"
        style={{
          width: '50%',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '36px 56px',
          position: 'relative',
          background: '#FBF7F2',
        }}
      >
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <Link
            to="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 9,
              textDecoration: 'none',
            }}
          >
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                background: '#E8622A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Plane size={13} color="white" />
            </div>
            <span
              style={{
                fontFamily: '"Cormorant Garamond", serif',
                fontSize: 21,
                color: '#1A1208',
                letterSpacing: '0.005em',
              }}
            >
              <span style={{ fontWeight: 500, color: '#E8622A' }}>Travel</span>{' '}
              <span style={{ fontWeight: 400 }}>Sarthi</span>
            </span>
          </Link>
        </motion.div>

        {/* Centered form block */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            maxWidth: 380,
            width: '100%',
            margin: '0 auto',
            paddingBottom: 40,
          }}
        >
          {/* Section tag */}
          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.12 }}
            style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22 }}
          >
            <div style={{ width: 18, height: 1, background: '#E8622A' }} />
            <span
              style={{
                fontSize: 10,
                color: '#B07050',
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                fontWeight: 500,
              }}
            >
              AI Travel Companion
            </span>
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
            style={{
              fontFamily: '"Cormorant Garamond", serif',
              fontSize: 56,
              fontWeight: 300,
              lineHeight: 1.05,
              letterSpacing: '-0.025em',
              color: '#1A1208',
              margin: 0,
              marginBottom: subtitle ? 12 : 36,
            }}
          >
            {title}
          </motion.h1>

          {/* Subtitle */}
          {subtitle && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.26 }}
              style={{
                fontSize: 14,
                color: '#8A6E5C',
                lineHeight: 1.6,
                margin: 0,
                marginBottom: 36,
                fontStyle: 'italic',
                fontFamily: '"Cormorant Garamond", serif',
                fontWeight: 400,
              }}
            >
              {subtitle}
            </motion.p>
          )}

          {/* Form */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.32, ease: [0.16, 1, 0.3, 1] }}
          >
            {children}
          </motion.div>
        </div>

        {/* Bottom whisper */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 11,
            color: '#B5A090',
            letterSpacing: '0.05em',
          }}
        >
          <span>© {new Date().getFullYear()} Travel Sarthi</span>
          <span style={{ letterSpacing: '0.16em', textTransform: 'uppercase', fontSize: 10 }}>
            Crafted in India
          </span>
        </motion.div>
      </motion.section>

      {/* ─────────── RIGHT — Moodboard ─────────── */}
      <MoodboardPanel />
    </div>
  );
}

// ─── Right side: Pinterest-style editorial moodboard ─────────────────────────

interface MoodImage {
  src: string;
  alt: string;
  pos: {
    top?: string; left?: string; right?: string; bottom?: string;
    width: string; height: string;
  };
  rotate: number;
  delay: number;
  floatDur: number;
  floatDelay: number;
  tag?: string;
}

const MOOD_IMAGES: MoodImage[] = [
  // Hot air balloons — large, top-left hero
  {
    src: 'https://images.unsplash.com/photo-1545158535-c3f7168c28b6?w=900&q=85',
    alt: 'Hot air balloons',
    pos: { top: '4%', left: '5%', width: '44%', height: '50%' },
    rotate: -1.8, delay: 0.18, floatDur: 5.5, floatDelay: 0,
    tag: 'Skies',
  },
  // Tropical beach — top-right
  {
    src: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=700&q=85',
    alt: 'Tropical beach',
    pos: { top: '6%', right: '6%', width: '40%', height: '36%' },
    rotate: 1.5, delay: 0.30, floatDur: 6.5, floatDelay: 0.5,
    tag: 'Shores',
  },
  // Tropical leaves — middle-right
  {
    src: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=600&q=85',
    alt: 'Tropical leaves',
    pos: { top: '46%', right: '6%', width: '40%', height: '24%' },
    rotate: -1.2, delay: 0.42, floatDur: 5, floatDelay: 1,
  },
  // Desert dunes — bottom-left
  {
    src: 'https://images.unsplash.com/photo-1547235001-d703406d3641?w=700&q=85',
    alt: 'Desert dunes',
    pos: { bottom: '5%', left: '5%', width: '44%', height: '38%' },
    rotate: 1.2, delay: 0.54, floatDur: 6, floatDelay: 0.3,
    tag: 'Dunes',
  },
  // Coastal village — bottom-right
  {
    src: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=700&q=85',
    alt: 'Coastline',
    pos: { bottom: '5%', right: '6%', width: '40%', height: '26%' },
    rotate: -2, delay: 0.66, floatDur: 5.8, floatDelay: 0.8,
  },
];

function MoodboardPanel() {
  return (
    <div
      className="hidden lg:block"
      style={{
        flex: 1,
        position: 'relative',
        overflow: 'hidden',
        background:
          'radial-gradient(ellipse at top right, #FFE8D6 0%, #FBF1E5 35%, #F5E5D2 100%)',
      }}
    >
      {/* Soft grain noise overlay */}
      <div
        style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          opacity: 0.4, mixBlendMode: 'multiply',
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.6  0 0 0 0 0.45  0 0 0 0 0.3  0 0 0 0.06 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
        }}
      />

      {/* Decorative warm blobs */}
      <div
        style={{
          position: 'absolute', top: '-15%', right: '-10%',
          width: 400, height: 400, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(232,98,42,0.16), transparent 70%)',
          filter: 'blur(60px)', pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute', bottom: '-10%', left: '-8%',
          width: 350, height: 350, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,180,120,0.20), transparent 70%)',
          filter: 'blur(70px)', pointerEvents: 'none',
        }}
      />

      {/* The collage */}
      <div style={{ position: 'absolute', inset: 0 }}>
        {MOOD_IMAGES.map((img, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 30, rotate: img.rotate, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, rotate: img.rotate, scale: 1 }}
            transition={{
              duration: 0.85, delay: img.delay,
              ease: [0.16, 1, 0.3, 1],
            }}
            style={{
              position: 'absolute',
              ...img.pos,
              borderRadius: 18,
              overflow: 'hidden',
              boxShadow:
                '0 20px 50px rgba(80,40,15,0.18), 0 4px 12px rgba(80,40,15,0.10)',
              border: '4px solid white',
            }}
          >
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{
                duration: img.floatDur, delay: img.floatDelay,
                repeat: Infinity, ease: 'easeInOut',
              }}
              style={{ width: '100%', height: '100%', position: 'relative' }}
            >
              <img
                src={img.src}
                alt={img.alt}
                style={{
                  width: '100%', height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                }}
              />
              {/* Subtle warm tint to harmonise images */}
              <div
                style={{
                  position: 'absolute', inset: 0,
                  background:
                    'linear-gradient(180deg, transparent 60%, rgba(80,40,10,0.20) 100%)',
                  pointerEvents: 'none',
                }}
              />
              {img.tag && (
                <span
                  style={{
                    position: 'absolute',
                    bottom: 12, left: 12,
                    fontFamily: '"Cormorant Garamond", serif',
                    fontStyle: 'italic',
                    fontSize: 14,
                    color: 'white',
                    background: 'rgba(20,12,4,0.40)',
                    backdropFilter: 'blur(10px)',
                    padding: '3px 10px',
                    borderRadius: 99,
                    letterSpacing: '0.02em',
                    textShadow: '0 1px 4px rgba(0,0,0,0.3)',
                  }}
                >
                  {img.tag}
                </span>
              )}
            </motion.div>
          </motion.div>
        ))}
      </div>

      {/* Centred poetic overlay */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.9, delay: 0.85, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: 'absolute',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          zIndex: 5,
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            background: 'rgba(255,251,246,0.82)',
            backdropFilter: 'blur(14px)',
            border: '1px solid rgba(232,98,42,0.18)',
            borderRadius: 20,
            padding: '22px 36px',
            boxShadow:
              '0 24px 60px rgba(80,40,15,0.18), 0 4px 14px rgba(80,40,15,0.08)',
            maxWidth: 320,
          }}
        >
          <div
            style={{
              fontSize: 9.5,
              color: '#B07050',
              letterSpacing: '0.28em',
              textTransform: 'uppercase',
              fontWeight: 500,
              marginBottom: 10,
            }}
          >
            ✦  Wander Beautifully  ✦
          </div>
          <h2
            style={{
              fontFamily: '"Cormorant Garamond", serif',
              fontSize: 30,
              fontWeight: 400,
              fontStyle: 'italic',
              color: '#1A1208',
              lineHeight: 1.2,
              letterSpacing: '-0.015em',
              margin: 0,
            }}
          >
            Curated journeys,<br />
            <span style={{ color: '#E8622A', fontWeight: 500 }}>beautifully planned.</span>
          </h2>
        </div>
      </motion.div>
    </div>
  );
}
