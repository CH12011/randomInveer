import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Message } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { formatTime } from "@/lib/time-utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface MessageListPanelProps {
  messages: Message[];
  onReply: (message: Message) => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function MessageListPanel({ messages, onReply, isOpen, onClose }: MessageListPanelProps) {
  const isMobile = useIsMobile();
  const [sortedMessages, setSortedMessages] = useState<Message[]>([]);

  useEffect(() => {
    // Sort messages by timestamp in descending order (newest first)
    const sorted = [...messages].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    setSortedMessages(sorted);
  }, [messages]);

  const panelClasses = isMobile 
    ? "inset-0 z-50" 
    : "top-0 bottom-0 right-0 w-80 z-50";

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop overlay for mobile */}
          {isMobile && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40"
              onClick={onClose}
            />
          )}
          
          {/* Panel */}
          <motion.div
            initial={isMobile ? { y: "100%" } : { x: "100%" }}
            animate={isMobile ? { y: 0 } : { x: 0 }}
            exit={isMobile ? { y: "100%" } : { x: "100%" }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className={`fixed ${panelClasses} glass-dark border-l border-white/10`}
          >
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <h2 className="text-lg font-medium text-white">История сообщений</h2>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={onClose}
                  className="text-white hover:text-white/80 hover:bg-transparent"
                >
                  <i className="ri-close-line text-xl"></i>
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto">
                {sortedMessages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    Нет сообщений
                  </div>
                ) : (
                  <div className="p-4 space-y-3">
                    {sortedMessages.map((message) => (
                      <div 
                        key={message.id} 
                        className="p-3 rounded-lg bg-black/20 border border-white/5 hover:border-white/20 cursor-pointer transition-colors"
                        onClick={() => {
                          onReply(message);
                          if (isMobile) onClose();
                        }}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-white">{message.senderName}</span>
                          <span className="text-xs text-gray-400">{formatTime(message.timestamp)}</span>
                        </div>
                        <p className="text-sm text-white line-clamp-2">{message.content}</p>
                        
                        {message.fileName && (
                          <div className="mt-2 flex items-center text-xs text-gray-300">
                            <i className="ri-attachment-2 mr-1"></i>
                            <span className="truncate">{message.fileName}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}