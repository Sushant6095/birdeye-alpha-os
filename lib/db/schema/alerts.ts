import {
  pgTable,
  uuid,
  text,
  timestamp,
  jsonb,
  boolean,
  index,
} from "drizzle-orm/pg-core";
import { users } from "./users";

export type AlertRuleType =
  | "price_above"
  | "price_below"
  | "price_change_pct"
  | "volume_spike"
  | "wallet_buy"
  | "wallet_sell"
  | "holder_drop";

export const alertRules = pgTable(
  "alert_rules",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AlertRuleType>().notNull(),
    config: jsonb("config").$type<Record<string, unknown>>().notNull(),
    enabled: boolean("enabled").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    userIdx: index("alert_rules_user_idx").on(t.userId),
    enabledIdx: index("alert_rules_enabled_idx").on(t.enabled),
  }),
);

export type AlertRule = typeof alertRules.$inferSelect;
export type NewAlertRule = typeof alertRules.$inferInsert;
