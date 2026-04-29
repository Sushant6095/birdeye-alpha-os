import {
  pgTable,
  text,
  timestamp,
  jsonb,
  integer,
  index,
} from "drizzle-orm/pg-core";

/**
 * Postgres-backed cache fallback. Used when Redis is unreachable.
 * Lookups should ignore rows where expires_at < now().
 */
export const cachedResponses = pgTable(
  "cached_responses",
  {
    key: text("key").primaryKey(),
    payload: jsonb("payload").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    hitCount: integer("hit_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    expiresIdx: index("cached_responses_expires_idx").on(t.expiresAt),
  }),
);

export type CachedResponse = typeof cachedResponses.$inferSelect;
export type NewCachedResponse = typeof cachedResponses.$inferInsert;
