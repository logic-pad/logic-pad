# syntax=docker/dockerfile:1

# ---- Build stage: install all dependencies and build the client bundle ----
FROM oven/bun:1 AS build
WORKDIR /app

COPY package.json bun.lock bunfig.toml ./
RUN bun install --frozen-lockfile

COPY packages/logic-core/package.json packages/logic-core/bun.lock packages/logic-core/bunfig.toml ./packages/logic-core/
RUN cd packages/logic-core && bun install --frozen-lockfile

COPY . .

# Client-side environment variables are inlined into the bundle at build time.
# Railway exposes service variables as Docker build arguments.
ARG VITE_API_ENDPOINT
ARG VITE_LEGACY_URL
ARG VITE_VERCEL_PROJECT_PRODUCTION_URL
ARG SITE_URL
ARG SENTRY_AUTH_TOKEN
ARG RAILWAY_GIT_COMMIT_SHA

RUN bun run build

# ---- Runtime stage: production dependencies + SSR server + built assets ----
FROM oven/bun:1-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

# ca-certificates is required for HTTPS calls to the backend
RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY package.json bun.lock bunfig.toml ./
RUN bun install --frozen-lockfile --production

COPY tsconfig.json ./
COPY src ./src
COPY packages/logic-core/src ./packages/logic-core/src
COPY public ./public
COPY --from=build /app/dist ./dist

EXPOSE 3000

# --smol reduces memory usage at a slight performance cost
CMD ["bun", "--smol", "src/ssr/index.ts"]
