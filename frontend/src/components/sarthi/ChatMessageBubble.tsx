import { motion } from 'framer-motion';
import type { ChatMessage } from 'travel-sarthi-shared-types';

interface ChatMessageBubbleProps {
  message: ChatMessage;
}

export function ChatMessageBubble({ message }: ChatMessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <motion.div
      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-teal to-teal-600 flex items-center justify-center text-white text-xs font-bold mr-2 mt-1 shrink-0">
          S
        </div>
      )}
      <div
        className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
          isUser
            ? 'bg-saffron text-white rounded-br-sm'
            : 'bg-card text-primary rounded-bl-sm'
        }`}
      >
        {message.content}
      </div>
    </motion.div>
  );
}
