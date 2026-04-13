import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../../middleware/auth';
import { validateBody } from '../../middleware/validate';
import { aiRateLimiter } from '../../middleware/rateLimiter';
import { sendSuccess } from '../../shared/response';
import { sendMessage } from './chat.service';

const router = Router();

const sendMessageSchema = z.object({
  sessionId: z.string().uuid().nullable().default(null),
  message: z.string().min(1).max(2000).trim(),
  tripId: z.string().uuid().optional(),
});

// POST /api/chat/send
router.post('/send', requireAuth, aiRateLimiter, validateBody(sendMessageSchema), async (req, res, next) => {
  try {
    const { sessionId, message, tripId } = req.body as z.infer<typeof sendMessageSchema>;
    const result = await sendMessage(req.userId, sessionId, message, tripId);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
});

// GET /api/chat/sessions
router.get('/sessions', requireAuth, async (req, res, next) => {
  try {
    const { eq, desc } = await import('drizzle-orm');
    const { db } = await import('../../config/database');
    const { chatSessions } = await import('../../db/schema/chat');

    const sessions = await db
      .select()
      .from(chatSessions)
      .where(eq(chatSessions.userId, req.userId))
      .orderBy(desc(chatSessions.updatedAt))
      .limit(20);

    sendSuccess(res, sessions.map((s) => ({
      id: s.id,
      mode: s.mode,
      tripId: s.tripId,
      isActive: s.isActive,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    })));
  } catch (err) {
    next(err);
  }
});

// GET /api/chat/sessions/:id/messages
router.get('/sessions/:id/messages', requireAuth, async (req, res, next) => {
  try {
    const { eq, asc } = await import('drizzle-orm');
    const { db } = await import('../../config/database');
    const { chatSessions, chatMessages } = await import('../../db/schema/chat');

    const [session] = await db
      .select({ userId: chatSessions.userId })
      .from(chatSessions)
      .where(eq(chatSessions.id, req.params['id'] ?? ''))
      .limit(1);

    if (!session || session.userId !== req.userId) {
      res.status(404).json({ data: null, error: { code: 'NOT_FOUND', message: 'Session not found' } });
      return;
    }

    const messages = await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.sessionId, req.params['id'] ?? ''))
      .orderBy(asc(chatMessages.createdAt))
      .limit(100);

    sendSuccess(res, messages.map((m) => ({
      id: m.id,
      sessionId: m.sessionId,
      role: m.role,
      content: m.content,
      category: m.category,
      actionCards: m.actionCardsJson,
      placesMapCard: m.placesMapCardJson,
      quickReplies: m.quickRepliesJson,
      tokensUsed: m.tokensUsed,
      createdAt: m.createdAt.toISOString(),
    })));
  } catch (err) {
    next(err);
  }
});

export { router as chatRouter };
