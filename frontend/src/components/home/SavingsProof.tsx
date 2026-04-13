import { motion } from 'framer-motion';

const marqueeItems = [
  { route: 'DEL → GOA', saving: '₹3,200', tip: 'Stacked HDFC15 + PAYTM200' },
  { route: 'BOM → BLR', saving: '₹1,840', tip: 'Booked via AI BUY NOW signal' },
  { route: 'DEL → DXB', saving: '₹6,500', tip: 'International + coupon stack' },
  { route: 'CCU → MUM', saving: '₹2,100', tip: 'Flash deal + SBI card offer' },
  { route: 'HYD → GOI', saving: '₹1,650', tip: 'Waited for WAIT signal to clear' },
  { route: 'BLR → COK', saving: '₹900', tip: 'IndiGo SuperSaver fare' },
  { route: 'DEL → JAI', saving: '₹750', tip: 'Weekend flash deal' },
  { route: 'AMD → BOM', saving: '₹1,200', tip: 'AXIS25 coupon applied' },
];

export function SavingsProof() {
  const doubled = [...marqueeItems, ...marqueeItems];

  return (
    <section className="py-12 bg-primary overflow-hidden">
      <div className="mb-6 text-center">
        <p className="text-white/60 text-xs font-semibold uppercase tracking-widest">Live Savings</p>
        <h2 className="text-white font-display text-2xl font-bold mt-1">
          Real savings by real travelers
        </h2>
      </div>

      <div className="relative overflow-hidden">
        <motion.div
          className="flex gap-4 w-max"
          animate={{ x: ['0%', '-50%'] }}
          transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
        >
          {doubled.map((item, i) => (
            <div
              key={i}
              className="flex-shrink-0 bg-white/10 border border-white/15 rounded-xl px-5 py-3.5 min-w-[220px]"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-white font-bold text-sm">{item.route}</span>
                <span className="text-green-400 font-bold text-sm">{item.saving}</span>
              </div>
              <p className="text-white/50 text-xs">{item.tip}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
