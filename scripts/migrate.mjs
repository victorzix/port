#!/usr/bin/env node
/**
 * Applies pending migrations to DATABASE_URL.
 *
 * Runs anywhere the app runs, including inside the production image, because it
 * needs only `postgres` — a zero-dependency client — and not `drizzle-orm`.
 * Next bundles drizzle-orm into the server chunks rather than installing it in
 * the standalone output, so importing it at runtime fails there; the Dockerfile
 * copies just `node_modules/postgres` (365 KB) instead of the 16 MB ORM.
 *
 * The SQL comes from scripts/lib/migration-sql.mjs, the same builder that backs
 * `npm run db:migrate:sql`. Each migration runs only if its hash is absent from
 * Drizzle's journal, so this is safe to run on every deploy.
 *
 * Intended as Coolify's post-deployment command, chained ahead of the publish
 * step. Two things it is deliberately NOT:
 *
 *   - a build step: the build stage has no network access to Postgres.
 *   - the container's CMD or entrypoint: it would re-run on every restart, and
 *     a failed migration would stop the container from starting at all.
 *
 * Usage:
 *   node scripts/migrate.mjs
 *
 * Exits non-zero on failure, so a deploy hook stops rather than shipping code
 * against a schema that never landed.
 */

import postgres from "postgres";

import { buildMigrationSql } from "./lib/migration-sql.mjs";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set — refusing to guess a database.");
  process.exit(1);
}

let sql;
let tags;
try {
  ({ sql, tags } = await buildMigrationSql(process.cwd()));
} catch (error) {
  console.error(`Could not read migrations: ${error instanceof Error ? error.message : error}`);
  console.error("In the production image these are copied by the Dockerfile — check that COPY still exists.");
  process.exit(1);
}

console.log(`${tags.length} migration(s) known: ${tags.join(", ")}`);

// One connection, no pooling: this process does one job and exits. Drizzle's
// NOTICEs are how each migration reports applied-vs-skipped, so surface them.
const client = postgres(url, {
  max: 1,
  onnotice: (notice) => {
    if (notice.message?.startsWith("applied ") || notice.message?.startsWith("skipped ")) {
      console.log(`  ${notice.message}`);
    }
  },
});

try {
  await client.unsafe(sql).simple();
  console.log("Schema up to date.");
} catch (error) {
  console.error(`Migration failed: ${error instanceof Error ? error.message : error}`);
  console.error("Nothing was applied — the script runs as a single transaction.");
  process.exitCode = 1;
} finally {
  await client.end();
}
