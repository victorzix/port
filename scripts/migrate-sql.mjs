#!/usr/bin/env node
/**
 * Writes the migrations out as one paste-ready SQL script, for a database this
 * machine cannot connect to.
 *
 * The normal path is `node scripts/migrate.mjs`, run as a deploy hook inside the
 * container. This exists for the cases that path does not cover: applying a
 * migration without deploying, or a hook that turns out to run somewhere the
 * app is not.
 *
 * The SQL is built by scripts/lib/migration-sql.mjs — the same builder the
 * executing script uses, so both produce identical results and write the journal
 * exactly as drizzle-kit would.
 *
 * Usage:
 *   npm run db:migrate:sql
 *
 * Then paste the generated file into the Postgres service's terminal. "COMMIT"
 * at the end means it worked.
 */

import { writeFile } from "node:fs/promises";
import path from "node:path";

import { buildMigrationSql } from "./lib/migration-sql.mjs";

const ROOT = process.cwd();
const OUT_FILE = path.join(ROOT, "drizzle-migrate.sql");

let sql;
let tags;
try {
  ({ sql, tags } = await buildMigrationSql(ROOT));
} catch (error) {
  console.error(`Could not read migrations: ${error instanceof Error ? error.message : error}`);
  process.exit(1);
}

await writeFile(OUT_FILE, sql);

console.log(`Wrote ${path.relative(ROOT, OUT_FILE)} — ${tags.length} migration(s):`);
for (const tag of tags) console.log(`  ${tag}`);
console.log(`\nPaste it into the Postgres service terminal:`);
console.log(`  psql -U postgres -d postgres <<'SQL'`);
console.log(`  …contents of ${path.relative(ROOT, OUT_FILE)}…`);
console.log(`  SQL`);
console.log(`\nAlready-applied migrations are skipped, so pasting it twice is harmless.`);
