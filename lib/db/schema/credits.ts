import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  index,
} from "drizzle-orm/pg-core";
import { users } from "./users";

export const creditUsageLog = pgTable(
  "credit_usage_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    endpoint: text("endpoint").notNull(),
    chain: text("chain"),
    credits: integer("credits").notNull().default(0),
    creditsLeft: integer("credits_left"),
    cacheHit: integer("cache_hit").notNull().default(0),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    calledAt: timestamp("called_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    calledIdx: index("credit_usage_log_called_idx").on(t.calledAt),
    endpointIdx: index("credit_usage_log_endpoint_idx").on(t.endpoint),
    userIdx: index("credit_usage_log_user_idx").on(t.userId),
  }),
);

export type CreditUsageRow = typeof creditUsageLog.$inferSelect;
export type NewCreditUsageRow = typeof creditUsageLog.$inferInsert;
