import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { pageVariants } from '@/lib/animations';
import { CDN_IMAGES } from '@/constants/cdnImages';

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

      {/* Right panel: image (hidden on mobile) */}
      <div className="hidden lg:block lg:w-1/2 relative">
        <img
          src={CDN_IMAGES.hero}
          alt="Travel"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/60 to-teal/60" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center px-8">
          <h2 className="font-display text-3xl font-bold mb-3">Your AI Travel Partner</h2>
          <p className="text-white/80 text-base max-w-xs">
            Plan smarter, spend less, travel more with AI-powered insights built for Indian travelers.
          </p>
        </div>
      </div>
    </div>
  );
}
