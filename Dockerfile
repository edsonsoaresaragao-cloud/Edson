FROM node:24-bookworm-slim AS build
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg ca-certificates openssl && rm -rf /var/lib/apt/lists/*
ENV NEXT_TELEMETRY_DISABLED=1
# Small source context: .dockerignore excludes secrets, caches and previous builds.
# Keep installation and build together to avoid duplicating large dependency layers.
COPY --chown=node:node . .
ARG APP_URL
ARG RENDER_EXTERNAL_URL
RUN --mount=type=secret,id=build_ca \
    set -eu; \
    if [ -f /run/secrets/build_ca ]; then export NODE_EXTRA_CA_CERTS=/run/secrets/build_ca; fi; \
    npm ci --cache /tmp/npm-cache --no-fund --no-audit; \
    APP_URL="${APP_URL:-${RENDER_EXTERNAL_URL:-http://localhost:3000}}" DATABASE_URL=postgresql://build:build@localhost:5432/build npm run build; \
    chown -R node:node .next; \
    chown node:node /app; \
    rm -rf /tmp/npm-cache

FROM build AS runner
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0 NPM_CONFIG_CACHE=/tmp/npm-cache
USER node
EXPOSE 3000
CMD ["node", ".next/standalone/server.js"]
