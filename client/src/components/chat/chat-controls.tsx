import { useState, useRef, ChangeEvent, KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Message } from "@shared/schema";
import { AnimatePresence, motion } from "framer-motion";
import { formatFileSize } from "@/lib/utils";
import MessageListPanel from "./message-list-panel";

interface ChatControlsProps {
  isOpen: boolean;
  toggleChat: () => void;
  onSendMessage: (content: string, file?: File | null) => boolean | Promise<boolean> | undefined;
  replyingTo: Message | null;
  onCancelReply: () => void;
  connected: boolean;
  messages: Message[];
  onReply: (message: Message) => void;
}

export default function ChatControls({
  isOpen,
  toggleChat,
  onSendMessage,
  replyingTo,
  onCancelReply,
  connected,
  messages,
  onReply
}: ChatControlsProps) {
  const [message, setMessage] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [messageListOpen, setMessageListOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = async () => {
    try {
      const result = await Promise.resolve(onSendMessage(message, attachment));
      if (result) {
        setMessage("");
        setAttachment(null);
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAttachment(e.target.files[0]);
    }
  };

  const handleAttachmentClick = () => {
    fileInputRef.current?.click();
  };

  const removeAttachment = () => {
    setAttachment(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="fixed bottom-16 left-0 right-0 flex flex-col items-center justify-center z-20">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            className="glass-dark rounded-full max-w-md w-full mx-auto mb-4 relative"
          >
            <div className="flex items-center p-1">
              {/* Attachment button */}
              <button
                onClick={handleAttachmentClick}
                className="p-2 text-white hover:text-white/80 transition-colors"
                aria-label="Add attachment"
              >
                <i className="ri-attachment-2 text-lg"></i>
              </button>

              {/* Hidden file input */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
              />

              {/* Text input */}
              <Input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                className="bg-transparent border-0 flex-1 text-white placeholder-gray-400 focus-visible:ring-0 focus-visible:ring-offset-0"
                placeholder="Type a message..."
                disabled={false}
              />

              {/* Reply indicator */}
              {replyingTo && (
                <div className="absolute -top-8 left-0 right-0 glass-dark rounded-t-xl py-1 px-3 text-xs flex items-center">
                  <span className="text-blue-300 mr-1">Replying to:</span>
                  <span className="truncate text-gray-300">{replyingTo.content}</span>
                  <button
                    onClick={onCancelReply}
                    className="ml-auto text-gray-400 hover:text-white p-1"
                  >
                    <i className="ri-close-line text-lg"></i>
                  </button>
                </div>
              )}

              {/* Attachment preview */}
              {attachment && (
                <div className="absolute -top-24 left-0 right-0 glass-dark rounded-t-xl p-2 flex items-center">
                  <div className="w-16 h-16 bg-gray-700 rounded-md overflow-hidden flex items-center justify-center mr-2">
                    {attachment.type.startsWith("image/") ? (
                      <img
                        src={URL.createObjectURL(attachment)}
                        alt="Attachment preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <i className="ri-file-line text-2xl text-white"></i>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-white truncate">{attachment.name}</p>
                    <p className="text-xs text-gray-400">{formatFileSize(attachment.size)}</p>
                  </div>
                  <button
                    onClick={removeAttachment}
                    className="p-1 text-gray-400 hover:text-white"
                  >
                    <i className="ri-close-circle-line text-lg"></i>
                  </button>
                </div>
              )}

              {/* Send button */}
              <Button
                onClick={handleSend}
                variant="ghost"
                size="icon"
                className="text-white hover:text-white/80 hover:bg-transparent"
                disabled={!message.trim() && !attachment}
              >
                <i className="ri-send-plane-fill text-lg"></i>
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Message list panel */}
      <MessageListPanel 
        messages={messages} 
        onReply={onReply} 
        isOpen={messageListOpen} 
        onClose={() => setMessageListOpen(false)} 
      />

      {/* Buttons container */}
      <div className="flex items-center space-x-4">
        {/* Message List button */}
        <Button
          onClick={() => setMessageListOpen(true)}
          size="icon"
          className="w-12 h-12 rounded-full glass-button"
        >
          <i className="ri-history-line text-white text-xl"></i>
        </Button>

        {/* Chat toggle button */}
        <Button
          onClick={toggleChat}
          size="icon"
          className="w-12 h-12 rounded-full glass-button"
        >
          <i className={`ri-${isOpen ? 'close' : 'chat-3'}-line text-white text-xl`}></i>
        </Button>
      </div>
    </div>
  );
}
