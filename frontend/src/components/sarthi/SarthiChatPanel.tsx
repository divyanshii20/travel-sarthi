import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send } from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import { useChat } from '@/hooks/useChat';
import { ChatMessageBubble } from './ChatMessageBubble';
import { Spinner } from '@/components/ui/Spinner';
import { slideInRight } from '@/lib/animations';

const QUICK_REPLIES = [
  'Find cheap flights to Goa',
  'Best time to visit Kerala',
  'Budget trip from Delhi',
  'Plan 5 days in Rajasthan',
];

export function SarthiChatPanel() {
  const { isSarthiOpen } = useUIStore();
  const { messages, isLoading, error, sendMessage } = useChat();
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (text.length === 0 || isLoading) return;
    setInput('');
    await sendMessage(text);
  };

  return (
    <AnimatePresence>
      {isSarthiOpen && (
        <motion.div
          className="fixed bottom-24 right-6 z-40 w-[340px] sm:w-[380px] bg-white rounded-2xl shadow-xl flex flex-col overflow-hidden border border-card"
          style={{ height: '520px' }}
          variants={slideInRight}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {/* Header */}
          <div
            className="px-5 py-4 text-white flex items-center gap-3"
            style={{ background: 'linear-gradient(135deg, var(--color-teal), #0EA5A0)' }}
          >
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm">
              S
            </div>
            <div>
              <p className="font-display font-bold">Sarthi AI</p>
              <p className="text-xs text-white/70">Your travel intelligence assistant</p>
            </div>
            <div className="ml-auto flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-400" />
              <span className="text-xs text-white/70">Online</span>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
            {messages.length === 0 && (
              <div className="text-center py-6">
                <p className="text-2xl mb-2">🧭</p>
                <p className="text-sm font-semibold text-primary">Hi! I'm Sarthi</p>
                <p className="text-xs text-muted mt-1">Ask me anything about travel planning, flights, or deals</p>
              </div>
            )}
            {messages.map((msg) => (
              <ChatMessageBubble key={msg.id} message={msg} />
            ))}
            {isLoading && (
              <div className="flex items-center gap-2 pl-9">
                <Spinner size="sm" color="border-teal" />
                <span className="text-xs text-muted">Sarthi is thinking…</span>
              </div>
            )}
            {error != null && (
              <p className="text-xs text-red-500 text-center">{error}</p>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick replies */}
          {messages.length === 0 && (
            <div className="px-4 pb-2 flex gap-2 overflow-x-auto scrollbar-hide">
              {QUICK_REPLIES.map((qr) => (
                <button
                  key={qr}
                  onClick={() => void sendMessage(qr)}
                  className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full bg-teal-50 text-teal border border-teal-100 hover:bg-teal-100 transition-colors"
                >
                  {qr}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="px-4 py-3 border-t border-card flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') void handleSend(); }}
              placeholder="Ask Sarthi anything…"
              className="flex-1 bg-card rounded-xl px-4 py-2.5 text-sm outline-none border border-transparent focus:border-saffron transition-colors"
            />
            <button
              onClick={() => void handleSend()}
              disabled={isLoading || input.trim().length === 0}
              className="w-10 h-10 rounded-xl bg-saffron text-white flex items-center justify-center disabled:opacity-50 transition-opacity hover:bg-saffron-600"
            >
              <Send size={16} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
