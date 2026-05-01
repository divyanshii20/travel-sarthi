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
      'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&display=swap';
    document.head.appendChild(link);
  }, []);
}

// ─── Minimal, premium auth layout ─────────────────────────────────────────────
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
        {/* Logo — top left */}
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

        {/* Centred form block */}
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
          {/* Section label */}
          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.12 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: 22,
            }}
          >
            <div
              style={{
                width: 18,
                height: 1,
                background: '#E8622A',
              }}
            />
            <span
              style={{
                fontSize: 10,
                color: '#B07050',
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                fontWeight: 500,
              }}
            >
              Voyager Portal
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

          {/* Children (form) */}
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

      {/* ─────────── RIGHT — Single image, breathing ─────────── */}
      <RightVisualPanel />
    </div>
  );
}

// ─── Right visual — kept very minimal ────────────────────────────────────────
function RightVisualPanel() {
  return (
    <div
      className="hidden lg:block"
      style={{
        flex: 1,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Single calm image with slow Ken Burns */}
      <motion.img
        src="https://images.unsplash.com/photo-1599661046289-e31897846e41?w=1600&q=88"
        alt="Jaisalmer"
        initial={{ scale: 1.08, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center 45%',
        }}
      />

      {/* Soft warm tint to harmonise with cream form side */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(to right, rgba(251,247,242,0.18) 0%, transparent 18%)',
          pointerEvents: 'none',
        }}
      />

      {/* Bottom gradient — only enough to anchor the text */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(to top, rgba(20,12,4,0.62) 0%, transparent 45%)',
          pointerEvents: 'none',
        }}
      />

      {/* Top-right tiny destination tag */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.45 }}
        style={{
          position: 'absolute',
          top: 36,
          right: 36,
          display: 'flex',
          alignItems: 'center',
          gap: 9,
        }}
      >
        <div
          style={{
            width: 5,
            height: 5,
            borderRadius: '50%',
            background: '#FFFFFF',
            boxShadow: '0 0 10px rgba(255,255,255,0.8)',
          }}
        />
        <span
          style={{
            fontSize: 10,
            color: 'rgba(255,255,255,0.85)',
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            fontWeight: 500,
          }}
        >
          Jaisalmer · Rajasthan
        </span>
      </motion.div>

      {/* Bottom editorial line — single quote, that's all */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.85, delay: 0.55, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: 'absolute',
          bottom: 56,
          left: 56,
          right: 56,
        }}
      >
        <div
          style={{
            width: 38,
            height: 1,
            background: 'rgba(255,255,255,0.55)',
            marginBottom: 18,
          }}
        />
        <h2
          style={{
            fontFamily: '"Cormorant Garamond", serif',
            fontSize: 38,
            fontWeight: 300,
            fontStyle: 'italic',
            color: 'white',
            lineHeight: 1.25,
            letterSpacing: '-0.015em',
            margin: 0,
            maxWidth: 420,
            textShadow: '0 2px 24px rgba(0,0,0,0.35)',
          }}
        >
          Where every road<br />
          becomes a story.
        </h2>
      </motion.div>
    </div>
  );
}
