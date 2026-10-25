FROM node:24-bookworm-slim AS base
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg ca-certificates openssl && rm -rf /var/lib/apt/lists/*
ENV NEXT_TELEMETRY_DISABLED=1
COPY --chown=node:node package.json package-lock.json ./
RUN --mount=type=secret,id=build_ca \
    if [ -f /run/secrets/build_ca ]; then export NODE_EXTRA_CA_CERTS=/run/secrets/build_ca; fi; \
    npm ci --cache /tmp/npm-cache --no-fund --no-audit && rm -rf /tmp/npm-cache
COPY --chown=node:node prisma ./prisma
COPY --chown=node:node prisma.config.ts ./
RUN DATABASE_URL=postgresql://build:build@localhost:5432/build npm run db:generate
COPY --chown=node:node . .
FROM base AS builder
ARG APP_URL
ARG RENDER_EXTERNAL_URL
RUN APP_URL="${APP_URL:-${RENDER_EXTERNAL_URL:-http://localhost:3000}}" DATABASE_URL=postgresql://build:build@localhost:5432/build npm run build
FROM base AS runner
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0
COPY --chown=node:node --from=builder /app/.next/standalone ./
USER node
EXPOSE 3000
CMD ["node", "server.js"]
