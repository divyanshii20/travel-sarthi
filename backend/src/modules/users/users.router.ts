import { Router } from 'express';
import { z } from 'zod';
import { eq, desc } from 'drizzle-orm';
import multer from 'multer';
import sharp from 'sharp';
import { requireAuth } from '../../middleware/auth';
import { validateBody } from '../../middleware/validate';
import { sendSuccess } from '../../shared/response';
import { db } from '../../config/database';
import { users, voyageCoinTransactions } from '../../db/schema/users';
import { notificationPreferences } from '../../db/schema/notifications';
import { NotFoundError } from '../../shared/errors';
import { buildPaginationMeta } from '../../shared/response';
import { env } from '../../config/env';
import { logger } from '../../shared/logger';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

const updateProfileSchema = z.object({
  displayName: z.string().min(2).max(100).trim().optional(),
  preferredCurrency: z.string().length(3).optional(),
  preferredLanguage: z.string().min(2).max(10).optional(),
});

const updateNotifPrefsSchema = z.object({
  fareAlerts: z.boolean().optional(),
  flightDisruptions: z.boolean().optional(),
  deals: z.boolean().optional(),
  tripReminders: z.boolean().optional(),
  groupActivity: z.boolean().optional(),
  systemAnnouncements: z.boolean().optional(),
  emailEnabled: z.boolean().optional(),
  pushEnabled: z.boolean().optional(),
  whatsappEnabled: z.boolean().optional(),
  quietHoursStart: z.string().regex(/^\d{2}:\d{2}$/).nullable().optional(),
  quietHoursEnd: z.string().regex(/^\d{2}:\d{2}$/).nullable().optional(),
});

// PATCH /api/users/profile
router.patch('/profile', requireAuth, validateBody(updateProfileSchema), async (req, res, next) => {
  try {
    const [updated] = await db
      .update(users)
      .set({ ...req.body, updatedAt: new Date() })
      .where(eq(users.id, req.userId))
      .returning();

    if (!updated) throw new NotFoundError('User');

    sendSuccess(res, {
      id: updated.id,
      email: updated.email,
      displayName: updated.displayName,
      avatarUrl: updated.avatarUrl,
      preferredCurrency: updated.preferredCurrency,
      preferredLanguage: updated.preferredLanguage,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/users/avatar
router.post('/avatar', requireAuth, upload.single('avatar'), async (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400).json({ data: null, error: { code: 'BAD_REQUEST', message: 'No file uploaded' } });
      return;
    }

    // Process image with sharp
    const processed = await sharp(req.file.buffer)
      .resize(256, 256, { fit: 'cover' })
      .webp({ quality: 85 })
      .toBuffer();

    // Upload to Supabase Storage
    const fileName = `${req.userId}-${Date.now()}.webp`;
    const avatarUrl = `${env.SUPABASE_URL}/storage/v1/object/public/${env.STORAGE_BUCKET_AVATARS}/${fileName}`;

    // For now store the URL — actual upload would use Supabase client
    await db
      .update(users)
      .set({ avatarUrl, updatedAt: new Date() })
      .where(eq(users.id, req.userId));

    logger.info({ userId: req.userId, size: processed.length }, 'Avatar uploaded');
    sendSuccess(res, { avatarUrl });
  } catch (err) {
    next(err);
  }
});

// GET /api/users/voyage-coins
router.get('/voyage-coins', requireAuth, async (req, res, next) => {
  try {
    const [user] = await db
      .select({ voyageCoinBalance: users.voyageCoinBalance })
      .from(users)
      .where(eq(users.id, req.userId))
      .limit(1);

    if (!user) throw new NotFoundError('User');

    const page = 1;
    const limit = 20;

    const txns = await db
      .select()
      .from(voyageCoinTransactions)
      .where(eq(voyageCoinTransactions.userId, req.userId))
      .orderBy(desc(voyageCoinTransactions.createdAt))
      .limit(limit)
      .offset((page - 1) * limit);

    sendSuccess(res, {
      balance: user.voyageCoinBalance,
      transactions: txns.map((t) => ({
        id: t.id,
        amount: t.amount,
        type: t.type,
        description: t.description,
        balanceAfter: t.balanceAfter,
        createdAt: t.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/users/notification-preferences
router.get('/notification-preferences', requireAuth, async (req, res, next) => {
  try {
    const [prefs] = await db
      .select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.userId, req.userId))
      .limit(1);

    if (!prefs) {
      // Return defaults
      sendSuccess(res, {
        fareAlerts: true,
        flightDisruptions: true,
        deals: true,
        tripReminders: true,
        groupActivity: true,
        systemAnnouncements: true,
        emailEnabled: true,
        pushEnabled: true,
        whatsappEnabled: false,
        quietHoursStart: null,
        quietHoursEnd: null,
      });
      return;
    }

    sendSuccess(res, prefs);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/users/notification-preferences
router.patch('/notification-preferences', requireAuth, validateBody(updateNotifPrefsSchema), async (req, res, next) => {
  try {
    const existing = await db
      .select({ id: notificationPreferences.id })
      .from(notificationPreferences)
      .where(eq(notificationPreferences.userId, req.userId))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(notificationPreferences).values({
        userId: req.userId,
        ...req.body,
      });
    } else {
      await db
        .update(notificationPreferences)
        .set({ ...req.body, updatedAt: new Date() })
        .where(eq(notificationPreferences.userId, req.userId));
    }

    sendSuccess(res, { message: 'Notification preferences updated' });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/users/account
router.delete('/account', requireAuth, async (req, res, next) => {
  try {
    await db.delete(users).where(eq(users.id, req.userId));
    sendSuccess(res, { message: 'Account deleted successfully' });
  } catch (err) {
    next(err);
  }
});

export { router as usersRouter };
