import { useEffect, useState } from "react";
import BackgroundManager from "@/components/background-manager";
import ChatContainer from "@/components/chat/chat-container";
import { useWebSocket } from "@/hooks/use-websocket";
import { Message } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export default function Home() {
  const { connected, messages, sendMessage } = useWebSocket();
  const { toast } = useToast();
  const [location] = useLocation();
  
  // Парсинг URL для получения параметра msg
  const getMessageId = () => {
    try {
      const url = new URL(window.location.href);
      const msgId = url.searchParams.get("msg");
      return msgId ? parseInt(msgId) : null;
    } catch (error) {
      console.error("Error parsing URL:", error);
      return null;
    }
  };
  
  const messageId = getMessageId();

  // Когда изменяется URL или сообщения, ищем сообщение по ID
  const [highlightedMessage, setHighlightedMessage] = useState<Message | null>(null);
  
  useEffect(() => {
    if (messageId !== null) {
      // Сначала проверяем, есть ли такое сообщение в списке
      const message = messages.find(m => m.id === messageId);
      
      if (message) {
        console.log(`Найдено сообщение по ID ${messageId}:`, message);
        setHighlightedMessage(message);
      } else {
        // Если сообщение не найдено в списке, запрашиваем его с сервера
        fetch(`/api/messages/${messageId}`)
          .then(response => {
            if (!response.ok) {
              throw new Error('Сообщение не найдено');
            }
            return response.json();
          })
          .then(message => {
            console.log(`Загружено сообщение ${messageId} с сервера:`, message);
            setHighlightedMessage(message);
          })
          .catch(error => {
            console.error('Ошибка при загрузке сообщения:', error);
            toast({
              title: "Ошибка",
              description: "Не удалось загрузить сообщение по ссылке",
              variant: "destructive"
            });
            setHighlightedMessage(null);
          });
      }
    } else {
      setHighlightedMessage(null);
    }
  }, [location, messages, messageId, toast]);

  return (
    <main className="relative w-full h-screen overflow-hidden">
      <BackgroundManager />
      {/* При наличии выделенного сообщения добавляем класс с размытием фона */}
      <div className={`absolute inset-0 ${highlightedMessage ? 'backdrop-blur-sm' : ''}`}></div>
      
      <ChatContainer 
        connected={connected}
        messages={messages}
        sendMessage={sendMessage}
        highlightedMessage={highlightedMessage}
      />
    </main>
  );
}
