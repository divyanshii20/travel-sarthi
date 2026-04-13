import { Queue, Worker } from 'bullmq';
import { eq, and, lte, isNull, gt } from 'drizzle-orm';
import { createBullMQRedisConnection } from '../../config/redis';
import { db } from '../../config/database';
import { priceAlerts } from '../../db/schema/alerts';
import { searchFlights } from '../flights/flights.service';
import { sendFareAlertEmail } from '../users/email.service';
import { users } from '../../db/schema/users';
import { logger } from '../../shared/logger';

export const alertQueue = new Queue('fare-alerts', {
  connection: createBullMQRedisConnection(),
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: 100,
    removeOnFail: 50,
  },
});

export function startAlertWorker() {
  const worker = new Worker(
    'fare-alerts',
    async (job) => {
      const { alertId } = job.data as { alertId: string };
      logger.info({ alertId }, 'Processing fare alert');

      try {
        const [alert] = await db
          .select()
          .from(priceAlerts)
          .where(eq(priceAlerts.id, alertId))
          .limit(1);

        if (!alert?.isActive) return;

        // Search for flights matching this alert
        const results = await searchFlights({
          mode: 'A',
          origin: alert.origin,
          destination: alert.destination,
          departDate: alert.departDateFrom,
          tripType: 'one_way',
          travelers: alert.travelersJson as { adults: number; children: number; infants: number },
          cabinClass: alert.cabinClass as any,
        });

        const bestPrice = results.results[0]?.bestPrice;
        if (!bestPrice) return;

        // Update last checked
        await db
          .update(priceAlerts)
          .set({ lastCheckedAt: new Date(), updatedAt: new Date() })
          .where(eq(priceAlerts.id, alertId));

        // Check if price is at or below target
        if (bestPrice.amount <= alert.targetPriceAmount) {
          const [user] = await db
            .select({ email: users.email, displayName: users.displayName })
            .from(users)
            .where(eq(users.id, alert.userId))
            .limit(1);

          if (user) {
            await sendFareAlertEmail(user.email, user.displayName, {
              origin: alert.origin,
              destination: alert.destination,
              price: bestPrice.formatted,
              targetPrice: `₹${alert.targetPriceAmount.toLocaleString('en-IN')}`,
              deeplink: '#',
            });

            await db
              .update(priceAlerts)
              .set({
                lastAlertSentAt: new Date(),
                triggerCount: alert.triggerCount + 1,
                updatedAt: new Date(),
              })
              .where(eq(priceAlerts.id, alertId));

            logger.info({ alertId, price: bestPrice.amount }, 'Fare alert triggered and email sent');
          }
        }
      } catch (err) {
        logger.error({ err, alertId }, 'Fare alert processing failed');
        throw err; // Re-throw so BullMQ can retry
      }
    },
    {
      connection: createBullMQRedisConnection(),
      concurrency: 5,
    },
  );

  worker.on('completed', (job) => {
    logger.debug({ jobId: job.id }, 'Alert job completed');
  });

  worker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, err }, 'Alert job failed');
  });

  return worker;
}
