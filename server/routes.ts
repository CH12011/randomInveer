import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertMessageSchema } from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";
import cors from "cors";
import mime from "mime-types";
import z from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Enable CORS for all routes
  app.use(cors());
  
  const httpServer = createServer(app);
  
  // Setup WebSocket server
  const wss = new WebSocketServer({ 
    server: httpServer, 
    path: '/ws',
    // Отключаем проверку происхождения для упрощения разработки
    verifyClient: (info, cb) => {
      cb(true);
    },
    // Настройки WebSocket
    perMessageDeflate: false,
    clientTracking: true
  });
  
  // Configure multer for file uploads
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
  });
  
  // Map to track connected clients
  const clients = new Set<WebSocket>();
  
  // Map to track message cooldowns by IP address
  const messageCooldowns = new Map<string, number>();
  const COOLDOWN_MS = 3000; // 3 секунды между сообщениями
  
  // Функция для проверки временной задержки (cooldown)
  function checkCooldown(ip: string): boolean {
    const now = Date.now();
    const lastMessageTime = messageCooldowns.get(ip) || 0;
    
    if (now - lastMessageTime < COOLDOWN_MS) {
      return false; // Cooldown не прошел
    }
    
    // Установка нового времени сообщения
    messageCooldowns.set(ip, now);
    return true; // Cooldown прошел
  }
  
  // Broadcast message to all connected clients
  function broadcast(message: any) {
    const messageStr = JSON.stringify(message);
    clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(messageStr);
      }
    });
  }
  
  // WebSocket connection handler
  wss.on('connection', async (ws, req) => {
    console.log('New WebSocket connection established');
    
    // Add client to connected clients
    clients.add(ws);
    
    // Send all existing messages to the newly connected client
    try {
      const allMessages = await storage.getMessages();
      console.log(`Sending ${allMessages.length} existing messages to new client`);
      ws.send(JSON.stringify({
        type: "update",
        payload: allMessages
      }));
    } catch (error) {
      console.error('Error sending existing messages:', error);
    }
    
    // Handle incoming messages
    ws.on('message', async (data) => {
      console.log('Received message from client');
      try {
        const message = JSON.parse(data.toString());
        console.log('Parsed message type:', message.type);
        
        // Получаем IP-адрес клиента
        const ip = req.socket.remoteAddress || '0.0.0.0';
        
        if (message.type === "message") {
          try {
            // Проверяем на КД для отправки сообщений
            if (!checkCooldown(ip)) {
              console.log(`Cooldown not passed for IP: ${ip}`);
              ws.send(JSON.stringify({
                type: "error",
                payload: { message: "Please wait before sending another message", cooldown: true }
              }));
              return;
            }
            
            console.log('Validating message payload:', JSON.stringify(message.payload));
            const validatedMessage = insertMessageSchema.parse(message.payload);
            const newMessage = await storage.createMessage(validatedMessage);
            console.log('Created new message:', newMessage.id);
            
            // Broadcast the new message to all clients
            broadcast({
              type: "message",
              payload: newMessage
            });
          } catch (error) {
            console.error('Error validating message:', error);
            ws.send(JSON.stringify({
              type: "error",
              payload: { message: "Invalid message format", details: String(error) }
            }));
          }
        } else if (message.type === "file") {
          // Handle file messages (files are uploaded via the REST API)
          try {
            // Проверяем на КД для отправки файлов
            if (!checkCooldown(ip)) {
              console.log(`Cooldown not passed for IP: ${ip}`);
              ws.send(JSON.stringify({
                type: "error",
                payload: { message: "Please wait before sending another file", cooldown: true }
              }));
              return;
            }
            
            const validatedMessage = insertMessageSchema.parse(message.payload);
            const newMessage = await storage.createMessage(validatedMessage);
            console.log('Created new file message:', newMessage.id);
            
            // Broadcast the new message with file information
            broadcast({
              type: "message",
              payload: newMessage
            });
          } catch (error) {
            console.error('Error validating file message:', error);
            ws.send(JSON.stringify({
              type: "error",
              payload: { message: "Invalid file message format", details: String(error) }
            }));
          }
        } else if (message.type === "connection") {
          // Process connection messages
          console.log('Client connection message received');
          
          // If this is a pong response, log it but no need to respond
          if (message.payload && message.payload.pong) {
            console.log('Received pong from client:', message.payload.time);
          }
        } else {
          console.warn('Unknown message type:', message.type);
        }
      } catch (error) {
        console.error('Error processing message:', error);
        ws.send(JSON.stringify({
          type: "error",
          payload: "Invalid message format"
        }));
      }
    });
    
    // Handle disconnection
    ws.on('close', () => {
      console.log('WebSocket connection closed');
      clients.delete(ws);
    });
    
    // Ping to keep connection alive
    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        try {
          // Send both a ping frame and a ping message that clients can respond to
          ws.ping();
          // Also send a heartbeat message
          ws.send(JSON.stringify({
            type: "connection",
            payload: { ping: true, time: new Date().toISOString() }
          }));
          console.log("Ping sent to client");
        } catch (error) {
          console.error("Error sending ping:", error);
          clearInterval(pingInterval);
        }
      } else {
        console.log("WebSocket not open, clearing ping interval");
        clearInterval(pingInterval);
      }
    }, 20000); // Reduce to 20 seconds
    
    // Handle errors
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      clients.delete(ws);
    });
  });
  
  // API routes for file uploads and downloads
  app.post('/api/upload', upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      console.log('File upload received:', req.file.originalname);
      
      // Save the file to storage
      const result = await storage.saveFile(req.file);
      
      res.status(200).json(result);
    } catch (error) {
      console.error('Error uploading file:', error);
      res.status(500).json({ message: "Failed to upload file" });
    }
  });
  
  // Route to serve files
  app.get('/api/files/:fileId', async (req, res) => {
    try {
      const fileId = req.params.fileId;
      console.log('File request received for:', fileId);
      
      const file = await storage.getFile(fileId);
      
      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }
      
      // Determine MIME type based on file extension
      const fileExtension = path.extname(fileId).toLowerCase();
      const mimeType = mime.lookup(fileExtension) || 'application/octet-stream';
      
      // Set appropriate headers
      res.set('Content-Type', mimeType);
      
      // For images and PDFs, display in browser. For others, download
      const disposition = mimeType.startsWith('image/') || mimeType === 'application/pdf'
        ? 'inline'
        : 'attachment';
      
      res.set('Content-Disposition', `${disposition}; filename="${fileId}"`);
      
      res.send(file);
    } catch (error) {
      console.error('Error serving file:', error);
      res.status(500).json({ message: "Failed to retrieve file" });
    }
  });
  
  // API endpoint to get a specific message by ID
  app.get('/api/messages/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid message ID" });
      }
      
      const message = await storage.getMessage(id);
      if (!message) {
        return res.status(404).json({ message: "Message not found" });
      }
      
      res.json(message);
    } catch (error) {
      console.error('Error getting message:', error);
      res.status(500).json({ message: "Failed to retrieve message" });
    }
  });
  
  // Long polling API endpoint as alternative to WebSockets
  app.get('/api/messages', async (req, res) => {
    try {
      const messages = await storage.getMessages();
      const attributes = req.query.attribute?.toString() || '';
      const amount = parseInt(req.query.amount?.toString() || '0');
      
      if (!attributes) {
        return res.json(messages);
      }

      const requestedAttrs = attributes.split(',');
      let formattedMessages = messages.map(msg => {
        const result: string[] = [];
        requestedAttrs.forEach(attr => {
          switch (attr.trim()) {
            case 'text':
              result.push(msg.content);
              break;
            case 'username':
              // Hide part of the username with asterisks
              const name = msg.senderName;
              const maskedName = name.length > 4 ? 
                name.substring(0, 4) + '∙'.repeat(name.length - 4) :
                name;
              result.push(maskedName);
              break;
            case 'time':
              result.push(new Date(msg.timestamp).toISOString());
              break;
          }
        });
        return result.join(' ; ');
      });

      // Apply amount filter if specified
      if (amount > 0) {
        formattedMessages = formattedMessages.slice(-amount);
      }

      // Return as plain text
      res.type('text/plain').send(formattedMessages.join('\n'));
    } catch (error) {
      console.error('Error getting messages:', error);
      res.status(500).json({ message: "Failed to retrieve messages" });
    }
  });
  
  // Send a message via REST API (as backup for WebSockets)
  app.post('/api/messages', async (req, res) => {
    try {
      const message = req.body;
      console.log('Received message via REST API:', message);
      
      // Проверка на КД для REST API
      const ip = req.ip || '0.0.0.0';
      if (!checkCooldown(ip)) {
        console.log(`Cooldown not passed for IP (REST API): ${ip}`);
        return res.status(429).json({ 
          message: "Please wait before sending another message", 
          cooldown: true 
        });
      }
      
      try {
        const validatedMessage = insertMessageSchema.parse(message);
        const newMessage = await storage.createMessage(validatedMessage);
        console.log('Created new message:', newMessage.id);
        
        // Broadcast via WebSocket if possible
        broadcast({
          type: "message",
          payload: newMessage
        });
        
        res.status(201).json(newMessage);
      } catch (error) {
        console.error('Error validating message:', error);
        res.status(400).json({ 
          message: "Invalid message format", 
          details: String(error) 
        });
      }
    } catch (error) {
      console.error('Error processing message:', error);
      res.status(500).json({ message: "Failed to create message" });
    }
  });
  
  // Simple health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });
  
  // API endpoint to send messages via GET request (for docs examples)
  app.get('/api/say', async (req, res) => {
    try {
      const { text, name } = req.query;
      
      // Validate parameters
      if (!text || typeof text !== 'string') {
        return res.status(400).json({ message: "Text parameter is required" });
      }
      
      // Проверка на КД для API /api/say
      const ip = req.ip || '0.0.0.0';
      if (!checkCooldown(ip)) {
        console.log(`Cooldown not passed for IP (/api/say): ${ip}`);
        return res.status(429).json({ 
          message: "Please wait before sending another message", 
          cooldown: true 
        });
      }
      
      // Create the message
      const message = {
        content: text,
        senderName: typeof name === 'string' && name ? name : "API",
        timestamp: new Date(),
        replyToId: null,
        replyToContent: null,
        replyToSender: null
      };
      
      const newMessage = await storage.createMessage(message);
      console.log('Created new message via API:', newMessage.id);
      
      // Broadcast the new message
      broadcast({
        type: "message",
        payload: newMessage
      });
      
      res.status(201).json(newMessage);
    } catch (error) {
      console.error('Error processing API message:', error);
      res.status(500).json({ message: "Failed to create message" });
    }
  });

  return httpServer;
}