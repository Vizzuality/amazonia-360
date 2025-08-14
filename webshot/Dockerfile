# -------- Base with Playwright Dependencies --------
FROM node:24.2.0 AS production

WORKDIR /app

# Enable pnpm globally
RUN corepack enable pnpm

# Install Playwright browsers (specifically chromium)
#
# @debt The version of Playwright used here _must_ be the same used in the
# webshot package.json file, so that the browser builds installed here are
# exactly the same as those expected by the Playwright library. Alternatively,
# chromium and dependencies should be installed via the playwright binary
# directly exposed in the Playwright module installed via pnpm.
RUN pnpx playwright@1.54.2 install chromium --with-deps

COPY package.json pnpm-lock.yaml tsconfig.json nest-cli.json entrypoint.sh ./
COPY ./src ./src
COPY ./config ./config

# Use BuildKit cache mount for pnpm store
RUN --mount=type=cache,id=pnpm-store-dev,target=/root/.local/share/pnpm/store/v3 \
    pnpm install --frozen-lockfile \
    && pnpm build

# Define ARG defaults, can be overridden during build
ARG LINUX_UID=5000
ARG LINUX_GID=5000

# Create user and group first
RUN groupadd -g ${LINUX_GID} webshotuser \
    && useradd -u ${LINUX_UID} -g webshotuser -m -s /bin/bash webshotuser

# Prune the store after everything potentially needing dev deps is done
RUN pnpm store prune

# Assuming entrypoint.sh is copied within ./webshot
ENTRYPOINT ["/bin/sh", "./entrypoint.sh"]
