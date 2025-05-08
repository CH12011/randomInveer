import { useState, useEffect, useRef, ReactNode } from "react";
import { Message } from "@shared/schema";
import { createPortal } from "react-dom";
import { useToast } from "@/hooks/use-toast";

interface ContextMenuProps {
  children: ReactNode;
  message: Message;
  onReply: (message: Message) => void;
}

export function ContextMenu({ children, message, onReply }: ContextMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const menuRef = useRef<HTMLDivElement | null>(null);
  const { toast } = useToast();

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setPosition({ x: e.pageX, y: e.pageY });
    setIsOpen(true);
  };

  const handleReply = () => {
    onReply(message);
    setIsOpen(false);
  };

  const copyMessageLink = () => {
    const baseUrl = window.location.href.split("?")[0];
    const link = `${baseUrl}?msg=${message.id}`;
    navigator.clipboard.writeText(link)
      .then(() => {
        toast({
          description: "Link copied to clipboard"
        });
      })
      .catch(err => {
        console.error("Failed to copy link:", err);
        toast({
          variant: "destructive",
          description: "Failed to copy link"
        });
      });
    setIsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("click", handleClickOutside);
    }

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div onContextMenu={handleContextMenu}>
      {children}
      {isOpen && createPortal(
        <div 
          ref={menuRef}
          className="glass-dark rounded-lg overflow-hidden shadow-lg w-48 fixed z-50 animate-in fade-in-50 duration-100"
          style={{ 
            left: `${position.x}px`, 
            top: `${position.y}px` 
          }}
        >
          <ul className="py-1">
            <li>
              <button 
                className="w-full text-left px-4 py-2 text-sm text-white hover:bg-white hover:bg-opacity-10 transition-colors flex items-center"
                onClick={handleReply}
              >
                <i className="ri-reply-line mr-2"></i> Reply
              </button>
            </li>
            <li>
              <button 
                className="w-full text-left px-4 py-2 text-sm text-white hover:bg-white hover:bg-opacity-10 transition-colors flex items-center"
                onClick={copyMessageLink}
              >
                <i className="ri-link mr-2"></i> Copy Link
              </button>
            </li>
          </ul>
        </div>,
        document.body
      )}
    </div>
  );
}
