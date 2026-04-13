import { Router } from 'express';
import { z } from 'zod';
import { eq, desc, and, or } from 'drizzle-orm';
import { randomBytes } from 'crypto';
import { requireAuth, optionalAuth } from '../../middleware/auth';
import { validateBody, validateParams } from '../../middleware/validate';
import { sendSuccess, buildPaginationMeta } from '../../shared/response';
import { db } from '../../config/database';
import { trips, tripMembers } from '../../db/schema/trips';
import { NotFoundError, ForbiddenError } from '../../shared/errors';

const router = Router();

const createTripSchema = z.object({
  title: z.string().min(2).max(255),
  destination: z.string().min(2).max(255),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  travelers: z.object({
    adults: z.number().int().min(1),
    children: z.number().int().min(0).default(0),
    infants: z.number().int().min(0).default(0),
  }),
  comfortLevel: z.enum(['budget', 'comfort', 'luxury']).default('comfort'),
  totalBudget: z.number().positive(),
  currency: z.string().length(3).default('INR'),
  isGroupTrip: z.boolean().default(false),
  notes: z.string().max(2000).optional(),
  tags: z.array(z.string().max(50)).max(10).default([]),
});

const updateTripSchema = createTripSchema.partial().extend({
  status: z.enum(['planning', 'booked', 'confirmed', 'in_progress', 'completed', 'cancelled']).optional(),
  visibility: z.enum(['private', 'link_share', 'public']).optional(),
  coverImageUrl: z.string().url().optional(),
});

const idParamSchema = z.object({ id: z.string().uuid() });

// GET /api/trips
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query['page'] as string ?? '1'));
    const limit = Math.min(50, parseInt(req.query['limit'] as string ?? '10'));
    const offset = (page - 1) * limit;

    const userTrips = await db
      .select()
      .from(trips)
      .where(eq(trips.userId, req.userId))
      .orderBy(desc(trips.updatedAt))
      .limit(limit)
      .offset(offset);

    const total = userTrips.length;

    sendSuccess(res, userTrips.map(formatTrip), 200, buildPaginationMeta(total, page, limit));
  } catch (err) {
    next(err);
  }
});

// POST /api/trips
router.post('/', requireAuth, validateBody(createTripSchema), async (req, res, next) => {
  try {
    const body = req.body as z.infer<typeof createTripSchema>;

    const [trip] = await db
      .insert(trips)
      .values({
        userId: req.userId,
        title: body.title,
        destination: body.destination,
        startDate: body.startDate,
        endDate: body.endDate,
        travelersJson: body.travelers,
        comfortLevel: body.comfortLevel,
        totalBudgetAmount: body.totalBudget,
        totalBudgetCurrency: body.currency,
        isGroupTrip: body.isGroupTrip,
        notes: body.notes,
        tags: body.tags,
      })
      .returning();

    if (!trip) throw new Error('Failed to create trip');

    if (body.isGroupTrip) {
      await db.insert(tripMembers).values({
        tripId: trip.id,
        userId: req.userId,
        role: 'owner',
      });
    }

    sendSuccess(res, formatTrip(trip), 201);
  } catch (err) {
    next(err);
  }
});

// GET /api/trips/:id
router.get('/:id', optionalAuth, validateParams(idParamSchema), async (req, res, next) => {
  try {
    const [trip] = await db
      .select()
      .from(trips)
      .where(eq(trips.id, req.params['id'] ?? ''))
      .limit(1);

    if (!trip) throw new NotFoundError('Trip');

    const isOwner = trip.userId === req.userId;
    const isLinkShare = trip.visibility === 'link_share';
    const isPublic = trip.visibility === 'public';

    if (!isOwner && !isLinkShare && !isPublic) {
      throw new ForbiddenError('Access denied to this trip');
    }

    sendSuccess(res, formatTrip(trip));
  } catch (err) {
    next(err);
  }
});

// PATCH /api/trips/:id
router.patch('/:id', requireAuth, validateParams(idParamSchema), validateBody(updateTripSchema), async (req, res, next) => {
  try {
    const [existing] = await db
      .select({ userId: trips.userId })
      .from(trips)
      .where(eq(trips.id, req.params['id'] ?? ''))
      .limit(1);

    if (!existing) throw new NotFoundError('Trip');
    if (existing.userId !== req.userId) throw new ForbiddenError('Access denied');

    const body = req.body as z.infer<typeof updateTripSchema>;
    const updateData: Partial<typeof trips.$inferInsert> = {};

    if (body.title !== undefined) updateData.title = body.title;
    if (body.destination !== undefined) updateData.destination = body.destination;
    if (body.startDate !== undefined) updateData.startDate = body.startDate;
    if (body.endDate !== undefined) updateData.endDate = body.endDate;
    if (body.travelers !== undefined) updateData.travelersJson = body.travelers;
    if (body.comfortLevel !== undefined) updateData.comfortLevel = body.comfortLevel;
    if (body.totalBudget !== undefined) updateData.totalBudgetAmount = body.totalBudget;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.visibility !== undefined) updateData.visibility = body.visibility;
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.tags !== undefined) updateData.tags = body.tags;
    if (body.coverImageUrl !== undefined) updateData.coverImageUrl = body.coverImageUrl;

    updateData.updatedAt = new Date();

    const [updated] = await db
      .update(trips)
      .set(updateData)
      .where(eq(trips.id, req.params['id'] ?? ''))
      .returning();

    sendSuccess(res, formatTrip(updated!));
  } catch (err) {
    next(err);
  }
});

// DELETE /api/trips/:id
router.delete('/:id', requireAuth, validateParams(idParamSchema), async (req, res, next) => {
  try {
    const [existing] = await db
      .select({ userId: trips.userId })
      .from(trips)
      .where(eq(trips.id, req.params['id'] ?? ''))
      .limit(1);

    if (!existing) throw new NotFoundError('Trip');
    if (existing.userId !== req.userId) throw new ForbiddenError('Access denied');

    await db.delete(trips).where(eq(trips.id, req.params['id'] ?? ''));
    sendSuccess(res, { message: 'Trip deleted' });
  } catch (err) {
    next(err);
  }
});

// POST /api/trips/:id/share
router.post('/:id/share', requireAuth, validateParams(idParamSchema), async (req, res, next) => {
  try {
    const shareToken = randomBytes(32).toString('hex');

    await db
      .update(trips)
      .set({ shareToken, visibility: 'link_share', updatedAt: new Date() })
      .where(and(eq(trips.id, req.params['id'] ?? ''), eq(trips.userId, req.userId)));

    sendSuccess(res, { shareToken, shareUrl: `${process.env['CORS_ORIGIN']}/trips/shared/${shareToken}` });
  } catch (err) {
    next(err);
  }
});

function formatTrip(trip: typeof trips.$inferSelect) {
  return {
    id: trip.id,
    userId: trip.userId,
    title: trip.title,
    destination: trip.destination,
    destinationCode: trip.destinationCode,
    coverImageUrl: trip.coverImageUrl,
    status: trip.status,
    visibility: trip.visibility,
    shareToken: trip.shareToken,
    startDate: trip.startDate,
    endDate: trip.endDate,
    travelers: trip.travelersJson,
    comfortLevel: trip.comfortLevel,
    totalBudget: { amount: trip.totalBudgetAmount, currency: trip.totalBudgetCurrency, formatted: `₹${trip.totalBudgetAmount.toLocaleString('en-IN')}` },
    totalSpent: { amount: trip.totalSpentAmount, currency: trip.totalBudgetCurrency, formatted: `₹${trip.totalSpentAmount.toLocaleString('en-IN')}` },
    totalSavings: { amount: trip.totalSavingsAmount, currency: trip.totalBudgetCurrency, formatted: `₹${trip.totalSavingsAmount.toLocaleString('en-IN')}` },
    isGroupTrip: trip.isGroupTrip,
    notes: trip.notes,
    tags: trip.tags,
    createdAt: trip.createdAt.toISOString(),
    updatedAt: trip.updatedAt.toISOString(),
  };
}

export { router as tripsRouter };
