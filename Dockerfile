# Multi-stage Dockerfile for Next.js Standalone
FROM node:24-bookworm-slim AS base

# 1. Install dependencies only when needed
FROM base AS deps
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

# 2. Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Explicit private review metadata is optional and never served from public/.
RUN mkdir -p private-operator-inputs

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_OPTIONS="--max-old-space-size=3072 --dns-result-order=ipv4first --no-network-family-autoselection"
# Public origin for canonical links and the share card (lib/site-url.ts), inlined at build time.
# Railway hands a service variable to the build only through a declared ARG. No default on purpose:
# set it once the domain's DNS points at this service, or canonicals would name another host.
ARG NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
RUN sh -c 'npm run build > /tmp/build.log 2>&1; rc=$?; cat /tmp/build.log; if [ "$rc" -ne 0 ]; then echo "BUILD_EXIT_CODE=$rc"; sleep 3; exit "$rc"; fi; npm prune --omit=dev'

# 3. Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_OPTIONS="--dns-result-order=ipv4first --no-network-family-autoselection"
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN groupadd --system --gid 1001 nodejs \
 && useradd --system --uid 1001 --gid nodejs --no-create-home nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir -p .next .data
RUN chown nextjs:nodejs .next .data

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/lib ./lib
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts
COPY --from=builder --chown=nextjs:nodejs /app/tsconfig.json ./tsconfig.json
COPY --from=builder --chown=nextjs:nodejs /app/private-operator-inputs ./private-operator-inputs

USER nextjs

EXPOSE 3000

CMD ["node", "scripts/start-production.cjs"]
