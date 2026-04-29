import { eq } from "drizzle-orm";
import { db, isDbConfigured, users } from "@/lib/db";

const DEFAULT_USER_HEADER = "x-alphaos-user";

/**
 * AlphaOS doesn't ship its own auth — we tag every browser with a UUID stored
 * in localStorage and create a row in `users` lazily so foreign keys work.
 *
 * Server flow: read the UUID from the `x-alphaos-user` header (set by the
 * client provider) and ensure the row exists. Returns `null` if DB isn't
 * configured so callers can short-circuit.
 */
export async function ensureUser(req: Request): Promise<string | null> {
  if (!isDbConfigured()) return null;
  const id = req.headers.get(DEFAULT_USER_HEADER);
  if (!id || !isUuid(id)) return null;
  try {
    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    if (existing.length === 0) {
      await db
        .insert(users)
        .values({ id, email: `${id}@local.alphaos` })
        .onConflictDoNothing();
    }
    return id;
  } catch {
    return null;
  }
}

function isUuid(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    s,
  );
}
