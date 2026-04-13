import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface Tab {
  id: string;
  label: ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export function Tabs({ tabs, activeTab, onChange, className = '' }: TabsProps) {
  return (
    <div className={`flex gap-1 p-1 bg-card rounded-xl ${className}`}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className="relative flex-1 px-4 py-2 text-sm font-semibold rounded-lg transition-colors"
          style={{ color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-muted)' }}
        >
          {activeTab === tab.id && (
            <motion.div
              layoutId="active-tab"
              className="absolute inset-0 bg-white rounded-lg shadow-sm"
              style={{ zIndex: 0 }}
              transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
            />
          )}
          <span className="relative z-10">{tab.label}</span>
        </button>
      ))}
    </div>
  );
}
