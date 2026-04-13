import { Router } from 'express';
import { z } from 'zod';
import { eq, and, desc } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { requireAuth } from '../../middleware/auth';
import { validateBody, validateParams } from '../../middleware/validate';
import { sendSuccess } from '../../shared/response';
import { db } from '../../config/database';
import { groupVotes, groupExpenses } from '../../db/schema/group';
import { trips } from '../../db/schema/trips';
import { NotFoundError, ForbiddenError } from '../../shared/errors';
import type { Request, Response, NextFunction } from 'express';

const router = Router();

const tripParamSchema = z.object({ tripId: z.string().uuid() });

const createVoteSchema = z.object({
  title: z.string().min(2).max(255),
  description: z.string().max(1000).optional(),
  type: z.enum(['destination', 'date_range', 'hotel', 'activity', 'flight', 'custom']),
  options: z.array(z.object({
    label: z.string().min(1).max(255),
    description: z.string().max(500).optional(),
    imageUrl: z.string().url().optional(),
    metadata: z.record(z.unknown()).optional(),
  })).min(2).max(10),
  deadline: z.string().datetime().optional(),
  allowMultiple: z.boolean().default(false),
  anonymousVoting: z.boolean().default(false),
});

const createExpenseSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().max(500).optional(),
  category: z.enum(['accommodation', 'food', 'transport', 'activities', 'shopping', 'flights', 'miscellaneous']),
  amount: z.number().positive(),
  currency: z.string().length(3).default('INR'),
  paidBy: z.string().uuid(),
  splitMethod: z.enum(['equal', 'custom', 'by_consumption', 'percentage']).default('equal'),
  splits: z.array(z.object({
    userId: z.string().uuid(),
    amount: z.number().positive().optional(),
    percentage: z.number().min(0).max(100).optional(),
  })).optional(),
  receiptUrl: z.string().url().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

// GET /api/group/:tripId/votes
router.get('/:tripId/votes', requireAuth, validateParams(tripParamSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const votes = await db
      .select()
      .from(groupVotes)
      .where(eq(groupVotes.tripId, req.params['tripId'] ?? ''))
      .orderBy(desc(groupVotes.createdAt));

    sendSuccess(res, votes.map(formatVote));
  } catch (err) {
    next(err);
  }
});

// POST /api/group/:tripId/votes
router.post('/:tripId/votes', requireAuth, validateParams(tripParamSchema), validateBody(createVoteSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = req.body as z.infer<typeof createVoteSchema>;

    const optionsWithIds = body.options.map((opt) => ({
      id: randomUUID(),
      label: opt.label,
      description: opt.description ?? null,
      imageUrl: opt.imageUrl ?? null,
      metadata: opt.metadata ?? {},
      votes: [],
      voteCount: 0,
    }));

    const [vote] = await db
      .insert(groupVotes)
      .values({
        tripId: req.params['tripId'] ?? '',
        createdBy: req.userId,
        title: body.title,
        description: body.description,
        type: body.type,
        optionsJson: optionsWithIds,
        deadline: body.deadline ? new Date(body.deadline) : null,
        allowMultiple: body.allowMultiple,
        anonymousVoting: body.anonymousVoting,
      })
      .returning();

    sendSuccess(res, formatVote(vote!), 201);
  } catch (err) {
    next(err);
  }
});

// POST /api/group/:tripId/votes/:voteId/cast
router.post(
  '/:tripId/votes/:voteId/cast',
  requireAuth,
  validateBody(z.object({ optionIds: z.array(z.string().uuid()).min(1) })),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const [vote] = await db
        .select()
        .from(groupVotes)
        .where(and(
          eq(groupVotes.id, req.params['voteId'] ?? ''),
          eq(groupVotes.tripId, req.params['tripId'] ?? ''),
        ))
        .limit(1);

      if (!vote) throw new NotFoundError('Vote');
      if (vote.status !== 'open') throw new ForbiddenError('Vote is closed');

      const options = vote.optionsJson as {
        id: string; label: string; votes: string[]; voteCount: number;
        description: string | null; imageUrl: string | null; metadata: Record<string, unknown>;
      }[];

      const { optionIds } = req.body as { optionIds: string[] };

      const updatedOptions = options.map((opt) => {
        if (!optionIds.includes(opt.id)) return opt;
        const alreadyVoted = opt.votes.includes(req.userId);
        const newVotes = alreadyVoted ? opt.votes.filter((v) => v !== req.userId) : [...opt.votes, req.userId];
        return { ...opt, votes: newVotes, voteCount: newVotes.length };
      });

      await db
        .update(groupVotes)
        .set({ optionsJson: updatedOptions })
        .where(eq(groupVotes.id, req.params['voteId'] ?? ''));

      sendSuccess(res, { message: 'Vote cast successfully' });
    } catch (err) {
      next(err);
    }
  },
);

// GET /api/group/:tripId/expenses
router.get('/:tripId/expenses', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const expenses = await db
      .select()
      .from(groupExpenses)
      .where(eq(groupExpenses.tripId, req.params['tripId'] ?? ''))
      .orderBy(desc(groupExpenses.createdAt));

    // Calculate settlement balances
    const settlements = calculateSettlements(expenses);

    sendSuccess(res, {
      expenses: expenses.map(formatExpense),
      settlement: settlements,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/group/:tripId/expenses
router.post('/:tripId/expenses', requireAuth, validateParams(tripParamSchema), validateBody(createExpenseSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = req.body as z.infer<typeof createExpenseSchema>;

    // Calculate splits if not provided
    let splits = body.splits ?? [];
    if (splits.length === 0 || body.splitMethod === 'equal') {
      // Get all trip members and split equally
      const members = await db
        .select()
        .from((await import('../../db/schema/trips')).tripMembers)
        .where(eq((await import('../../db/schema/trips')).tripMembers.tripId, req.params['tripId'] ?? ''));

      const perPerson = body.amount / Math.max(members.length, 1);
      splits = members.map((m) => ({ userId: m.userId, amount: perPerson, percentage: 100 / members.length }));
    }

    const [expense] = await db
      .insert(groupExpenses)
      .values({
        tripId: req.params['tripId'] ?? '',
        paidBy: body.paidBy,
        title: body.title,
        description: body.description,
        category: body.category,
        amountValue: body.amount,
        amountCurrency: body.currency,
        splitsJson: splits,
        splitMethod: body.splitMethod,
        receiptUrl: body.receiptUrl,
        date: body.date,
      })
      .returning();

    sendSuccess(res, formatExpense(expense!), 201);
  } catch (err) {
    next(err);
  }
});

function calculateSettlements(expenses: (typeof groupExpenses.$inferSelect)[]) {
  const balances: Record<string, number> = {};

  for (const expense of expenses) {
    if (expense.isSettled) continue;

    const splits = expense.splitsJson as { userId: string; amount: number }[];
    const paidBy = expense.paidBy;

    balances[paidBy] = (balances[paidBy] ?? 0) + expense.amountValue;
    for (const split of splits) {
      balances[split.userId] = (balances[split.userId] ?? 0) - split.amount;
    }
  }

  const totalExpenses = expenses.reduce((sum, e) => sum + (e.isSettled ? 0 : e.amountValue), 0);

  return {
    totalExpenses: { amount: totalExpenses, currency: 'INR', formatted: `₹${totalExpenses.toLocaleString('en-IN')}` },
    perPersonShare: { amount: 0, currency: 'INR', formatted: '₹0' },
    balances: Object.entries(balances)
      .filter(([, amount]) => Math.abs(amount) > 1)
      .map(([userId, amount]) => ({
        fromUserId: amount < 0 ? userId : '',
        fromUserName: userId,
        toUserId: amount > 0 ? userId : '',
        toUserName: userId,
        amount: { amount: Math.abs(amount), currency: 'INR', formatted: `₹${Math.abs(amount).toLocaleString('en-IN')}` },
        isSettled: false,
      })),
    settledAt: null,
  };
}

function formatVote(v: typeof groupVotes.$inferSelect) {
  return {
    id: v.id,
    tripId: v.tripId,
    createdBy: v.createdBy,
    title: v.title,
    description: v.description,
    type: v.type,
    options: v.optionsJson,
    status: v.status,
    decidedOptionId: v.decidedOptionId,
    deadline: v.deadline?.toISOString() ?? null,
    allowMultiple: v.allowMultiple,
    anonymousVoting: v.anonymousVoting,
    createdAt: v.createdAt.toISOString(),
    closedAt: v.closedAt?.toISOString() ?? null,
  };
}

function formatExpense(e: typeof groupExpenses.$inferSelect) {
  return {
    id: e.id,
    tripId: e.tripId,
    paidBy: e.paidBy,
    title: e.title,
    description: e.description,
    category: e.category,
    amount: { amount: e.amountValue, currency: e.amountCurrency, formatted: `₹${e.amountValue.toLocaleString('en-IN')}` },
    splits: e.splitsJson,
    splitMethod: e.splitMethod,
    receiptUrl: e.receiptUrl,
    date: e.date,
    isSettled: e.isSettled,
    createdAt: e.createdAt.toISOString(),
  };
}

export { router as groupRouter };
