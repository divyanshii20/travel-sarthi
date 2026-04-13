import { motion } from 'framer-motion';
import { Search, Sparkles, Plane } from 'lucide-react';
import { scrollReveal, containerVariants, itemVariants } from '@/lib/animations';

const steps = [
  {
    icon: <Search size={28} />,
    number: '01',
    title: 'Search or Discover',
    desc: 'Enter your destination or tell us your budget — our AI finds the best options across all platforms.',
  },
  {
    icon: <Sparkles size={28} />,
    title: 'AI Predicts & Recommends',
    number: '02',
    desc: 'Our ML model analyzes 44 features to predict whether to BUY NOW or WAIT for a better price.',
  },
  {
    icon: <Plane size={28} />,
    title: 'Book & Save',
    number: '03',
    desc: 'Stack coupons, apply bank offers, and book via the cheapest platform — all from one place.',
  },
];

export function HowItWorks() {
  return (
    <section className="section bg-card">
      <div className="page-container">
        <motion.div {...scrollReveal} className="text-center mb-12">
          <h2 className="text-3xl font-display font-bold text-primary mb-2">How It Works</h2>
          <p className="text-secondary">Three steps to your perfect trip</p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          className="grid md:grid-cols-3 gap-6 relative"
        >
          {/* Connecting line (desktop) */}
          <div className="absolute top-10 left-[calc(16.66%+24px)] right-[calc(16.66%+24px)] h-px bg-border-card hidden md:block" />

          {steps.map((step, i) => (
            <motion.div key={i} variants={itemVariants} className="flex flex-col items-center text-center gap-4 relative">
              <div className="relative">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-saffron"
                  style={{ background: 'linear-gradient(135deg, var(--color-saffron), var(--color-gold))' }}
                >
                  {step.icon}
                </div>
                <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center">
                  {step.number}
                </span>
              </div>
              <h3 className="text-lg font-display font-bold text-primary">{step.title}</h3>
              <p className="text-sm text-secondary leading-relaxed">{step.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
