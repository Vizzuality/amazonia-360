# ai-explorations

Proof of concept that ports `client/` (Next.js + Payload 3) to [TanStack Start](https://tanstack.com/start) + [Payload 4 beta](https://payloadcms.com/docs/v4/migration-guide/v4) through `@payloadcms/tanstack-start`. It reproduces the client's routes, CMS, auth and tests on a separate database. It is not production code and is excluded from CI and SonarCloud.

|                   |                                                                                 |
| ----------------- | ------------------------------------------------------------------------------- |
| Framework         | TanStack Start 1.169 + TanStack Router 1.170, Vite 8                            |
| CMS               | Payload `4.0.0-beta.4` (Postgres adapter), admin at `/admin`, REST at `/v1/api` |
| Language          | TypeScript 7 (`tsc`), TypeScript 6 API for ESLint (see [Tooling](#tooling))     |
| Production server | [srvx](https://srvx.h3.dev/)                                                    |

## Prerequisites

- Node `24.22.1` (`.nvmrc`; `nvm use` in this directory)
- pnpm `10.29.2`
- PostgreSQL from the repo's Docker Compose `database` service (`docker compose --profile local up database`), listening on `localhost:5432`

## Install

The app has its own `package.json` and `pnpm-lock.yaml`. The root `pnpm -r` scripts (`build`, `lint`, `test`, `format`, `check`, `clean`) skip it with `--filter=!ai-explorations`, so run its scripts from this directory:

```sh
pnpm install --ignore-workspace
```

Add dependencies with `pnpm add -E --ignore-workspace <pkg>@<version>` (exact pins only).

## Environment

Copy `.env.default` to `.env.local` and fill it in. Vite loads it for `dev`/`build`; `payload` and `start` pass it to Node with `--env-file-if-exists`. Variables are validated at build and boot by `@t3-oss/env-core` in `src/env.ts`: a missing required variable fails the build and names the variable.

Browser-exposed variables use the `VITE_` prefix; each replaces the client's `NEXT_PUBLIC_` variable of the same name. `VITE_*` values are inlined at build time, so changing one needs a rebuild.

| Variable                             | Required | Description                                                                                                                       |
| ------------------------------------ | -------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`                       | yes      | Postgres URL of the app database, `postgres://<user>:<password>@localhost:5432/amazonia360_ai_explorations`                       |
| `DATABASE_PASSWORD`                  | no       | Password merged into `DATABASE_URL` when the URL carries none                                                                     |
| `PAYLOAD_SECRET`                     | yes      | Payload signing secret                                                                                                            |
| `AWS_SES_IAM_USER_ACCESS_KEY_ID`     | yes      | SES key id. Empty or `no-ses-configured` switches email to a JSON transport (see [Emails](#emails))                               |
| `AWS_SES_IAM_USER_SECRET_ACCESS_KEY` | yes      | SES secret (may be empty with the JSON transport)                                                                                 |
| `AWS_SES_REGION`                     | yes      | SES region (may be empty with the JSON transport)                                                                                 |
| `BASIC_AUTH_ENABLED`                 | yes      | `true` puts frontend pages and server functions behind HTTP basic auth                                                            |
| `BASIC_AUTH_USER`                    | yes      | Basic auth user                                                                                                                   |
| `BASIC_AUTH_PASSWORD`                | yes      | Basic auth password                                                                                                               |
| `VITE_URL`                           | yes      | Public URL of this app, `http://localhost:3100` locally                                                                           |
| `VITE_API_URL`                       | yes      | AmazoniaForever360+ API (H3 grid, AI summaries)                                                                                   |
| `VITE_API_KEY`                       | yes      | API key for `VITE_API_URL`                                                                                                        |
| `VITE_ARCGIS_API_KEY`                | yes      | ArcGIS API key                                                                                                                    |
| `VITE_GTM_ID`                        | no       | Google Tag Manager id; GTM and the cookie banner render only when set                                                             |
| `VITE_FEATURE_FLAGS`                 | no       | Comma-separated flags, e.g. `country-module`                                                                                      |
| `VITE_E2E_BRIDGE`                    | no       | `true` mounts the e2e test bridge on report pages. Set by the Playwright web server, never in a deployed build                    |
| `E2E_SEED_SECRET`                    | no       | Enables `/local-api/e2e/seed-*`; without it those routes return 404 and, outside CI, the specs that need seeded users are skipped |
| `SKIP_ENV_VALIDATION`                | no       | Skips env validation; set by the Vitest config only                                                                               |

## Ports

| Service                             | Port                                           |
| ----------------------------------- | ---------------------------------------------- |
| ai-explorations (`dev` and `start`) | `3100` (`strictPort`, fails instead of moving) |
| client (Next.js)                    | `3000`                                         |
| Postgres                            | `5432`                                         |

Both apps can run at the same time. The auth cookie uses its own prefix, so signing in on one does not affect the other on `localhost`.

## Database

The app uses its own database, `amazonia360_ai_explorations`, created from a dump of the client database and migrated to Payload 4. It never connects to the client database (`amazonia360`).

1. Dump the client database (custom format):

   ```sh
   pg_dump -h localhost -p 5432 -U amazonia360 -Fc -f amazonia360.dump amazonia360
   ```

2. Create the app database and restore the dump into it:

   ```sh
   createdb -h localhost -p 5432 -U amazonia360 amazonia360_ai_explorations
   pg_restore -h localhost -p 5432 -U amazonia360 --no-owner -d amazonia360_ai_explorations amazonia360.dump
   ```

3. Run the migrations:

   ```sh
   pnpm payload migrate:status
   pnpm payload migrate
   ```

   `src/cms/migrations` holds the client's migrations plus `20261026_151428_payload_4_upgrade`, the Payload 3 to 4 delta. The adapter runs with `push: false` in every environment, so the schema changes only through migrations.

**Dumps from deployed environments:** the Payload 4 migration runs `ALTER TABLE "payload_jobs_log" ALTER COLUMN "input" SET NOT NULL`. It fails when the dump has `payload_jobs_log` rows with a `NULL` `input` (a local database usually has none). Check before migrating:

```sql
SELECT count(*) FROM payload_jobs_log WHERE input IS NULL;
```

Delete or backfill those rows in `amazonia360_ai_explorations` first.

The migration also copies `_status` into the per-locale tables for localized drafts collections, because Payload 4 stores status per locale. Content that exists only in English (subtopics, reports) has no `es`/`pt` rows, so it does not show on `/es` and `/pt`, where the client falls back to English. The seed publishes the catalogue (topics, subtopics, indicators) in `es` and `pt` and copies English into a missing translation, so run it after migrating; reports stay English-only.

### Seeding

A database restored from a client dump already holds the seeded content. To seed an empty, migrated database, run the client's seeder through Payload:

```sh
pnpm payload run src/cms/seed/seed-data.ts
```

It prints `Seeded <n> topics, …` on success. `SEED_PREVIEW=true` also creates the preview users (password from `PREVIEW_USERS_PASSWORD`).

After a schema change, regenerate the generated files:

```sh
pnpm generate:types
pnpm generate:importmap
```

## Scripts

| Script                              | Does                                                                                           |
| ----------------------------------- | ---------------------------------------------------------------------------------------------- |
| `pnpm dev`                          | Vite dev server on `:3100`                                                                     |
| `pnpm build`                        | Production build into `dist/`                                                                  |
| `pnpm start`                        | Serves `dist/` with srvx on `:3100` (run `build` first)                                        |
| `pnpm payload <cmd>`                | Payload CLI with `.env.local` loaded (`migrate`, `migrate:status`, `migrate:create`, `run`, …) |
| `pnpm generate:types`               | Regenerates `src/payload-types.ts`                                                             |
| `pnpm generate:importmap`           | Regenerates `src/app/_payload/importMap.js`                                                    |
| `pnpm test`                         | Vitest unit tests (`src/**/*.test.ts(x)`, node + jsdom projects)                               |
| `pnpm test:integration`             | Vitest Browser Mode tests (`src/**/*.integration.test.tsx`, headless Chromium)                 |
| `pnpm test:e2e`                     | Playwright e2e against `:3100`                                                                 |
| `pnpm test:e2e:ui`                  | Playwright UI mode                                                                             |
| `pnpm test:e2e:report`              | Opens the last Playwright HTML report                                                          |
| `pnpm lint` / `pnpm lint:fix`       | ESLint                                                                                         |
| `pnpm format` / `pnpm format:check` | Prettier (with `prettier-plugin-tailwindcss`)                                                  |
| `pnpm typecheck`                    | `tsc --noEmit --incremental false`                                                             |

## Deploy (Railway)

The app deploys as its own Railway service, `ai-explorations`, with its own Postgres service, in the same project as the client. Nothing about it is in the repo besides `Dockerfile`, `.dockerignore` and `predeploy.sh`; the service is configured in the dashboard.

The `Dockerfile` builds from this directory (`pnpm install --ignore-workspace`), runs `pnpm build`, and ships a runner stage with production dependencies, `dist/`, `src/` and `datum/` (the Payload CLI needs the last two for migrations and the seed). It runs as the `node` user and starts srvx on `0.0.0.0:$PORT` (`3100` when `PORT` is unset). Local `pnpm start` is unchanged.

`predeploy.sh` runs `payload migrate`, then the catalogue seed (`src/cms/seed/seed-data.ts`). `--preview` also seeds the preview users (`SEED_PREVIEW=true`). The seed updates every topic, subtopic, indicator, country module and partner in `datum/`, so it overwrites CMS edits to them on every deploy, as on the client.

Build and run the image locally:

```sh
docker build -t ai-explorations:local \
  --build-arg VITE_URL=http://localhost:3200 \
  --build-arg VITE_API_URL=https://dev.amazoniaforever360.org/api \
  --build-arg VITE_API_KEY=<key> \
  --build-arg VITE_ARCGIS_API_KEY=<key> \
  .
docker run --rm --env-file <runtime vars> ai-explorations:local sh ./predeploy.sh
docker run --rm -p 3200:3200 -e PORT=3200 --env-file <runtime vars> ai-explorations:local
```

### Service settings

- [ ] **Source:** this repo, branch to deploy; **Root Directory** `ai-explorations`
- [ ] **Builder:** Dockerfile. `Dockerfile` sits in the root directory, so no `RAILWAY_DOCKERFILE_PATH` is needed
- [ ] **Watch Paths:** `ai-explorations/**`, so client and API changes don't redeploy it, and its changes don't redeploy them
- [ ] **Pre-deploy command:** `sh ./predeploy.sh` (`sh ./predeploy.sh --preview` to also create the preview logins)
- [ ] **Healthcheck path:** `/local-api/health`. It returns `200` only when `VITE_API_URL/health` answers `200`, so a sleeping or broken API fails the deploy
- [ ] **Postgres:** a new Postgres service for this app only; set `DATABASE_URL` to a reference to it, `${{<postgres service>.DATABASE_URL}}`. Never point it at the client's database
- [ ] **Serverless (sleep when idle):** on, as for the other services
- [ ] **Networking:** generate a public domain; Railway sets `PORT`, don't set it yourself
- [ ] **Variables** (below)

Railway passes service variables to the build only for variables the `Dockerfile` declares with `ARG` ([Railway Dockerfile docs](https://docs.railway.com/guides/dockerfiles)). The `Dockerfile` declares the `VITE_*` variables only. They are inlined into the bundle and also set as `ENV` in the runner image, because the Payload CLI in `predeploy.sh` loads `src/env.ts` from source. Server variables are read at runtime and never enter an image layer; the build validates against placeholders instead.

| Variable                             | When                     | Secret | Value                                                                              |
| ------------------------------------ | ------------------------ | ------ | ---------------------------------------------------------------------------------- |
| `VITE_URL`                           | build (baked)            | no     | The service's public URL, `https://<domain>`                                       |
| `VITE_API_URL`                       | build (baked)            | no     | `https://dev.amazoniaforever360.org/api` (or the Railway API service's public URL) |
| `VITE_API_KEY`                       | build (baked)            | no¹    | Same as the client's `NEXT_PUBLIC_API_KEY`                                         |
| `VITE_ARCGIS_API_KEY`                | build (baked)            | no¹    | Same as the client's `NEXT_PUBLIC_ARCGIS_API_KEY`                                  |
| `VITE_GTM_ID`                        | build (baked)            | no     | Optional; GTM and the cookie banner render only when set                           |
| `VITE_FEATURE_FLAGS`                 | build (baked)            | no     | e.g. `country-module`                                                              |
| `DATABASE_URL`                       | runtime, pre-deploy      | yes    | Reference to this app's Postgres service                                           |
| `PAYLOAD_SECRET`                     | runtime, pre-deploy      | yes    | New random value, not the client's                                                 |
| `BASIC_AUTH_ENABLED`                 | runtime                  | no     | `true`                                                                             |
| `BASIC_AUTH_USER`                    | runtime                  | yes    | Basic auth user                                                                    |
| `BASIC_AUTH_PASSWORD`                | runtime                  | yes    | Basic auth password                                                                |
| `AWS_SES_IAM_USER_ACCESS_KEY_ID`     | runtime, pre-deploy      | yes    | See [Emails on Railway](#emails-on-railway)                                        |
| `AWS_SES_IAM_USER_SECRET_ACCESS_KEY` | runtime, pre-deploy      | yes    | See [Emails on Railway](#emails-on-railway)                                        |
| `AWS_SES_REGION`                     | runtime, pre-deploy      | no     | See [Emails on Railway](#emails-on-railway)                                        |
| `PREVIEW_USERS_PASSWORD`             | pre-deploy (`--preview`) | yes    | Password of the preview logins; without it they get the seeder's default password  |
| `PORT`                               | runtime                  | no     | Set by Railway                                                                     |

¹ Inlined into the browser bundle, so public once deployed, but keep them out of logs and the repo.

`VITE_E2E_BRIDGE` and `E2E_SEED_SECRET` stay unset on a deployed service. A `VITE_*` change needs a redeploy (rebuild), not a restart.

**Basic auth:** keep `BASIC_AUTH_ENABLED=true`.

### Emails on Railway

With an empty or `no-ses-configured` `AWS_SES_IAM_USER_ACCESS_KEY_ID`, emails go to the JSON transport and are only logged (see [Emails](#emails)): sign-up verification and password-reset emails never arrive, so a new account can't be verified from the inbox. Options:

- Real SES credentials, as on the client service, so verification and reset emails are delivered.
- Seeded preview logins (`sh ./predeploy.sh --preview` with `PREVIEW_USERS_PASSWORD`), which are created verified, and leave sign-up untested on the deployment.

## Auth

- Payload built-in auth replaces NextAuth. `users` is the frontend collection, `admins` the `/admin` collection. Sign-up, email verification, sign-in, sign-out, forgot and reset password run as TanStack Start server functions in `src/lib/auth/`.
- The session is an HTTP-only cookie, `ai-explorations-token` (`cookiePrefix: "ai-explorations"`), valid for 30 days.
- **One auth collection per browser at a time.** Payload 4 uses a single token cookie for all auth collections, so signing in to `/admin` replaces a frontend session and signing in on the frontend replaces an admin session. The client keeps separate sessions for both. Frontend gates accept only a `users` token, so an admin session counts as signed out on the frontend.
- Basic auth (`BASIC_AUTH_*`) covers frontend pages and server functions. `/admin`, `/v1/api`, `/local-api` and static files skip it, as in the client.

## Emails

With an empty or `no-ses-configured` `AWS_SES_IAM_USER_ACCESS_KEY_ID`, Payload uses a nodemailer JSON transport: emails are rendered and logged, nothing is sent. Verification and reset links are read from the server log or the database.

## E2E

- Playwright starts `pnpm dev` on `:3100` with `BASIC_AUTH_ENABLED=false` and `VITE_E2E_BRIDGE=true`, or reuses a server already on that port. A reused server needs the same settings.
- Set `E2E_SEED_SECRET` in the shell that runs Playwright, and in `.env.local` when reusing a running server. Outside CI, specs that need seeded users are skipped without it; in CI they fail.
- Test users (`E2E_TEST_USER_*`, `E2E_TEST_VIEWER_*`, `E2E_ADMIN_*`) are generated per run with random passwords unless set in the environment. Each run adds new users to `amazonia360_ai_explorations`.
- Token reads go through `psql` and refuse any database other than `amazonia360_ai_explorations`.

## Tooling

- TypeScript 7 has no compiler API, and `typescript-eslint` supports TypeScript `<6.1.0`. Following the [TypeScript 7 side-by-side setup](https://devblogs.microsoft.com/typescript/?p=5246), `typescript` is aliased to `@typescript/typescript6` (the API ESLint imports) and `@typescript/native` to `typescript@7.0.2` (the `tsc` binary `typecheck` runs). See [typescript-eslint#12518](https://github.com/typescript-eslint/typescript-eslint/issues/12518).
- ESLint stays on 9.x: `eslint-plugin-react`, `eslint-plugin-jsx-a11y` and `eslint-plugin-import` do not declare ESLint 10 support.
- `typecheck` is non-incremental; a stale TypeScript 7 build-info cache reports errors that do not exist.

## Differences from client

- Payload 4 beta instead of 3; built-in auth instead of NextAuth. The GitHub provider, `AUTH_SECRET` and `AUTH_URL` are not ported.
- URL state uses TanStack Router search params instead of nuqs, with the same parameter names and serialization (`bbox`, `defaultTopics`, `country`).
- The leave-page guard uses TanStack Router's `useBlocker` instead of `next-navigation-guard`.
- Reports migrated from the client database show only in English (see [Database](#database)). The seed writes English into a missing catalogue translation instead of relying on Payload's locale fallback.
- The session token has a fixed 30-day expiry; NextAuth's session was rolling.
- Report pages return only the owner's id to other viewers, and markdown output is sanitized; the client does neither.
- The report summary editor mounts only while editing and does not process raw HTML. A summary containing raw HTML loads in the editor only up to the first tag, so saving an edit of such a summary drops the rest.
- Library majors are newer than in the client (ArcGIS 5, visx 4, TanStack Table 9, jotai 3, lucide-react 1, …), which causes some markup differences (for example `aria-hidden` on lucide icons).
