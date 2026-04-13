import { motion } from 'framer-motion';
import { Plane, Compass } from 'lucide-react';
import { useSearchStore, type SearchMode } from '@/store/searchStore';

const modes: { id: SearchMode; icon: React.ReactNode; label: string; desc: string }[] = [
  {
    id: 'A',
    icon: <Plane size={22} />,
    label: 'Mode A — I Know Where',
    desc: 'Search flights & hotels for a specific route',
  },
  {
    id: 'B',
    icon: <Compass size={22} />,
    label: 'Mode B — Surprise Me',
    desc: 'Tell me your budget, I\'ll find the best destination',
  },
];

export function ModeSelector() {
  const { mode, setMode } = useSearchStore();

  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {modes.map((m) => (
        <button
          key={m.id}
          onClick={() => setMode(m.id)}
          className="relative text-left p-4 rounded-xl border-2 transition-all duration-200"
          style={{
            borderColor: mode === m.id ? 'var(--color-saffron)' : 'var(--border-card)',
            background: mode === m.id ? 'rgba(255,107,53,0.04)' : 'var(--bg-card)',
          }}
        >
          {mode === m.id && (
            <motion.div
              layoutId="mode-indicator"
              className="absolute inset-0 rounded-[10px] border-2 border-saffron"
              transition={{ duration: 0.2 }}
            />
          )}
          <div className="relative flex items-start gap-3">
            <span
              className="mt-0.5 p-2 rounded-lg"
              style={{
                background: mode === m.id ? 'var(--color-saffron)' : 'var(--bg-input)',
                color: mode === m.id ? 'white' : 'var(--text-muted)',
              }}
            >
              {m.icon}
            </span>
            <div>
              <p className="font-semibold text-sm text-primary">{m.label}</p>
              <p className="text-xs text-muted mt-0.5">{m.desc}</p>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
