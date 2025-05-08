import { useState, useEffect, useCallback, useRef } from "react";
import { Message, InsertMessage } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

// Define message types for WebSocket communication
type WebSocketMessage = {
  type: "message" | "update" | "connection" | "file" | "error";
  payload: any;
};

export function useWebSocket() {
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectingRef = useRef(false);
  const { toast } = useToast();

  // Long polling function to fetch messages periodically
  const pollMessages = useCallback(async () => {
    try {
      const response = await fetch('/api/messages');
      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }
      const data = await response.json();
      setMessages(data);
    } catch (error) {
      console.error('Error polling messages:', error);
    }
  }, []);

  // Function to connect to WebSocket with better reconnection handling
  const connectWebSocket = useCallback(() => {
    // If already trying to reconnect, don't start a new attempt
    if (reconnectingRef.current) return;
    
    reconnectingRef.current = true;
    
    // Get appropriate WebSocket protocol (wss for https, ws for http)
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    // Use the same host and port as the main connection
    const host = window.location.host;
    // Create complete WebSocket URL including host and path
    const wsUrl = `${protocol}//${host}/ws`;
    
    console.log("Connecting to WebSocket at:", wsUrl);
    
    // Create new WebSocket connection
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    // Connection opened handler
    socket.onopen = () => {
      setConnected(true);
      console.log("WebSocket connected successfully");
      reconnectAttemptsRef.current = 0;
      reconnectingRef.current = false;
      
      // Send a ping to verify connection
      socket.send(JSON.stringify({
        type: "connection",
        payload: { status: "connected", client: "browser" }
      }));
    };

    // Connection closed handler
    socket.onclose = (event) => {
      setConnected(false);
      console.log("WebSocket disconnected with code:", event.code, event.reason);
      
      // Increase reconnect attempts, with exponential backoff (max 10 seconds)
      const delay = Math.min(1000 * (Math.pow(1.5, reconnectAttemptsRef.current) - 1), 10000);
      reconnectAttemptsRef.current += 1;
      
      // Attempt to reconnect after a calculated delay
      setTimeout(() => {
        console.log(`Attempting to reconnect to WebSocket... (Attempt ${reconnectAttemptsRef.current})`);
        reconnectingRef.current = false;
        connectWebSocket();
      }, delay);
    };

    // Connection error handler
    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
      toast({
        title: "Ошибка соединения",
        description: "Не удалось подключиться к серверу чата",
        variant: "destructive"
      });
    };

    // Message handler
    socket.onmessage = (event) => {
      try {
        const data: WebSocketMessage = JSON.parse(event.data);
        
        switch (data.type) {
          case "message":
            setMessages(prev => [...prev, data.payload]);
            break;
          case "update":
            setMessages(data.payload);
            break;
          case "connection":
            console.log("Connection status:", data.payload);
            // If this is a ping, respond with a pong to keep the connection alive
            if (data.payload.ping && socketRef.current?.readyState === WebSocket.OPEN) {
              socketRef.current.send(JSON.stringify({
                type: "connection",
                payload: { pong: true, time: new Date().toISOString() }
              }));
              console.log("Sent pong response");
            }
            break;
          case "file":
            // Handle file messages
            const fileMessage = data.payload as Message;
            setMessages(prev => [...prev, fileMessage]);
            break;
          case "error":
            console.error("WebSocket error from server:", data.payload);
            // Проверяем, есть ли флаг cooldown в сообщении об ошибке
            if (data.payload.cooldown) {
              toast({
                title: "Пожалуйста, подождите",
                description: data.payload.message || "Слишком много сообщений. Подождите перед отправкой следующего.",
                variant: "default"
              });
            } else {
              toast({
                title: "Ошибка", 
                description: data.payload.message || "Произошла ошибка при обработке запроса",
                variant: "destructive"
              });
            }
            break;
          default:
            console.warn("Unknown message type:", data.type);
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };
  }, [toast]);

  useEffect(() => {
    // Initial connection setup
    let pollInterval: NodeJS.Timeout;
    
    // Check API server availability before attempting to connect
    fetch('/api/health')
      .then(response => response.json())
      .then(data => {
        console.log('API server is available:', data);
        connectWebSocket();
        
        // Start polling for messages every 3 seconds as a fallback
        pollInterval = setInterval(pollMessages, 3000);
      })
      .catch(error => {
        console.error('API server is not available:', error);
        toast({
          title: "Ошибка соединения",
          description: "Не удалось подключиться к серверу чата",
          variant: "destructive"
        });
      });
    
    // Cleanup function
    return () => {
      if (pollInterval) clearInterval(pollInterval);
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.close();
      }
    };
  }, [connectWebSocket, pollMessages, toast]);

  // Send message through WebSocket or fallback to REST API
  const sendMessage = useCallback(async (message: InsertMessage) => {
    // Try WebSocket first
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      const wsMessage: WebSocketMessage = {
        type: "message",
        payload: message
      };
      socketRef.current.send(JSON.stringify(wsMessage));
      return true;
    } 
    
    // Fallback to REST API if WebSocket is not available
    try {
      console.log("Fallback: using REST API for message", message);
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(message)
      });
      
      if (!response.ok) {
        // Проверяем особый случай для 429 - превышение лимита запросов (КД)
        if (response.status === 429) {
          const errorData = await response.json();
          toast({
            title: "Пожалуйста, подождите",
            description: errorData.message || "Слишком много сообщений. Подождите перед отправкой следующего.",
            variant: "default"
          });
          return false;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const newMessage = await response.json();
      
      // Update local state with the new message
      setMessages(prev => [...prev, newMessage]);
      
      return true;
    } catch (error) {
      console.error("Error sending message via REST API:", error);
      toast({
        title: "Ошибка отправки",
        description: "Не удалось отправить сообщение",
        variant: "destructive"
      });
      return false;
    }
  }, [toast]);

  // Upload file and send file message
  const uploadFile = useCallback(async (file: File, messageData: InsertMessage) => {
    if (!file) return false;
    
    const formData = new FormData();
    formData.append("file", file);
    
    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error("Failed to upload file");
      }
      
      const result = await response.json();
      
      // Создаем сообщение с данными о файле
      const fileMessageData = {
        ...messageData,
        fileUrl: result.fileUrl,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      };
      
      // Try WebSocket first
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        const wsMessage: WebSocketMessage = {
          type: "file",
          payload: fileMessageData
        };
        socketRef.current.send(JSON.stringify(wsMessage));
        return true;
      }
      
      // Fallback to REST API if WebSocket is not available
      try {
        console.log("Fallback: using REST API for file message", fileMessageData);
        const response = await fetch("/api/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(fileMessageData)
        });
        
        if (!response.ok) {
          // Проверяем особый случай для 429 - превышение лимита запросов (КД)
          if (response.status === 429) {
            const errorData = await response.json();
            toast({
              title: "Пожалуйста, подождите",
              description: errorData.message || "Слишком много сообщений. Подождите перед отправкой следующего.",
              variant: "default"
            });
            return false;
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const newMessage = await response.json();
        
        // Update local state with the new message
        setMessages(prev => [...prev, newMessage]);
        
        return true;
      } catch (error) {
        console.error("Error sending file message via REST API:", error);
        toast({
          title: "Ошибка отправки",
          description: "Не удалось отправить сообщение с файлом",
          variant: "destructive"
        });
        return false;
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      toast({
        title: "Ошибка загрузки",
        description: "Не удалось загрузить файл",
        variant: "destructive"
      });
      return false;
    }
  }, [toast]);

  return {
    connected,
    messages,
    sendMessage,
    uploadFile
  };
}