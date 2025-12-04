# To use this Dockerfile, you have to set `output: 'standalone'` in your next.config.mjs file.
# From https://github.com/vercel/next.js/blob/canary/examples/with-docker/Dockerfile

FROM node:22.14-slim AS base

# Install dependencies only when needed
FROM base AS deps

WORKDIR /app

# Install dependencies
COPY package.json pnpm-lock.yaml* .npmrc* ./
RUN corepack enable pnpm && \
    pnpm install --frozen-lockfile

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app

ARG NEXT_PUBLIC_URL
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_WEBSHOT_URL

ARG NEXT_PUBLIC_ARCGIS_API_KEY
ARG NEXT_PUBLIC_API_KEY

ARG BASIC_AUTH_ENABLED
ARG BASIC_AUTH_USER
ARG BASIC_AUTH_PASSWORD

ARG AWS_SES_IAM_USER_ACCESS_KEY_ID
ARG AWS_SES_IAM_USER_SECRET_ACCESS_KEY
ARG AWS_SES_REGION

ARG PAYLOAD_SECRET
ARG DATABASE_URL
ARG APP_KEY
ARG AUTH_SECRET

ENV NEXT_PUBLIC_URL $NEXT_PUBLIC_URL
ENV NEXT_PUBLIC_WEBSHOT_URL $NEXT_PUBLIC_WEBSHOT_URL
ENV NEXT_PUBLIC_API_URL $NEXT_PUBLIC_API_URL

ENV NEXT_PUBLIC_ARCGIS_API_KEY $NEXT_PUBLIC_ARCGIS_API_KEY
ENV NEXT_PUBLIC_API_KEY $NEXT_PUBLIC_API_KEY

ENV BASIC_AUTH_ENABLED $BASIC_AUTH_ENABLED
ENV BASIC_AUTH_USER $BASIC_AUTH_USER
ENV BASIC_AUTH_PASSWORD "$BASIC_AUTH_PASSWORD"

ENV AWS_SES_IAM_USER_ACCESS_KEY_ID $AWS_SES_IAM_USER_ACCESS_KEY_ID
ENV AWS_SES_IAM_USER_SECRET_ACCESS_KEY $AWS_SES_IAM_USER_SECRET_ACCESS_KEY
ENV AWS_SES_REGION $AWS_SES_REGION

ENV PAYLOAD_SECRET $PAYLOAD_SECRET
ENV DATABASE_URL $DATABASE_URL
ENV APP_KEY $APP_KEY
ENV AUTH_SECRET $AUTH_SECRET

ENV COREPACK_INTEGRITY_KEYS 0

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
ARG NEXT_PUBLIC_WEBSHOT_URL
ARG NEXT_PUBLIC_API_URL

ARG NEXT_PUBLIC_ARCGIS_API_KEY
ARG NEXT_PUBLIC_API_KEY

ARG BASIC_AUTH_ENABLED
ARG BASIC_AUTH_USER
ARG BASIC_AUTH_PASSWORD

ARG PAYLOAD_SECRET
ARG DATABASE_URL
ARG APP_KEY
ARG AUTH_SECRET

ENV NEXT_PUBLIC_URL $NEXT_PUBLIC_URL
ENV NEXT_PUBLIC_WEBSHOT_URL $NEXT_PUBLIC_WEBSHOT_URL
ENV NEXT_PUBLIC_API_URL $NEXT_PUBLIC_API_URL

ENV NEXT_PUBLIC_ARCGIS_API_KEY $NEXT_PUBLIC_ARCGIS_API_KEY
ENV NEXT_PUBLIC_API_KEY $NEXT_PUBLIC_API_KEY

ENV BASIC_AUTH_ENABLED $BASIC_AUTH_ENABLED
ENV BASIC_AUTH_USER $BASIC_AUTH_USER
ENV BASIC_AUTH_PASSWORD "$BASIC_AUTH_PASSWORD"

ENV PAYLOAD_SECRET $PAYLOAD_SECRET
ENV DATABASE_URL $DATABASE_URL
ENV APP_KEY $APP_KEY
ENV AUTH_SECRET $AUTH_SECRET

ENV COREPACK_INTEGRITY_KEYS 0

ENV NEXT_TELEMETRY_DISABLED=1

ENV NODE_ENV=production
# Uncomment the following line in case you want to disable telemetry during runtime.
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Enable pnpm for running migrations
RUN corepack enable pnpm

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY entrypoint.sh ./

USER nextjs

EXPOSE 3000

ENV PORT=3000

ENTRYPOINT ["/bin/sh", "./entrypoint.sh"]
