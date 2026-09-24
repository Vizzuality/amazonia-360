import { defineRailway, github, postgres, preserve, project, service } from "railway/iac";

/**
 * Preview environments for the Next client + Payload CMS.
 *
 * Scope: this project owns previews and the template environment they fork
 * from. dev, staging and production stay on Elastic Beanstalk, and the Python
 * API stays there too — the client points at the Beanstalk dev API below.
 * See .claude/adr/0007-previews-move-to-railway-everything-else-stays.md
 *
 * This file is declarative and total: a variable that is not listed here is
 * DELETED on the next apply, and a limit that is not set here reverts to the
 * platform default. `preserve()` keeps a value that lives in Railway and must
 * not be written into source.
 */

// Railway defaults new services to us-west; the people reading these previews
// are in Europe, so the browser round trip is what matters here.
const REGION = "europe-west4";

const GB = 1_000_000_000;

export default defineRailway(() => {
  // KNOWN DRIFT, do not try to fix it. `postgres()` takes only a region, so
  // the database's limitOverride cannot be expressed here, and a managed
  // database always carries an explicit one. Every `railway config plan` will
  // therefore report one pending change nulling postgres's cpu/memoryBytes.
  // Applying it does not stick — the value comes straight back — so the plan
  // never reads clean and `--detailed-exit-code` is useless as a CI drift
  // gate for this project. The limits are set out of band at 1 vCPU / 2 GB
  // via the serviceInstanceLimitsUpdate mutation.
  const db = postgres("postgres", { region: REGION });

  const client = service("client", {
    source: github("Vizzuality/amazonia-360", { branch: "develop" }),
    rootDirectory: "client",
    replicas: { [REGION]: 1 },

    // Runs before the deployment goes live, in a separate container, and a
    // failure aborts the deploy — so a preview is either seeded or absent.
    // Railway accepts exactly one pre-deploy command, so the steps are chained
    // inside db:provision. Their order is load-bearing: db:seed without a
    // prior migrate triggers db-postgres dev-push, which poisons
    // payload_migrations.
    preDeploy: "pnpm db:provision",

    deploy: {
      limitOverride: { containers: { cpu: 1, memoryBytes: 2 * GB } },
    },

    env: {
      DATABASE_URL: db.env.DATABASE_URL,

      // Resolves per environment, so a PR preview gets its own domain.
      NEXT_PUBLIC_URL: "https://${{RAILWAY_PUBLIC_DOMAIN}}",

      // Must be set even though env.mjs marks it optional. The Dockerfile
      // turns every build ARG into an ENV, so an unset AUTH_URL reaches zod as
      // "" rather than undefined, and z.url() rejects the empty string.
      AUTH_URL: "https://${{RAILWAY_PUBLIC_DOMAIN}}",

      // The API is not deployed here. Previews read tiles and metadata from
      // the Beanstalk dev API, which serves allow_origins=["*"], so the
      // cross-origin call needs no change on that side.
      NEXT_PUBLIC_API_URL: "https://dev.amazoniaforever360.org/api",

      // Every environment in this project is publicly reachable and carries a
      // seeded admin with known credentials. Basic auth is not optional here.
      BASIC_AUTH_ENABLED: "true",
      BASIC_AUTH_USER: preserve(),
      BASIC_AUTH_PASSWORD: preserve(),

      // Generated for this project rather than copied from any real
      // environment: these previews are public and carry a seeded admin, so a
      // shared session-signing secret would make one compromise portable.
      PAYLOAD_SECRET: preserve(),
      AUTH_SECRET: preserve(),
      APP_KEY: preserve(),

      // Already shipped to the browser by design, so copying them from the
      // team .env exposes nothing new.
      NEXT_PUBLIC_API_KEY: preserve(),
      NEXT_PUBLIC_ARCGIS_API_KEY: preserve(),

      // env.mjs makes these mandatory at build time. Placeholders: a public
      // preview cloned into every PR is the last place to keep credentials
      // that send mail as amazoniaforever360.org. Outbound email fails at
      // runtime, which the seeded user does not need — it is force-verified.
      AWS_SES_IAM_USER_ACCESS_KEY_ID: preserve(),
      AWS_SES_IAM_USER_SECRET_ACCESS_KEY: preserve(),
      AWS_SES_REGION: "eu-west-3",
    },
  });

  return project("amazonia-360", {
    resources: [db, client],
  });
});
