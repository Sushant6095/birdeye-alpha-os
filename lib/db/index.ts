import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

function getDb() {
  if (_db) return _db;
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL missing. Set Neon connection string in .env before using db.",
    );
  }
  const client = neon(url);
  _db = drizzle(client, { schema });
  return _db;
}

/**
 * Drizzle DB handle. Lazily constructed on first use so importing modules
 * during build/typecheck doesn't blow up when DATABASE_URL is unset.
 */
export const db = new Proxy({} as ReturnType<typeof getDb>, {
  get(_target, prop, receiver) {
    return Reflect.get(getDb(), prop, receiver);
  },
});

export { schema };
export * from "./schema";

/** True if DATABASE_URL is configured. Use to short-circuit DB calls in dev. */
export function isDbConfigured(): boolean {
  return !!process.env.DATABASE_URL;
}
