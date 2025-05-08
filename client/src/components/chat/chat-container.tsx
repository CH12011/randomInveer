import { useState } from "react";
import MessageDisplay from "./message-display";
import ChatControls from "./chat-controls";
import { Message } from "@shared/schema";
import { AnimatePresence, motion } from "framer-motion";
import { formatTime } from "@/lib/time-utils";
import { useWebSocket } from "@/hooks/use-websocket";

interface ChatContainerProps {
  connected: boolean;
  messages: Message[];
  sendMessage: (message: any) => Promise<boolean> | boolean;
  highlightedMessage?: Message | null;
}

export default function ChatContainer({ connected, messages, sendMessage, highlightedMessage }: ChatContainerProps) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const { uploadFile } = useWebSocket();
  
  // Если есть выделенное сообщение, показываем его, иначе показываем последнее сообщение
  const messageToDisplay = highlightedMessage || (messages.length > 0 ? messages[messages.length - 1] : null);
  
  // Генерируем псевдо-IP с первыми 4 цифрами и большими точками
  const generateIpName = () => {
    const randomIP = Math.floor(1000 + Math.random() * 9000);
    return `${randomIP}∙∙∙∙`;
  };

  // Ограничим длину сообщения
  const MAX_MESSAGE_LENGTH = 500;
  
  const handleSendMessage = (content: string, file?: File | null) => {
    if (!content.trim() && !file) return false;
    
    // Обрезаем сообщение до максимальной длины
    let trimmedContent = content.trim();
    if (trimmedContent.length > MAX_MESSAGE_LENGTH) {
      trimmedContent = trimmedContent.substring(0, MAX_MESSAGE_LENGTH);
    }
    
    const messageData = {
      content: trimmedContent,
      senderName: generateIpName(), // IP-формат имени
      timestamp: new Date(), // Передаем объект Date вместо строки
      replyToId: replyingTo?.id || null,
      replyToContent: replyingTo?.content || null,
      replyToSender: replyingTo?.senderName || null,
    };
    
    // Reset replying state
    setReplyingTo(null);
    
    // If there's a file, send it with the message
    if (file) {
      console.log("Отправка сообщения с файлом:", file.name);
      uploadFile(file, messageData);
      return true;
    }
    
    // Send the message without a file
    return sendMessage(messageData);
  };
  
  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
  };
  
  const handleReply = (message: Message) => {
    setReplyingTo(message);
    setIsChatOpen(true);
  };

  return (
    <div className="relative z-10 w-full h-screen flex flex-col items-center justify-end pb-24 px-4">
      <AnimatePresence>
        {messageToDisplay && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="mb-4"
          >
            <MessageDisplay 
              message={messageToDisplay} 
              onReply={handleReply}
              isHighlighted={!!highlightedMessage && highlightedMessage.id === messageToDisplay.id}
            />
          </motion.div>
        )}
      </AnimatePresence>
      
      <ChatControls 
        isOpen={isChatOpen}
        toggleChat={toggleChat}
        onSendMessage={handleSendMessage}
        replyingTo={replyingTo}
        onCancelReply={() => setReplyingTo(null)}
        connected={connected}
        messages={messages}
        onReply={handleReply}
      />
    </div>
  );
}
