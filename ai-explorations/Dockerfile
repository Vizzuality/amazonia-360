FROM node:24.22.1-bookworm-slim AS base

WORKDIR /app

RUN corepack enable pnpm && corepack prepare pnpm@10.29.2 --activate

FROM base AS deps

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --ignore-workspace

FROM base AS prod-deps

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --ignore-workspace --prod

FROM base AS builder

ARG VITE_URL
ARG VITE_API_URL
ARG VITE_API_KEY
ARG VITE_ARCGIS_API_KEY
ARG VITE_GTM_ID
ARG VITE_FEATURE_FLAGS

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# src/env.ts validates server variables during the build too; these placeholders satisfy it
# without baking real secrets into a layer. The server reads the real values at runtime.
RUN DATABASE_URL=postgres://build:build@localhost:5432/build \
    PAYLOAD_SECRET=build-time-placeholder \
    BASIC_AUTH_ENABLED=false \
    BASIC_AUTH_USER=build-time-placeholder \
    BASIC_AUTH_PASSWORD=build-time-placeholder \
    AWS_SES_IAM_USER_ACCESS_KEY_ID=no-ses-configured \
    AWS_SES_IAM_USER_SECRET_ACCESS_KEY= \
    AWS_SES_REGION= \
    pnpm build

FROM node:24.22.1-bookworm-slim AS runner

WORKDIR /app

ARG VITE_URL
ARG VITE_API_URL
ARG VITE_API_KEY
ARG VITE_ARCGIS_API_KEY
ARG VITE_GTM_ID
ARG VITE_FEATURE_FLAGS

# The Payload CLI in predeploy.sh loads src/env.ts from source, where VITE_* are not inlined.
ENV VITE_URL=$VITE_URL
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_API_KEY=$VITE_API_KEY
ENV VITE_ARCGIS_API_KEY=$VITE_ARCGIS_API_KEY
ENV VITE_GTM_ID=$VITE_GTM_ID
ENV VITE_FEATURE_FLAGS=$VITE_FEATURE_FLAGS

ENV NODE_ENV=production
ENV NODE_OPTIONS=--no-deprecation
ENV PORT=3100

RUN chown node:node /app

COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY package.json tsconfig.json predeploy.sh ./
COPY src ./src
COPY datum ./datum

USER node

EXPOSE 3100

CMD ["node", "./node_modules/srvx/bin/srvx.mjs", "--prod", "--host=0.0.0.0", "--dir=.", "--static=dist/client", "--entry=dist/server/server.js"]
