import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { pageVariants } from '@/lib/animations';

interface PageLayoutProps {
  children: ReactNode;
  hideFooter?: boolean;
  noPadding?: boolean;
}

export function PageLayout({ children, hideFooter, noPadding }: PageLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-page">
      <Navbar />
      <motion.main
        className={`flex-1 ${noPadding !== true ? 'pt-16' : ''}`}
        variants={pageVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        {children}
      </motion.main>
      {hideFooter !== true && <Footer />}
    </div>
  );
}
