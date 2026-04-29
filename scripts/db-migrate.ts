import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { migrate } from "drizzle-orm/neon-http/migrator";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL missing.");
    process.exit(1);
  }
  const client = neon(url);
  const db = drizzle(client);
  console.log("Running migrations from ./drizzle…");
  await migrate(db, { migrationsFolder: "./drizzle" });
  console.log("Migrations applied.");
}

main().catch((e) => {
  console.error("Migration failed:", e);
  process.exit(1);
});
