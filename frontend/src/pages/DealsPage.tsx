import { PageLayout } from '@/components/layout/PageLayout';
import { FlashDealCard } from '@/components/deals/FlashDealCard';
import { CouponCard } from '@/components/deals/CouponCard';
import { CardSkeleton, Skeleton } from '@/components/ui/Skeleton';
import { useFlashDeals, useCoupons } from '@/hooks/useDeals';
import { Zap, Tag } from 'lucide-react';
import { motion } from 'framer-motion';
import { containerVariants, itemVariants, scrollReveal } from '@/lib/animations';

export function DealsPage() {
  const { data: flashDeals, isLoading: flashLoading } = useFlashDeals();
  const { data: couponsData, isLoading: couponsLoading } = useCoupons();

  return (
    <PageLayout>
      <div className="page-container py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-display font-bold text-primary mb-2">Deals & Coupons</h1>
          <p className="text-secondary">Stack coupons, apply bank offers, save more on every booking</p>
        </div>

        {/* Flash Deals */}
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-coral animate-pulse" />
            <h2 className="text-xl font-display font-bold text-primary flex items-center gap-2">
              <Zap size={20} className="text-coral" /> Live Flash Deals
            </h2>
          </div>

          {flashLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 3 }, (_, i) => <CardSkeleton key={i} />)}
            </div>
          )}

          {flashDeals != null && flashDeals.length > 0 && (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {flashDeals.map((deal) => (
                <motion.div key={deal.id} variants={itemVariants}>
                  <FlashDealCard deal={deal} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </section>

        {/* Coupons */}
        <section>
          <motion.h2 {...scrollReveal} className="text-xl font-display font-bold text-primary flex items-center gap-2 mb-4">
            <Tag size={20} className="text-saffron" /> All Coupons
          </motion.h2>

          {couponsLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }, (_, i) => <CardSkeleton key={i} />)}
            </div>
          )}

          {couponsData != null && (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {couponsData.coupons.map((coupon) => (
                <motion.div key={coupon.id} variants={itemVariants}>
                  <CouponCard coupon={coupon} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </section>
      </div>
    </PageLayout>
  );
}
