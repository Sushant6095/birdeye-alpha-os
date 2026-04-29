import {
  pgTable,
  uuid,
  timestamp,
  jsonb,
  text,
  index,
} from "drizzle-orm/pg-core";
import { users } from "./users";

export interface AiMessage {
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  toolCalls?: unknown;
  ts?: number;
}

export const aiConversations = pgTable(
  "ai_conversations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title"),
    messages: jsonb("messages").$type<AiMessage[]>().notNull().default([]),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({ userIdx: index("ai_conversations_user_idx").on(t.userId) }),
);

export type AiConversation = typeof aiConversations.$inferSelect;
export type NewAiConversation = typeof aiConversations.$inferInsert;
