import axios from 'axios';
import { randomUUID } from 'crypto';
import { eq, desc } from 'drizzle-orm';
import { env } from '../../config/env';
import { db } from '../../config/database';
import { chatSessions, chatMessages } from '../../db/schema/chat';
import { ExternalServiceError, NotFoundError, ForbiddenError } from '../../shared/errors';
import { logger } from '../../shared/logger';
import type {
  ChatSession,
  ChatMessage,
  SarthiQueryCategory,
  ActionCard,
  TripContext,
} from '../../../../../travel-sarthi-shared-types/src';

// ─── 8 Query Category Classifier ─────────────────────────────────────────────

function classifyQuery(message: string): SarthiQueryCategory {
  const lower = message.toLowerCase();
  if (/flight|book|fare|airline|seat/.test(lower)) return 'flight_advice';
  if (/hotel|stay|accommodation|resort/.test(lower)) return 'hotel_recommendation';
  if (/itinerary|day\s+\d|plan|schedule|visit/.test(lower)) return 'itinerary_question';
  if (/tip|local|food|restaurant|eat|drink/.test(lower)) return 'local_tips';
  if (/budget|cheap|cost|money|spend/.test(lower)) return 'budget_advice';
  if (/delay|cancel|disrupt|miss|stuck/.test(lower)) return 'disruption_help';
  if (/visa|passport|entry|permit/.test(lower)) return 'visa_info';
  return 'general_travel';
}

// ─── Action Card Generator ────────────────────────────────────────────────────

function generateActionCards(category: SarthiQueryCategory, tripContext: TripContext | null): ActionCard[] {
  const cards: ActionCard[] = [];

  switch (category) {
    case 'flight_advice':
      cards.push({ type: 'search_flights', label: 'Search Flights', payload: {}, icon: 'plane' });
      break;
    case 'hotel_recommendation':
      cards.push({ type: 'show_hotels', label: 'Browse Hotels', payload: {}, icon: 'building' });
      break;
    case 'itinerary_question':
      if (tripContext?.activeItineraryId) {
        cards.push({ type: 'view_itinerary', label: 'View Itinerary', payload: { tripId: tripContext.tripId }, icon: 'map' });
      }
      break;
    case 'disruption_help':
      cards.push({ type: 'view_disruption', label: 'See Recovery Options', payload: {}, icon: 'alert' });
      break;
    case 'visa_info':
      cards.push({ type: 'check_visa', label: 'Check Visa Info', payload: {}, icon: 'passport' });
      break;
    case 'budget_advice':
      cards.push({ type: 'view_deals', label: 'View Deals & Coupons', payload: {}, icon: 'tag' });
      break;
  }

  return cards;
}

// ─── System Prompt Builder ────────────────────────────────────────────────────

function buildSystemPrompt(tripContext: TripContext | null): string {
  let prompt = `You are Sarthi, an expert AI travel assistant for Travel Sarthi — India's smartest travel platform.

You help Indian travelers with:
1. Flight advice and booking recommendations
2. Hotel recommendations
3. Itinerary questions and activity suggestions
4. Local tips — food, culture, shopping
5. Budget advice and savings strategies
6. Disruption help — delays, cancellations, re-routing
7. Visa and travel document information
8. General travel guidance

Tone: Friendly, knowledgeable, concise. Use simple language. Include ₹ for prices. Be specific with actionable advice.
Format: Use bullet points for lists. Bold key information. Keep responses under 200 words unless detailed itinerary is requested.`;

  if (tripContext) {
    prompt += `\n\nCurrent Trip Context:
- Destination: ${tripContext.destination}
- Travel Dates: ${tripContext.startDate} to ${tripContext.endDate}
- Travelers: ${tripContext.travelers.adults} adults, ${tripContext.travelers.children} children, ${tripContext.travelers.infants} infants
${tripContext.flightDetails?.flightNumber ? `- Flight: ${tripContext.flightDetails.flightNumber}` : ''}
${tripContext.hotelDetails?.name ? `- Hotel: ${tripContext.hotelDetails.name}` : ''}
${tripContext.disruption ? `- Active Disruption: ${tripContext.disruption.type} (${tripContext.disruption.severity})` : ''}

Respond with knowledge specific to this trip when relevant.`;
  }

  return prompt;
}

// ─── Chat Service ─────────────────────────────────────────────────────────────

export async function sendMessage(
  userId: string,
  sessionId: string | null,
  userMessage: string,
  tripId?: string,
): Promise<{ session: ChatSession; responseMessage: ChatMessage }> {
  let session: typeof chatSessions.$inferSelect | undefined;

  if (sessionId) {
    const [existing] = await db
      .select()
      .from(chatSessions)
      .where(eq(chatSessions.id, sessionId))
      .limit(1);

    if (!existing || existing.userId !== userId) {
      throw new ForbiddenError('Chat session not found or access denied');
    }
    session = existing;
  } else {
    const [created] = await db
      .insert(chatSessions)
      .values({
        userId,
        tripId: tripId ?? null,
        mode: tripId ? 'trip_mode' : 'standalone',
      })
      .returning();
    session = created;
  }

  if (!session) throw new Error('Failed to get or create session');

  // Save user message
  const userMsgId = randomUUID();
  await db.insert(chatMessages).values({
    id: userMsgId,
    sessionId: session.id,
    role: 'user',
    content: userMessage,
    category: null,
    actionCardsJson: [],
    quickRepliesJson: [],
  });

  // Classify query
  const category = classifyQuery(userMessage);
  const tripContext = session.tripContextJson as TripContext | null;

  // Get conversation history (last 10 messages)
  const history = await db
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.sessionId, session.id))
    .orderBy(desc(chatMessages.createdAt))
    .limit(10);

  const conversationHistory = history
    .reverse()
    .slice(0, -1) // exclude the message we just inserted
    .map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

  // Build Gemini request
  const systemPrompt = buildSystemPrompt(tripContext);
  const contents = [
    ...conversationHistory,
    { role: 'user', parts: [{ text: userMessage }] },
  ];

  let responseText = '';
  let tokensUsed = 0;

  try {
    const res = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/${env.GEMINI_MODEL}:generateContent?key=${env.GEMINI_API_KEY}`,
      {
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents,
        generationConfig: {
          temperature: 0.8,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
      },
      { timeout: 15000 },
    );

    const data = res.data as {
      candidates: { content: { parts: { text: string }[] } }[];
      usageMetadata: { totalTokenCount: number };
    };

    responseText = data.candidates[0]?.content.parts[0]?.text ?? 'I apologize, I could not generate a response. Please try again.';
    tokensUsed = data.usageMetadata?.totalTokenCount ?? 0;
  } catch (err) {
    logger.error({ err }, 'Gemini chat API failed');
    responseText = 'I\'m having trouble connecting right now. Please try again in a moment, or contact our support team for immediate assistance.';
  }

  const actionCards = generateActionCards(category, tripContext);
  const quickReplies = getQuickReplies(category);

  // Save assistant response
  const assistantMsgId = randomUUID();
  await db.insert(chatMessages).values({
    id: assistantMsgId,
    sessionId: session.id,
    role: 'assistant',
    content: responseText,
    category,
    actionCardsJson: actionCards,
    quickRepliesJson: quickReplies,
    tokensUsed,
  });

  // Update session timestamp
  await db
    .update(chatSessions)
    .set({ updatedAt: new Date() })
    .where(eq(chatSessions.id, session.id));

  const responseMessage: ChatMessage = {
    id: assistantMsgId,
    sessionId: session.id,
    role: 'assistant',
    content: responseText,
    category,
    actionCards,
    placesMapCard: null,
    quickReplies,
    isTyping: false,
    tokensUsed,
    createdAt: new Date().toISOString(),
  };

  return {
    session: {
      id: session.id,
      userId: session.userId,
      tripContext,
      messages: [],
      isActive: session.isActive,
      mode: session.mode as ChatSession['mode'],
      createdAt: session.createdAt.toISOString(),
      updatedAt: session.updatedAt.toISOString(),
    },
    responseMessage,
  };
}

function getQuickReplies(category: SarthiQueryCategory): string[] {
  const map: Record<SarthiQueryCategory, string[]> = {
    flight_advice: ['Show me cheaper dates', 'Best time to book', 'Direct flights only'],
    hotel_recommendation: ['Budget options', 'Near city center', 'With pool'],
    itinerary_question: ['Add more activities', 'Change pace to relaxed', 'Suggest restaurants'],
    local_tips: ['Best local food', 'Hidden gems', 'Safety tips'],
    budget_advice: ['Apply coupons', 'Find deals', 'Track my spending'],
    disruption_help: ['Show recovery options', 'Know my rights', 'Rebook flight'],
    visa_info: ['Processing time', 'Required documents', 'Visa on arrival'],
    general_travel: ['Plan a trip', 'Search flights', 'Browse destinations'],
  };
  return map[category];
}
