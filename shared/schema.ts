import { pgTable, text, serial, integer, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  senderName: varchar("sender_name", { length: 100 }).notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  
  // File attachment data
  fileName: varchar("file_name", { length: 255 }),
  fileSize: integer("file_size"),
  fileType: varchar("file_type", { length: 100 }),
  fileUrl: varchar("file_url", { length: 255 }),
  
  // Reply data
  replyToId: integer("reply_to_id"),
  replyToContent: text("reply_to_content"),
  replyToSender: varchar("reply_to_sender", { length: 100 }),
});

export const insertMessageSchema = createInsertSchema(messages)
  .omit({
    id: true
  })
  .extend({
    // Разрешаем передавать timestamp как строку, объект Date или не передавать вообще
    timestamp: z.union([z.string(), z.date()]).optional(),
  });

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;
