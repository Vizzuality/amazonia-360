import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseEnv } from "node:util";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const APP_DATABASE = "amazonia360_ai_explorations";
const APP_ENV_FILE = path.resolve(__dirname, "../../.env.local");

type UserToken = "_verificationtoken" | "reset_password_token";

function getDatabaseUrl(): URL {
  const raw =
    process.env.E2E_DATABASE_URL ?? parseEnv(fs.readFileSync(APP_ENV_FILE, "utf8")).DATABASE_URL;
  const url = raw ? new URL(raw) : null;

  if (url?.pathname !== `/${APP_DATABASE}` || url.search !== "" || url.hash !== "") {
    throw new Error(`E2E token reads only run against the ${APP_DATABASE} database`);
  }

  return url;
}

function getPsqlArgs(url: URL): string[] {
  return [
    "--host",
    url.hostname,
    "--port",
    url.port || "5432",
    "--username",
    decodeURIComponent(url.username),
    "--dbname",
    APP_DATABASE,
  ];
}

// Emails go to a JSON transport locally, so the token a link would carry is read from the DB.
export function getUserToken(email: string, token: UserToken): string {
  const url = getDatabaseUrl();
  const output = execFileSync("psql", [...getPsqlArgs(url), "-tAX", "-v", `email=${email}`], {
    input: `select ${token} from users where email = :'email';`,
    encoding: "utf8",
    env: { ...process.env, PGPASSWORD: decodeURIComponent(url.password) },
  }).trim();

  if (!output) throw new Error(`No ${token} stored for ${email}`);
  return output;
}
