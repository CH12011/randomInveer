import { type Message, type InsertMessage } from "@shared/schema";
import { randomBytes } from "crypto";
import fs from "fs";
import path from "path";

// Define a simple type for multer files since we're only using a few properties
interface UploadedFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

// Directory for storing uploaded files
const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

// Ensure the uploads directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Storage interface
export interface IStorage {
  getMessages(): Promise<Message[]>;
  getMessage(id: number): Promise<Message | undefined>;
  createMessage(message: InsertMessage): Promise<Message>;
  saveFile(file: UploadedFile): Promise<{ fileUrl: string }>;
  getFile(fileId: string): Promise<Buffer | undefined>;
}

// Memory storage implementation
export class MemStorage implements IStorage {
  private messages: Map<number, Message>;
  private files: Map<string, Buffer>;
  private currentId: number;

  constructor() {
    this.messages = new Map();
    this.files = new Map();
    this.currentId = 1;
    console.log("Memory storage initialized");
    
    // Сбрасываем все существующие сообщения
    this.messages.clear();
    
    // Добавляем тестовые сообщения синхронно
    this.createMessageSync({
      content: "Добро пожаловать в чат!",
      senderName: "Система",
      timestamp: new Date(),
    });
    
    this.createMessageSync({
      content: "Привет всем! Как дела?",
      senderName: "Пользователь",
      timestamp: new Date(Date.now() - 1000 * 60), // 1 минуту назад
    });
    
    this.createMessageSync({
      content: "У меня всё хорошо! Классный чат!",
      senderName: "Гость",
      timestamp: new Date(Date.now() - 1000 * 30), // 30 секунд назад
      replyToId: 1, // ID первого сообщения
      replyToContent: "Добро пожаловать в чат!",
      replyToSender: "Система"
    });
  }
  
  // Синхронная версия createMessage для использования в конструкторе
  private createMessageSync(insertMessage: InsertMessage): Message {
    const id = this.currentId++;
    
    const message: Message = {
      id,
      content: insertMessage.content,
      senderName: insertMessage.senderName,
      timestamp: new Date(),
      fileName: insertMessage.fileName || null,
      fileSize: insertMessage.fileSize || null,
      fileType: insertMessage.fileType || null,
      fileUrl: insertMessage.fileUrl || null,
      replyToId: insertMessage.replyToId || null,
      replyToContent: insertMessage.replyToContent || null,
      replyToSender: insertMessage.replyToSender || null
    };
    
    this.messages.set(id, message);
    return message;
  }

  async getMessages(): Promise<Message[]> {
    return Array.from(this.messages.values()).sort((a, b) => {
      const timestampA = new Date(a.timestamp).getTime();
      const timestampB = new Date(b.timestamp).getTime();
      return timestampA - timestampB;
    });
  }

  async getMessage(id: number): Promise<Message | undefined> {
    return this.messages.get(id);
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = this.currentId++;
    
    // Create a complete message with appropriate types
    const message: Message = {
      id,
      content: insertMessage.content,
      senderName: insertMessage.senderName,
      timestamp: new Date(),
      fileName: insertMessage.fileName || null,
      fileSize: insertMessage.fileSize || null,
      fileType: insertMessage.fileType || null,
      fileUrl: insertMessage.fileUrl || null,
      replyToId: insertMessage.replyToId || null,
      replyToContent: insertMessage.replyToContent || null,
      replyToSender: insertMessage.replyToSender || null
    };
    
    this.messages.set(id, message);
    return message;
  }

  async saveFile(file: UploadedFile): Promise<{ fileUrl: string }> {
    // Generate a unique file ID
    const fileId = randomBytes(16).toString("hex");
    const fileExtension = path.extname(file.originalname);
    const fileName = fileId + fileExtension;
    const filePath = path.join(UPLOAD_DIR, fileName);
    
    // Save the file to disk
    fs.writeFileSync(filePath, file.buffer);
    
    // Return a URL that can be used to retrieve the file
    return { fileUrl: `/api/files/${fileName}` };
  }

  async getFile(fileId: string): Promise<Buffer | undefined> {
    try {
      const filePath = path.join(UPLOAD_DIR, fileId);
      if (fs.existsSync(filePath)) {
        return fs.readFileSync(filePath);
      }
      return undefined;
    } catch (error) {
      console.error(`Error retrieving file ${fileId}:`, error);
      return undefined;
    }
  }
}

// Use MemStorage for simplicity
export const storage = new MemStorage();
