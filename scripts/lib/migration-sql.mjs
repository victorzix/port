/**
 * Builds one idempotent SQL script from the committed Drizzle migrations.
 *
 * Shared by two callers so there is a single definition of "what applying our
 * migrations means":
 *   - scripts/migrate-sql.mjs writes it to a file, to paste into a terminal
 *   - scripts/migrate.mjs executes it against DATABASE_URL
 *
 * Each migration is wrapped in a block that runs only when its hash is absent
 * from Drizzle's journal. The hash is the one drizzle-kit computes — sha256 of
 * the file with LF line endings — so a database migrated by this script and one
 * migrated by `drizzle-kit migrate` are indistinguishable, and either tool can
 * take over from the other.
 *
 * Deliberately does not import drizzle-orm: Next bundles it into the server
 * chunks rather than installing it in the standalone output, so it is not
 * resolvable at runtime in the production image.
 */

import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";

/** The hash drizzle-kit stores for a migration file. */
export function migrationHash(sql) {
  return createHash("sha256").update(sql.replace(/\r\n/g, "\n")).digest("hex");
}

/**
 * @param {string} root repository (or app) root containing src/db/migrations
 * @returns {Promise<{ sql: string, tags: string[] }>}
 */
export async function buildMigrationSql(root) {
  const migrationsDir = path.join(root, "src", "db", "migrations");
  const journalPath = path.join(migrationsDir, "meta", "_journal.json");

  const journal = JSON.parse(await readFile(journalPath, "utf8"));
  const entries = journal.entries ?? [];

  if (entries.length === 0) {
    throw new Error(`No migrations listed in ${journalPath}`);
  }

  const blocks = [];
  const tags = [];

  for (const [index, entry] of entries.entries()) {
    const file = path.join(migrationsDir, `${entry.tag}.sql`);
    const sql = (await readFile(file, "utf8")).replace(/\r\n/g, "\n").trim();
    const hash = migrationHash(sql);
    tags.push(entry.tag);

    // Dollar-quote tag unique per migration, so a migration that itself uses
    // $$ (drizzle emits those for some constraints) cannot close our block.
    const quote = `$mig_${entry.tag}$`;
    if (sql.includes(quote)) {
      throw new Error(`Migration ${entry.tag} contains ${quote}; cannot wrap it safely.`);
    }

    // Drizzle's separator is a comment; dropping it keeps the output readable.
    const body = sql
      .split("--> statement-breakpoint")
      .map((part) => part.trim())
      .filter(Boolean)
      .join("\n\n    ");

    blocks.push(
      [
        `-- ${index + 1}/${entries.length} — ${entry.tag}`,
        `DO ${quote}`,
        `BEGIN`,
        `  IF NOT EXISTS (SELECT 1 FROM "drizzle"."__drizzle_migrations" WHERE hash = '${hash}') THEN`,
        ``,
        `    ${body}`,
        ``,
        `    INSERT INTO "drizzle"."__drizzle_migrations" (hash, created_at)`,
        `    VALUES ('${hash}', (extract(epoch from now()) * 1000)::bigint);`,
        `    RAISE NOTICE 'applied ${entry.tag}';`,
        `  ELSE`,
        `    RAISE NOTICE 'skipped ${entry.tag} (already applied)';`,
        `  END IF;`,
        `END ${quote};`,
      ].join("\n"),
    );
  }

  const sql = [
    `-- Generated from src/db/migrations — do not edit, and do not commit.`,
    `-- ${entries.length} migration(s).`,
    `--`,
    `-- Safe to run more than once: each migration runs only if its hash is`,
    `-- absent from Drizzle's journal, and the whole script is one transaction.`,
    ``,
    `BEGIN;`,
    ``,
    `CREATE SCHEMA IF NOT EXISTS "drizzle";`,
    `CREATE TABLE IF NOT EXISTS "drizzle"."__drizzle_migrations" (`,
    `  id SERIAL PRIMARY KEY,`,
    `  hash text NOT NULL,`,
    `  created_at bigint`,
    `);`,
    ``,
    ...blocks,
    ``,
    `COMMIT;`,
    ``,
  ].join("\n");

  return { sql, tags };
}
