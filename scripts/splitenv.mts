#!/usr/bin/env node

/**
 * This script splits an .env file into multiple .env files based on prefixes
 * provided on the command line, also stripping the matching prefix from the
 * environment variable names.
 *
 * This script uses core node modules to parse CLI arguments and .env files.
 *
 * For example, given a .env file with the following content:
 *
 * API_KEY=1234567890
 * APP_NAME=MyApp
 * DATABASE_URL=postgres://localhost:5432/mydb
 *
 * node splitenv.mts .env API APP
 *
 * This will read the .env file, check if both an `api` and `app` folders exist
 * (relative to the current working directory), and then create .env files in
 * each of these folders (overwriting any existing .env files there), picking
 * only env vars with a prefix matching the directory name, alongside any
 * unprefixed variables.
 *
 * api/.env will contain:
 *
 * API_KEY=1234567890
 *
 * app/.env will contain:
 *
 * APP_NAME=MyApp
 * DATABASE_URL=postgres://localhost:5432/mydb
 *
 * api/.env will contain:
 *
 * API_KEY=1234567890
 * DATABASE_URL=postgres://localhost:5432/mydb
 */

import { inspect, parseArgs } from "node:util";
import { parseEnv } from "node:util";
import { readFileSync, statSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";

const PREFIX_SEPARATOR = "__";
const PREFIX_RE = /^[A-Z]([A-Z]|[_-][A-Z])*$/;

const USAGE = `Usage:
  ${basename(process.argv[1])} <path-to-.env> <PREFIX> [PREFIX2 ...]

Examples:
  ${basename(process.argv[1])} .env API FRONTEND

Options:
  -h, --help      Show this help
  -v, --verbose   Show verbose output`;

const helpAndExit = (code = 0): never => {
  console.log(USAGE);
  process.exit(code);
};

const fail = (msg: string): void => {
  console.error(`Error: ${msg}\n`);
  helpAndExit(1);
};

const validatePath = (p: string) => {
  try {
    const st = statSync(p);
    if (!st.isFile()) fail(`'${p}' is not a file.`);
  } catch {
    fail(`Cannot access .env file at '${p}'.`);
  }
};

const validatePrefixes = (prefixes: string[]) => {
  if (prefixes.length === 0) fail("At least one PREFIX is required.");
  const bad = prefixes.filter((p) => !PREFIX_RE.test(p));
  if (bad.length) fail(`Invalid prefix(es): ${bad.join(", ")}`);
};

const readAndParseEnvFile = (path: string): Record<string, string> => {
  validatePath(path);
  const raw = readFileSync(path, "utf8");
  const parsed = parseEnv(raw) as Record<string, string>;
  return parsed;
};

const groupEnvVarsByPrefix = (
  parsed: Record<string, string>,
  prefixes: string[],
): Map<string, Record<string, string>> => {
  const groups = new Map<string, Record<string, string>>();
  for (const p of prefixes) groups.set(p, {});
  // group for unprefixed vars, or vars with prefix that don't match any of the ones requested
  groups.set("rest", {});

  for (const [k, v] of Object.entries(parsed)) {
    const matchingPrefix = prefixes.find((p) =>
      k.startsWith(`${p}${PREFIX_SEPARATOR}`),
    );
    if (matchingPrefix) {
      groups.get(matchingPrefix)![k] = v;
    } else {
      groups.get("rest")![k] = v;
    }
  }
  return groups;
};

const stripPrefixFromEnvVarGroups = (
  groups: Map<string, Record<string, string>>,
): Map<string, Record<string, string>> => {
  const strippedGroups = new Map<string, Record<string, string>>();
  for (const [prefix, vars] of groups) {
    const strippedVars = Object.fromEntries(
      Object.entries(vars).map(([key, value]) => [
        key.replace(`${prefix}${PREFIX_SEPARATOR}`, ""),
        value,
      ]),
    );
    strippedGroups.set(prefix, strippedVars);
  }
  return strippedGroups;
};

const listFoldersFromPrefixesAndCheckIfFoldersExist = (
  prefixes: string[],
): string[] => {
  const folders = prefixes.map((prefix) => prefix.toLowerCase());
  for (const folder of folders) {
    const folderPath = join(process.cwd(), folder);
    try {
      const st = statSync(folderPath);
      if (!st.isDirectory()) {
        fail(`'${folderPath}' exists but is not a directory.`);
      }
    } catch {
      fail(`Directory '${folderPath}' does not exist.`);
    }
  }
  return folders;
};

const generatePerPrefixDotenvFile = (
  envPath: string,
  folders: string[],
  strippedGroups: Map<string, Record<string, string>>,
) => {
  const noticeText = `# file generated via splitenv script from the source file at ../${envPath} on ${new Date().toISOString()}`;

  const restVars = strippedGroups.get("rest") || {};
  for (const [prefix, vars] of strippedGroups) {
    const folder = folders.find((f) => f === prefix.toLowerCase());
    if (!folder) continue;
    const filePath = join(process.cwd(), folder, ".env");
    console.log(`Generating ${filePath}`);
    const combinedVars = { ...restVars, ...vars };
    try {
      writeFileSync(
        filePath,
        noticeText +
          "\n" +
          Object.entries(combinedVars)
            .map(([key, value]) => {
              // If value contains newlines or quotes, wrap in quotes and escape internal quotes
              if (value.includes("\n") || value.includes('"')) {
                const escapedValue = value
                  .replace(/\\/g, "\\\\")
                  .replace(/"/g, '\\"');
                return `${key}="${escapedValue}"`;
              }
              return `${key}=${value}`;
            })
            .join("\n") +
          "\n",
      );
    } catch (error) {
      fail(`Failed to write '${filePath}': ${error}`);
    }
  }
};

const main = () => {
  const { values, positionals } = parseArgs({
    options: {
      help: { type: "boolean", short: "h" },
      verbose: { type: "boolean", short: "v" },
    },
    allowPositionals: true,
  });
  if (values.help) helpAndExit(0);

  const [envPath, ...prefixes] = positionals;
  if (!envPath) fail("Missing <path-to-.env>.");

  validatePrefixes(prefixes);

  const parsed = readAndParseEnvFile(envPath);

  const groups = groupEnvVarsByPrefix(parsed, prefixes);
  const strippedGroups = stripPrefixFromEnvVarGroups(groups);

  const folders = listFoldersFromPrefixesAndCheckIfFoldersExist(prefixes);
  generatePerPrefixDotenvFile(envPath, folders, strippedGroups);

  if (values.verbose) {
    console.log(inspect(strippedGroups));
  }

  if (values.verbose) {
    console.error(
      `\nParsed ${Object.keys(parsed).length} vars. ` +
        `${prefixes.map((p) => `${p}: ${Object.keys(groups.get(p)!).length}`).join(" ")} `,
    );
  }
};

main();
