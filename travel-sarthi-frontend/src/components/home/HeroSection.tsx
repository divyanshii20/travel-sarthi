import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, TrendingDown, Clock, ShieldCheck, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { containerVariants, itemVariants, scaleIn } from '@/lib/animations';
import { CDN_IMAGES } from '@/constants/cdnImages';

const SLIDES = [
  { src: CDN_IMAGES.goa,      name: 'Goa, India',        sub: "India's Most Loved Beach Escape ✈️" },
  { src: CDN_IMAGES.kerala,   name: 'Kerala, India',      sub: "God's Own Country 🌿" },
  { src: CDN_IMAGES.andaman,  name: 'Andaman Islands',    sub: 'Crystal Waters & White Sands 🐠' },
  { src: CDN_IMAGES.himachal, name: 'Himachal Pradesh',   sub: 'Peaks, Valleys & Starlit Skies 🏔️' },
  {
    src: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=800&q=80',
    name: 'Rajasthan, India',
    sub: 'Land of Kings & Golden Forts 🏰',
  },
  {
    src: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800&q=80',
    name: 'Santorini, Greece',
    sub: 'Sunsets Over the Aegean ☀️',
  },
];

// Per-slide content for the 3 floating cards
const SLIDE_CARDS = [
  // Goa
  [
    { label: '₹2,400 saved',  sub: 'DEL → GOA today' },
    { label: 'Price at Low',  sub: 'Best time to buy ↑' },
    { label: '3h 25m direct', sub: 'Fastest route' },
  ],
  // Kerala
  [
    { label: '₹3,100 saved',  sub: 'BOM → COK today' },
    { label: 'Trending Now',  sub: 'Most booked this week' },
    { label: '2h 10m direct', sub: 'Fastest route' },
  ],
  // Andaman
  [
    { label: '₹4,200 saved',  sub: 'DEL → IXZ today' },
    { label: 'Limited Seats', sub: 'Book before it\'s gone' },
    { label: '3h 55m direct', sub: 'Fastest route' },
  ],
  // Himachal
  [
    { label: '₹1,800 saved',  sub: 'DEL → KUU today' },
    { label: 'Price at Low',  sub: 'Best time to book ↑' },
    { label: '1h 35m direct', sub: 'Fastest route' },
  ],
  // Rajasthan
  [
    { label: '₹2,600 saved',   sub: 'BOM → JAI today' },
    { label: 'Price Dropping', sub: 'Prices fell 18% ↓' },
    { label: '1h 20m direct',  sub: 'Fastest route' },
  ],
  // Santorini
  [
    { label: '₹18,500 saved',   sub: 'DEL → ATH today' },
    { label: 'Best Season',     sub: 'Perfect weather now ☀️' },
    { label: '9h 30m via AMS',  sub: 'Best connection' },
  ],
];

const floatingCardsMeta = [
  {
    icon: <TrendingDown size={15} className="text-green-500" />,
    delay: 0,
    pos: { top: '10%', right: '-6%' },
    float: 'animate-float',
  },
  {
    icon: <Sparkles size={15} style={{ color: '#E8622A' }} />,
    delay: 0.18,
    pos: { top: '44%', left: '-14%' },
    float: 'animate-float-2',
  },
  {
    icon: <Clock size={15} style={{ color: '#0A6B66' }} />,
    delay: 0.36,
    pos: { bottom: '12%', right: '-4%' },
    float: 'animate-float-3',
  },
];

const stats = [
  { value: '4.2L+', label: 'Travelers' },
  { value: '₹38Cr+', label: 'Savings' },
  { value: '92%', label: 'AI Accuracy' },
];

export function HeroSection() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setActive((p) => (p + 1) % SLIDES.length), 4500);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-[68px]" style={{ background: 'var(--bg-page)' }}>

      {/* ── Gradient Mesh Background ── */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <div className="absolute top-[-10%] right-[-5%] w-[55vw] h-[70vh] rounded-full"
          style={{ background: 'radial-gradient(ellipse, rgba(232,98,42,0.12) 0%, transparent 65%)', filter: 'blur(60px)' }} />
        <div className="absolute bottom-[5%] left-[-8%] w-[45vw] h-[60vh] rounded-full"
          style={{ background: 'radial-gradient(ellipse, rgba(10,107,102,0.09) 0%, transparent 65%)', filter: 'blur(70px)' }} />
        <div className="absolute top-[30%] left-[40%] w-[30vw] h-[40vh] rounded-full"
          style={{ background: 'radial-gradient(ellipse, rgba(201,151,74,0.07) 0%, transparent 65%)', filter: 'blur(80px)' }} />
      </div>

      <div className="page-container grid md:grid-cols-[1fr_1fr] gap-12 lg:gap-16 items-center py-16 lg:py-20 relative z-10">

        {/* ── Left: Text ── */}
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="flex flex-col gap-6">

          {/* Badge */}
          <motion.div variants={itemVariants}>
            <span
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold tracking-wide"
              style={{
                background: 'rgba(232,98,42,0.08)',
                border: '1px solid rgba(232,98,42,0.18)',
                color: 'var(--color-saffron)',
              }}
            >
              <ShieldCheck size={13} />
              AI-Powered · Real-Time · Built for India
            </span>
          </motion.div>

          {/* Headline */}
          <motion.div variants={itemVariants}>
            <h1
              className="font-display font-bold tracking-display"
              style={{ fontSize: 'clamp(2.4rem, 5vw, 4rem)', lineHeight: 1.12, color: 'var(--text-primary)' }}
            >
              Your smartest way{' '}
              <br className="hidden sm:block" />
              to{' '}
              <span className="text-gradient-saffron italic">travel India</span>
              <br className="hidden sm:block" />
              {' '}& beyond.
            </h1>
          </motion.div>

          {/* Subtext */}
          <motion.p variants={itemVariants} className="text-base sm:text-[1.0625rem] max-w-[440px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            Cheapest flights, AI itineraries, real-time price predictions and exclusive deals —
            all in one beautifully designed platform.
          </motion.p>

          {/* CTAs */}
          <motion.div variants={itemVariants} className="flex flex-col xs:flex-row gap-3 pt-1">
            <Link to="/plan" className="btn-primary gap-2.5">
              Plan My Trip <ArrowRight size={16} />
            </Link>
            <Link to="/discover" className="btn-ghost">
              Explore Destinations
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div variants={itemVariants} className="flex items-center gap-6 pt-3">
            {stats.map((s, i) => (
              <div key={s.label} className="flex items-center gap-6">
                <div>
                  <p className="font-display font-bold text-xl" style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>{s.value}</p>
                  <p className="text-xs font-medium mt-0.5" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
                </div>
                {i < stats.length - 1 && <div className="w-px h-8" style={{ background: 'var(--border-card)' }} />}
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* ── Right: Hero Image + Floating Cards ── */}
        <div className="relative hidden md:flex items-center justify-center">

          {/* Decorative ring */}
          <div className="absolute inset-0 rounded-3xl"
            style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(232,98,42,0.08) 0%, transparent 70%)' }} />

          {/* Main image */}
          <motion.div
            variants={scaleIn}
            initial="hidden"
            animate="visible"
            className="relative w-full max-w-[480px]"
          >
            {/* Outer glow ring */}
            <div className="absolute -inset-3 rounded-[28px]"
              style={{ background: 'linear-gradient(135deg, rgba(232,98,42,0.20), rgba(10,107,102,0.15), rgba(201,151,74,0.10))', filter: 'blur(12px)' }} />

            <div className="relative rounded-[24px] overflow-hidden" style={{ boxShadow: '0 32px 80px rgba(17,17,24,0.20)', height: '420px' }}>

              {/* ── Premium Ken Burns Slideshow ── */}
              <AnimatePresence mode="sync">
                {SLIDES.map((slide, i) => i === active && (
                  <motion.div key={i} className="absolute inset-0"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.1, ease: [0.4, 0, 0.2, 1] }}>
                    <motion.img
                      src={slide.src}
                      alt={slide.name}
                      className="w-full h-full object-cover"
                      initial={{ scale: 1.07 }}
                      animate={{ scale: 1.0 }}
                      transition={{ duration: 5.5, ease: 'linear' }}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Cinematic overlay */}
              <div className="absolute inset-0 pointer-events-none"
                style={{ background: 'linear-gradient(to top, rgba(17,17,24,0.55) 0%, rgba(17,17,24,0.08) 45%, transparent 70%)' }} />

              {/* Destination label */}
              <div className="absolute bottom-4 left-4 right-4">
                <div className="glass rounded-2xl px-4 py-3">
                  <AnimatePresence mode="wait">
                    <motion.div key={active}
                      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}>
                      <p className="text-white font-display font-semibold text-base">{SLIDES[active].name}</p>
                      <p className="text-white/70 text-xs font-medium mt-0.5">{SLIDES[active].sub}</p>
                    </motion.div>
                  </AnimatePresence>

                  {/* Dot indicators */}
                  <div className="flex items-center gap-1.5 mt-2.5">
                    {SLIDES.map((_, i) => (
                      <button key={i} type="button" onClick={() => setActive(i)}
                        className="transition-all duration-500 rounded-full"
                        style={{
                          width: i === active ? 20 : 6,
                          height: 6,
                          background: i === active ? '#FFFFFF' : 'rgba(255,255,255,0.38)',
                        }} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Floating glass cards — content changes per slide */}
          {floatingCardsMeta.map((card, i) => (
            <motion.div
              key={i}
              className={`absolute card-glass px-3.5 py-3 flex items-center gap-3 ${card.float}`}
              style={{ ...card.pos, minWidth: '148px' }}
              initial={{ opacity: 0, scale: 0.75, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.7 + card.delay, duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
            >
              <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'rgba(255,255,255,0.80)', boxShadow: '0 2px 8px rgba(17,17,24,0.08)' }}>
                {card.icon}
              </div>
              <div className="overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.div key={`${i}-${active}`}
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}>
                    <p className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                      {SLIDE_CARDS[active][i].label}
                    </p>
                    <p style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                      {SLIDE_CARDS[active][i].sub}
                    </p>
                  </motion.div>
                </AnimatePresence>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
