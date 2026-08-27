FROM node:22-alpine AS base

# ---- Dependencies ----
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
# node:22-alpine ships npm 10, which computes a different dependency tree than
# the npm 11 that writes package-lock.json on the dev machine — so `npm ci`
# rejects a perfectly valid lock with "Missing: <pkg> from lock file". Pin the
# major that produced the lock. This build has failed this way three times;
# regenerating the lock only fixes it until the next dependency is added.
# If you upgrade npm locally to a new major, bump this to match.
RUN npm i -g npm@11 && npm ci

# ---- Build ----
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# GA4 measurement id. NEXT_PUBLIC_* is inlined into the bundle at build time, so
# it has to be present here, not only at runtime — in Coolify mark the variable
# as a build variable. Absent, the tag simply does not render (see
# src/components/google-analytics.tsx).
ARG NEXT_PUBLIC_GA_ID
ENV NEXT_PUBLIC_GA_ID=$NEXT_PUBLIC_GA_ID
RUN npm run build

# ---- Run ----
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

RUN mkdir .next && chown nextjs:nodejs .next

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Release content and its publish script, so a post-deployment hook can push
# this project's own release history to the running app. Not used at build or
# boot — invoke it explicitly:
#   PORTFOLIO_API_URL=http://127.0.0.1:3000 node scripts/publish-releases.mjs
# Note `npm run` is unavailable here: the standalone package.json carries no scripts.
COPY --from=builder --chown=nextjs:nodejs /app/content ./content
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts

# Migrations, for the deploy hook to apply. Nothing runs these at build or at
# container boot; see CLAUDE.md.
COPY --from=builder --chown=nextjs:nodejs /app/src/db/migrations ./src/db/migrations

# The Postgres client, so scripts/migrate.mjs can connect. Next bundles runtime
# dependencies into the server chunks instead of installing them in the
# standalone output, so `postgres` is not resolvable here otherwise. It is
# zero-dependency and 365 KB; drizzle-orm is deliberately not copied — the
# migration script speaks SQL directly rather than pulling in 16 MB of ORM.
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/postgres ./node_modules/postgres

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
