#!/usr/bin/env node
/**
 * Applies pending migrations using Drizzle's own runtime migrator.
 *
 * Deliberately does NOT use drizzle-kit: that is a devDependency and is absent
 * from the production image. `drizzle-orm/postgres-js/migrator` is part of the
 * runtime dependency the app already ships, so this runs anywhere the app runs,
 * with the same journal semantics drizzle-kit uses.
 *
 * Intended as a deploy hook — a pre-deployment command, so the schema is in
 * place before new code serves traffic. Two things it is deliberately NOT:
 *
 *   - a build step: the build stage has no network access to Postgres.
 *   - the container's CMD or entrypoint: that would re-run on every restart,
 *     and a failing migration would keep the container from starting at all.
 *
 * Usage:
 *   node scripts/migrate.mjs
 *
 * Requires DATABASE_URL in the environment. Exits non-zero on failure so the
 * deploy stops rather than shipping code against a schema that never landed.
 */

import { existsSync } from "node:fs";
import path from "node:path";

import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set — refusing to guess a database.");
  process.exit(1);
}

const migrationsFolder = path.join(process.cwd(), "src", "db", "migrations");
if (!existsSync(migrationsFolder)) {
  console.error(`No migrations folder at ${migrationsFolder}.`);
  console.error("In the production image this is copied by the Dockerfile — check that COPY still exists.");
  process.exit(1);
}

// A single connection, and no pooling: this process does one job and exits.
const client = postgres(url, { max: 1 });

try {
  console.log("Applying pending migrations…");
  await migrate(drizzle(client), { migrationsFolder });
  console.log("Migrations up to date.");
} catch (error) {
  console.error("Migration failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await client.end();
}
