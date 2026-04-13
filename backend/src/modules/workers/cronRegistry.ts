import cron from 'node-cron';
import { eq, and, lte, isNull, gt } from 'drizzle-orm';
import { db } from '../../config/database';
import { priceAlerts } from '../../db/schema/alerts';
import { flashDeals } from '../../db/schema/deals';
import { alertQueue } from './alertWorker';
import { logger } from '../../shared/logger';
import { cacheInvalidatePattern } from '../../shared/cache';

export function startCronWorkers() {
  // ─── 1. Fare Alert Checker (every 4 hours) ───────────────────────────────
  cron.schedule('0 */4 * * *', async () => {
    try {
      const now = new Date();
      const activeAlerts = await db
        .select({ id: priceAlerts.id })
        .from(priceAlerts)
        .where(
          and(
            eq(priceAlerts.isActive, true),
            // Only alerts where frequency allows checking
            lte(priceAlerts.lastCheckedAt, new Date(Date.now() - 4 * 60 * 60 * 1000)),
          ),
        )
        .limit(100);

      for (const alert of activeAlerts) {
        await alertQueue.add('check-fare', { alertId: alert.id }, {
          jobId: `fare-${alert.id}-${Date.now()}`,
          attempts: 2,
        });
      }

      logger.info({ count: activeAlerts.length }, 'Fare alert jobs enqueued');
    } catch (err) {
      logger.error({ err }, 'Fare alert cron failed');
    }
  }, { scheduled: true, timezone: 'Asia/Kolkata' });

  // ─── 2. Flash Deal Cleanup (every hour) ──────────────────────────────────
  cron.schedule('0 * * * *', async () => {
    try {
      const now = new Date();
      await db
        .update(flashDeals)
        .set({ isLive: false })
        .where(lte(flashDeals.expiresAt, now));

      logger.info('Flash deals cleanup completed');
    } catch (err) {
      logger.error({ err }, 'Flash deal cleanup cron failed');
    }
  });

  // ─── 3. Cache Invalidation (daily at 2am IST) ────────────────────────────
  cron.schedule('0 2 * * *', async () => {
    try {
      await cacheInvalidatePattern('flights:*');
      await cacheInvalidatePattern('hotels:*');
      logger.info('Daily cache invalidation completed');
    } catch (err) {
      logger.error({ err }, 'Cache invalidation cron failed');
    }
  }, { scheduled: true, timezone: 'Asia/Kolkata' });

  // ─── 4. Coupon Deactivation (daily at midnight) ──────────────────────────
  cron.schedule('0 0 * * *', async () => {
    try {
      const { coupons } = await import('../../db/schema/deals');
      const { lte: lteOp } = await import('drizzle-orm');
      const now = new Date();

      // Deactivate expired coupons
      await db
        .update(coupons)
        .set({ isActive: false })
        .where(and(eq(coupons.isActive, true), lteOp(coupons.expiresAt!, now)));

      logger.info('Expired coupons deactivated');
    } catch (err) {
      logger.error({ err }, 'Coupon deactivation cron failed');
    }
  }, { scheduled: true, timezone: 'Asia/Kolkata' });

  // ─── 5. Database Health Check (every 5 minutes) ──────────────────────────
  cron.schedule('*/5 * * * *', async () => {
    try {
      const { pool } = await import('../../config/database');
      await pool.query('SELECT 1');
    } catch (err) {
      logger.error({ err }, 'Database health check failed');
    }
  });

  logger.info('All cron workers started');
}
