import { Message } from "@shared/schema";
import { ContextMenu } from "@/components/ui/context-menu";
import { formatTime } from "@/lib/time-utils";

interface MessageDisplayProps {
  message: Message;
  onReply: (message: Message) => void;
  isHighlighted?: boolean;
}

export default function MessageDisplay({ message, onReply, isHighlighted = false }: MessageDisplayProps) {
  return (
    <ContextMenu message={message} onReply={onReply}>
      <div className={`glass-dark rounded-xl p-3 max-w-md w-full mx-auto shadow-lg -mt-2
        ${isHighlighted ? 'border border-blue-400 shadow-blue-400/50' : ''}`}>
        <div className="flex items-start gap-2">
          <div className="w-full">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-sm font-medium text-blue-300">{message.senderName}</span>
              <span className="text-xs text-gray-400">{formatTime(message.timestamp)}</span>
            </div>
            
            <p className="text-sm text-white">{message.content}</p>
            
            {/* File attachment preview */}
            {message.fileName && (
              <div className="mt-2 rounded-md overflow-hidden">
                <div className="flex items-center p-2 bg-white bg-opacity-10 rounded-md">
                  <i className="ri-file-text-line text-blue-300 mr-2"></i>
                  <span className="text-xs text-white truncate">{message.fileName}</span>
                  <a 
                    href={message.fileUrl ?? '#'} 
                    download
                    className="ml-auto text-xs text-blue-300 hover:text-blue-200"
                  >
                    <i className="ri-download-line"></i>
                  </a>
                </div>
              </div>
            )}
            
            {/* Reply reference */}
            {message.replyToId && (
              <div className="mt-1 pl-2 border-l-2 border-blue-400">
                <div className="text-xs text-gray-400">
                  <span className="text-blue-300">{message.replyToSender}</span>: 
                  <span className="truncate inline-block max-w-[200px] ml-1">
                    {message.replyToContent}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ContextMenu>
  );
}
