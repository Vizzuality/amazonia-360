# To use this Dockerfile, you have to set `output: 'standalone'` in your next.config.mjs file.
# From https://github.com/vercel/next.js/blob/canary/examples/with-docker/Dockerfile

FROM node:22.14-slim AS base

# Install dependencies only when needed
FROM base AS deps

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
  fonts-liberation \
  libasound2 \
  libatk-bridge2.0-0 \
  libatk1.0-0 \
  libcups2 \
  libdrm2 \
  libgbm1 \
  libgtk-3-0 \
  libnspr4 \
  libnss3 \
  libx11-xcb1 \
  libxcomposite1 \
  libxdamage1 \
  libxrandr2 \
  xdg-utils \
  libu2f-udev \
  libxshmfence1 \
  libglu1-mesa \
  chromium \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*

# Install dependencies
COPY package.json pnpm-lock.yaml* .npmrc* ./
RUN corepack enable pnpm && \
    pnpm install --frozen-lockfile

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app

ARG NEXT_PUBLIC_URL
ARG NEXT_PUBLIC_API_URL

ARG NEXT_PUBLIC_ARCGIS_API_KEY
ARG NEXT_PUBLIC_API_KEY
ARG ARCGIS_CLIENT_ID
ARG ARCGIS_CLIENT_SECRET

ARG BASIC_AUTH_ENABLED
ARG BASIC_AUTH_USER
ARG BASIC_AUTH_PASSWORD

ENV NEXT_PUBLIC_URL $NEXT_PUBLIC_URL
ENV NEXT_PUBLIC_API_URL $NEXT_PUBLIC_API_URL

ENV NEXT_PUBLIC_ARCGIS_API_KEY $NEXT_PUBLIC_ARCGIS_API_KEY
ENV NEXT_PUBLIC_API_KEY $NEXT_PUBLIC_API_KEY
ENV ARCGIS_CLIENT_ID $ARCGIS_CLIENT_ID
ENV ARCGIS_CLIENT_SECRET $ARCGIS_CLIENT_SECRET

ENV BASIC_AUTH_ENABLED $BASIC_AUTH_ENABLED
ENV BASIC_AUTH_USER $BASIC_AUTH_USER
ENV BASIC_AUTH_PASSWORD "$BASIC_AUTH_PASSWORD"

ENV COREPACK_INTEGRITY_KEYS 0

ENV NODE_OPTIONS --no-experimental-global-navigator

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true
ENV PUPPETEER_EXECUTABLE_PATH="/usr/bin/chromium"

ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry during the build.
RUN corepack enable pnpm && \
    pnpm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ARG LINUX_GID=1001
ARG LINUX_UID=1001
ARG CMS__PORT=3001
ARG CMS__MEDIA_DIR=media

ARG NEXT_PUBLIC_URL
ARG NEXT_PUBLIC_API_URL

ARG NEXT_PUBLIC_ARCGIS_API_KEY
ARG NEXT_PUBLIC_API_KEY
ARG ARCGIS_CLIENT_ID
ARG ARCGIS_CLIENT_SECRET

ARG BASIC_AUTH_ENABLED
ARG BASIC_AUTH_USER
ARG BASIC_AUTH_PASSWORD

ENV NEXT_PUBLIC_URL $NEXT_PUBLIC_URL
ENV NEXT_PUBLIC_API_URL $NEXT_PUBLIC_API_URL

ENV NEXT_PUBLIC_ARCGIS_API_KEY $NEXT_PUBLIC_ARCGIS_API_KEY
ENV NEXT_PUBLIC_API_KEY $NEXT_PUBLIC_API_KEY
ENV ARCGIS_CLIENT_ID $ARCGIS_CLIENT_ID
ENV ARCGIS_CLIENT_SECRET $ARCGIS_CLIENT_SECRET

ENV BASIC_AUTH_ENABLED $BASIC_AUTH_ENABLED
ENV BASIC_AUTH_USER $BASIC_AUTH_USER
ENV BASIC_AUTH_PASSWORD "$BASIC_AUTH_PASSWORD"

ENV COREPACK_INTEGRITY_KEYS 0

ENV NODE_OPTIONS --no-experimental-global-navigator

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true
ENV PUPPETEER_EXECUTABLE_PATH="/usr/bin/chromium"

ENV NEXT_TELEMETRY_DISABLED=1

ENV NODE_ENV=production
# Uncomment the following line in case you want to disable telemetry during runtime.
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000

# server.js is created by next build from the standalone output
# https://nextjs.org/docs/pages/api-reference/next-config-js/output
CMD ["/bin/sh", "-c", "HOSTNAME=0.0.0.0 node server.js"]