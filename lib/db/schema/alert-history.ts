import {
  pgTable,
  uuid,
  text,
  timestamp,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { alertRules } from "./alerts";

export const alertHistory = pgTable(
  "alert_history",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    ruleId: uuid("rule_id").references(() => alertRules.id, {
      onDelete: "set null",
    }),
    type: text("type").notNull(),
    title: text("title").notNull(),
    body: text("body"),
    payload: jsonb("payload").$type<Record<string, unknown>>(),
    firedAt: timestamp("fired_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    userIdx: index("alert_history_user_idx").on(t.userId),
    firedIdx: index("alert_history_fired_idx").on(t.firedAt),
  }),
);

export type AlertHistoryRow = typeof alertHistory.$inferSelect;
export type NewAlertHistoryRow = typeof alertHistory.$inferInsert;
