import { useState, useCallback } from 'react';
import { chatService } from '@/services/chat.service';
import type { ChatMessage, TripContext } from 'travel-sarthi-shared-types';

export function useChat(sessionId?: string, tripContext?: TripContext) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(sessionId ?? null);

  const sendMessage = useCallback(
    async (content: string) => {
      setIsLoading(true);
      setError(null);

      const optimisticId = `optimistic-${Date.now()}`;

      const optimistic: ChatMessage = {
        id: optimisticId,
        sessionId: activeSessionId ?? '',
        role: 'user',
        content,
        category: null,
        actionCards: [],
        placesMapCard: null,
        quickReplies: [],
        isTyping: false,
        tokensUsed: null,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, optimistic]);

      try {
        const res = await chatService.sendMessage({
          message: content,
          sessionId: activeSessionId,
          ...(tripContext !== undefined && tripContext.tripId != null ? { tripId: tripContext.tripId } : {}),
        });

        if (res.error != null) {
          setError(res.error.message);
          setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
          return;
        }

        const assistantMsg = res.data.responseMessage;
        if (activeSessionId === null) {
          setActiveSessionId(res.data.session.id);
        }
        setMessages((prev) => [
          ...prev.filter((m) => m.id !== optimisticId),
          res.data.message,
          assistantMsg,
        ]);
      } catch {
        setError('Failed to send message. Please try again.');
        setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
      } finally {
        setIsLoading(false);
      }
    },
    [activeSessionId, tripContext]
  );

  const loadMessages = useCallback(async (sid: string) => {
    const res = await chatService.getSessionMessages(sid);
    if (res.data != null) {
      setMessages(res.data);
      setActiveSessionId(sid);
    }
  }, []);

  return { messages, isLoading, error, sendMessage, loadMessages, sessionId: activeSessionId };
}
