interface TickerItem {
  name: string;
  changePct: number;
}

interface TrendingTickerProps {
  items: TickerItem[];
}

export function TrendingTicker({ items }: TrendingTickerProps) {
  if (items.length === 0) return null;

  const tickerContent = items.map((item, i) => (
    <span key={i} className="inline-flex items-center gap-1 mr-8 shrink-0">
      <span className="font-semibold text-white">{item.name}</span>
      <span
        className="text-xs font-bold px-1.5 py-0.5 rounded-full"
        style={{ background: 'rgba(22,163,74,0.3)', color: '#4ade80' }}
      >
        +{Math.round(item.changePct)}%
      </span>
    </span>
  ));

  return (
    <div
      className="overflow-hidden flex items-center"
      style={{ height: 40, background: 'linear-gradient(90deg, #1a0a02 0%, #2d1505 50%, #1a0a02 100%)' }}
    >
      {/* Label */}
      <div
        className="shrink-0 flex items-center gap-2 px-4 text-xs font-bold text-white/90 z-10"
        style={{ background: 'var(--color-saffron)', height: '100%', minWidth: 120 }}
      >
        <span style={{ fontSize: 14 }}>🔥</span>
        Trending
      </div>

      {/* Marquee track */}
      <div className="flex-1 overflow-hidden relative" style={{ height: '100%' }}>
        <div
          className="flex items-center text-xs text-white/70 whitespace-nowrap"
          style={{
            animation: 'marquee 28s linear infinite',
            height: '100%',
          }}
        >
          {tickerContent}
          {/* Duplicate for seamless loop */}
          {tickerContent}
        </div>
      </div>
    </div>
  );
}
