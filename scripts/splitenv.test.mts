import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  rmSync,
  existsSync,
} from "node:fs";
import { join, dirname } from "node:path";
import { execFileSync, execSync, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SCRIPT_PATH = join(__dirname, "splitenv.mts");

describe("splitenv.mts", () => {
  let testDir: string;
  let envFile: string;

  beforeEach(() => {
    // Create a temporary test directory
    testDir = join(__dirname, "__test-splitenv-temp__");
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
    mkdirSync(testDir, { recursive: true });
    envFile = join(testDir, ".env");
  });

  afterEach(() => {
    // Clean up test directory
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  const runScript = (args: string[], cwd?: string) => {
    const workDir = cwd || testDir;
    try {
      return execFileSync(
        "node",
        ["--experimental-strip-types", "--no-warnings", SCRIPT_PATH, ...args],
        {
          cwd: workDir,
          encoding: "utf-8",
          stdio: ["pipe", "pipe", "pipe"],
        },
      );
    } catch (error: any) {
      throw new Error(error.stderr || error.stdout || error.message);
    }
  };

  describe("argument parsing and validation", () => {
    it("should show help with --help flag", () => {
      const output = execFileSync(
        "node",
        ["--experimental-strip-types", "--no-warnings", SCRIPT_PATH, "--help"],
        {
          encoding: "utf-8",
        },
      );
      expect(output).toContain("Usage:");
      expect(output).toContain("Examples:");
      expect(output).toContain("Options:");
    });

    it("should fail when no arguments provided", () => {
      expect(() => runScript([])).toThrow(/Missing <path-to-.env>/);
    });

    it("should fail when only env path provided without prefixes", () => {
      writeFileSync(envFile, "KEY=value\n");
      expect(() => runScript([envFile])).toThrow(
        /At least one PREFIX is required/,
      );
    });

    it("should fail for invalid prefixes (lowercase)", () => {
      writeFileSync(envFile, "KEY=value\n");
      expect(() => runScript([envFile, "api"])).toThrow(/Invalid prefix/);
    });

    it("should fail for invalid prefixes (with numbers)", () => {
      writeFileSync(envFile, "KEY=value\n");
      expect(() => runScript([envFile, "API123"])).toThrow(/Invalid prefix/);
    });

    it("should fail for invalid prefixes (with special characters)", () => {
      writeFileSync(envFile, "KEY=value\n");
      expect(() => runScript([envFile, "API@TEST"])).toThrow(/Invalid prefix/);
    });

    it("should fail for prefixes starting with underscore", () => {
      writeFileSync(envFile, "KEY=value\n");
      expect(() => runScript([envFile, "_API"])).toThrow(/Invalid prefix/);
    });

    it("should fail for prefixes ending with underscore", () => {
      writeFileSync(envFile, "KEY=value\n");
      expect(() => runScript([envFile, "API_"])).toThrow(/Invalid prefix/);
    });

    it("should fail for prefixes starting with hyphen", () => {
      writeFileSync(envFile, "KEY=value\n");
      // Note: parseArgs interprets -API as a flag, so we get a parseArgs error instead
      expect(() => runScript([envFile, "-API"])).toThrow();
    });

    it("should fail for prefixes ending with hyphen", () => {
      writeFileSync(envFile, "KEY=value\n");
      expect(() => runScript([envFile, "API-"])).toThrow(/Invalid prefix/);
    });

    it("should fail for prefixes with consecutive underscores", () => {
      writeFileSync(envFile, "KEY=value\n");
      expect(() => runScript([envFile, "API__TEST"])).toThrow(/Invalid prefix/);
    });

    it("should fail for prefixes with consecutive hyphens", () => {
      writeFileSync(envFile, "KEY=value\n");
      expect(() => runScript([envFile, "API--TEST"])).toThrow(/Invalid prefix/);
    });

    it("should accept valid uppercase prefixes", () => {
      writeFileSync(envFile, "API__KEY=value\n");
      const apiDir = join(testDir, "api");
      mkdirSync(apiDir);
      expect(() => runScript([envFile, "API"])).not.toThrow();
    });

    it("should accept prefixes with single underscores", () => {
      writeFileSync(envFile, "API_CLIENT__KEY=value\n");
      const apiDir = join(testDir, "api_client");
      mkdirSync(apiDir);
      expect(() => runScript([envFile, "API_CLIENT"])).not.toThrow();
    });

    it("should accept prefixes with single hyphens", () => {
      writeFileSync(envFile, "API-CLIENT__KEY=value\n");
      const apiDir = join(testDir, "api-client");
      mkdirSync(apiDir);
      expect(() => runScript([envFile, "API-CLIENT"])).not.toThrow();
    });

    it("should accept prefixes with mixed underscores and hyphens", () => {
      writeFileSync(envFile, "MY_API-CLIENT__KEY=value\n");
      const apiDir = join(testDir, "my_api-client");
      mkdirSync(apiDir);
      expect(() => runScript([envFile, "MY_API-CLIENT"])).not.toThrow();
    });
  });

  describe("file validation", () => {
    it("should fail when env file does not exist", () => {
      const nonExistentFile = join(testDir, "nonexistent.env");
      expect(() => runScript([nonExistentFile, "API"])).toThrow(
        /Cannot access .env file/,
      );
    });

    it("should fail when env path points to a directory", () => {
      const dirPath = join(testDir, "directory");
      mkdirSync(dirPath);
      expect(() => runScript([dirPath, "API"])).toThrow(/is not a file/);
    });
  });

  describe("directory validation", () => {
    it("should fail when target directory does not exist", () => {
      writeFileSync(envFile, "API__KEY=value\n");
      expect(() => runScript([envFile, "API"])).toThrow(
        /Directory.*does not exist/,
      );
    });

    it("should fail when target path exists but is not a directory", () => {
      writeFileSync(envFile, "API__KEY=value\n");
      const filePath = join(testDir, "api");
      writeFileSync(filePath, "not a directory");
      expect(() => runScript([envFile, "API"])).toThrow(
        /exists but is not a directory/,
      );
    });

    it("should succeed when all target directories exist", () => {
      writeFileSync(envFile, "API__KEY=value\n");
      const apiDir = join(testDir, "api");
      mkdirSync(apiDir);
      expect(() => runScript([envFile, "API"])).not.toThrow();
    });
  });

  describe("environment variable parsing", () => {
    it("should parse simple key=value pairs", () => {
      const apiDir = join(testDir, "api");
      mkdirSync(apiDir);

      writeFileSync(envFile, "API__KEY=value123\n");
      runScript([envFile, "API"]);

      const output = readFileSync(join(apiDir, ".env"), "utf-8");
      expect(output).toContain("KEY=value123");
    });

    it("should handle multiple prefixes", () => {
      const apiDir = join(testDir, "api");
      const frontendDir = join(testDir, "frontend");
      mkdirSync(apiDir);
      mkdirSync(frontendDir);

      writeFileSync(envFile, "API__PORT=3000\nFRONTEND__PORT=3001\n");
      runScript([envFile, "API", "FRONTEND"]);

      const apiOutput = readFileSync(join(apiDir, ".env"), "utf-8");
      const frontendOutput = readFileSync(join(frontendDir, ".env"), "utf-8");

      expect(apiOutput).toContain("PORT=3000");
      expect(frontendOutput).toContain("PORT=3001");
    });

    it("should strip prefix from variable names", () => {
      const apiDir = join(testDir, "api");
      mkdirSync(apiDir);

      writeFileSync(envFile, "API__DATABASE_URL=postgres://localhost\n");
      runScript([envFile, "API"]);

      const output = readFileSync(join(apiDir, ".env"), "utf-8");
      expect(output).toContain("DATABASE_URL=postgres://localhost");
      expect(output).not.toContain("API__");
    });

    it("should handle empty values", () => {
      const apiDir = join(testDir, "api");
      mkdirSync(apiDir);

      writeFileSync(envFile, "API__EMPTY=\n");
      runScript([envFile, "API"]);

      const output = readFileSync(join(apiDir, ".env"), "utf-8");
      expect(output).toContain("EMPTY=");
    });

    it("should handle values with equals signs", () => {
      const apiDir = join(testDir, "api");
      mkdirSync(apiDir);

      writeFileSync(envFile, "API__EQUATION=1+1=2\n");
      runScript([envFile, "API"]);

      const output = readFileSync(join(apiDir, ".env"), "utf-8");
      expect(output).toContain("EQUATION=1+1=2");
    });
  });

  describe("unprefixed variables (common/rest variables)", () => {
    it("should copy unprefixed variables to all output files", () => {
      const apiDir = join(testDir, "api");
      const frontendDir = join(testDir, "frontend");
      mkdirSync(apiDir);
      mkdirSync(frontendDir);

      writeFileSync(
        envFile,
        "DATABASE_URL=postgres://localhost\nAPI__PORT=3000\nFRONTEND__PORT=3001\n",
      );
      runScript([envFile, "API", "FRONTEND"]);

      const apiOutput = readFileSync(join(apiDir, ".env"), "utf-8");
      const frontendOutput = readFileSync(join(frontendDir, ".env"), "utf-8");

      expect(apiOutput).toContain("DATABASE_URL=postgres://localhost");
      expect(apiOutput).toContain("PORT=3000");
      expect(frontendOutput).toContain("DATABASE_URL=postgres://localhost");
      expect(frontendOutput).toContain("PORT=3001");
    });

    it("should handle files with only unprefixed variables", () => {
      const apiDir = join(testDir, "api");
      mkdirSync(apiDir);

      writeFileSync(
        envFile,
        "DATABASE_URL=postgres://localhost\nREDIS_URL=redis://localhost\n",
      );
      runScript([envFile, "API"]);

      const output = readFileSync(join(apiDir, ".env"), "utf-8");
      expect(output).toContain("DATABASE_URL=postgres://localhost");
      expect(output).toContain("REDIS_URL=redis://localhost");
    });

    it("should include non-matching prefixed variables as-is in outputs", () => {
      const apiDir = join(testDir, "api");
      mkdirSync(apiDir);

      writeFileSync(
        envFile,
        "API__PORT=3000\nFRONTEND__PORT=3001\nDATABASE_URL=postgres://localhost\n",
      );
      runScript([envFile, "API"]);

      const output = readFileSync(join(apiDir, ".env"), "utf-8");
      expect(output).toContain("PORT=3000");
      expect(output).toContain("DATABASE_URL=postgres://localhost");
      // Non-matching prefixed variables are included as-is in the rest group
      expect(output).toContain("FRONTEND__PORT=3001");
    });
  });

  describe("special value handling", () => {
    it("should handle values with newlines", () => {
      const apiDir = join(testDir, "api");
      mkdirSync(apiDir);

      writeFileSync(envFile, 'API__MULTILINE="line1\nline2\nline3"\n');
      runScript([envFile, "API"]);

      const output = readFileSync(join(apiDir, ".env"), "utf-8");
      // The script escapes newlines when writing
      expect(output).toMatch(/MULTILINE=/);
    });

    it("should handle values with quotes", () => {
      const apiDir = join(testDir, "api");
      mkdirSync(apiDir);

      writeFileSync(envFile, 'API__QUOTED="value with quotes"\n');
      runScript([envFile, "API"]);

      const output = readFileSync(join(apiDir, ".env"), "utf-8");
      expect(output).toContain("QUOTED=");
    });

    it("should handle values with special characters", () => {
      const apiDir = join(testDir, "api");
      mkdirSync(apiDir);

      writeFileSync(envFile, "API__SPECIAL=test!@$%^&*()\n");
      runScript([envFile, "API"]);

      const output = readFileSync(join(apiDir, ".env"), "utf-8");
      expect(output).toContain("SPECIAL=");
    });

    it("should handle values with spaces", () => {
      const apiDir = join(testDir, "api");
      mkdirSync(apiDir);

      writeFileSync(envFile, 'API__WITH_SPACES="value with spaces"\n');
      runScript([envFile, "API"]);

      const output = readFileSync(join(apiDir, ".env"), "utf-8");
      expect(output).toContain("WITH_SPACES=");
    });

    it("should handle values with trailing spaces", () => {
      const apiDir = join(testDir, "api");
      mkdirSync(apiDir);

      writeFileSync(
        envFile,
        'API__WITH_TRAILING_SPACES="value with trailing spaces"   \n',
      );
      runScript([envFile, "API"]);

      const output = readFileSync(join(apiDir, ".env"), "utf-8");
      expect(output).toContain("WITH_TRAILING_SPACES=");
    });

    it("should handle values with trailing comments", () => {
      const apiDir = join(testDir, "api");
      mkdirSync(apiDir);

      writeFileSync(
        envFile,
        'API__WITH_TRAILING_COMMENTS="value with trailing spaces"   # comment\n',
      );
      runScript([envFile, "API"]);

      const output = readFileSync(join(apiDir, ".env"), "utf-8");
      expect(output).toContain("WITH_TRAILING_COMMENTS=");
    });
  });

  describe("output file generation", () => {
    it("should create .env file in target directory", () => {
      const apiDir = join(testDir, "api");
      mkdirSync(apiDir);

      writeFileSync(envFile, "API__KEY=value\n");
      runScript([envFile, "API"]);

      expect(existsSync(join(apiDir, ".env"))).toBe(true);
    });

    it("should overwrite existing .env files", () => {
      const apiDir = join(testDir, "api");
      mkdirSync(apiDir);
      const targetFile = join(apiDir, ".env");

      writeFileSync(targetFile, "OLD_CONTENT=true\n");
      writeFileSync(envFile, "API__NEW_KEY=new_value\n");
      runScript([envFile, "API"]);

      const output = readFileSync(targetFile, "utf-8");
      expect(output).not.toContain("OLD_CONTENT");
      expect(output).toContain("NEW_KEY=new_value");
    });

    it("should include generation notice in output file", () => {
      const apiDir = join(testDir, "api");
      mkdirSync(apiDir);

      writeFileSync(envFile, "API__KEY=value\n");
      runScript([envFile, "API"]);

      const output = readFileSync(join(apiDir, ".env"), "utf-8");
      expect(output).toContain("# file generated via splitenv script");
      expect(output).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it("should generate separate files for each prefix", () => {
      const apiDir = join(testDir, "api");
      const frontendDir = join(testDir, "frontend");
      const backendDir = join(testDir, "backend");
      mkdirSync(apiDir);
      mkdirSync(frontendDir);
      mkdirSync(backendDir);

      writeFileSync(envFile, "API__A=1\nFRONTEND__B=2\nBACKEND__C=3\n");
      runScript([envFile, "API", "FRONTEND", "BACKEND"]);

      expect(existsSync(join(apiDir, ".env"))).toBe(true);
      expect(existsSync(join(frontendDir, ".env"))).toBe(true);
      expect(existsSync(join(backendDir, ".env"))).toBe(true);

      const apiOutput = readFileSync(join(apiDir, ".env"), "utf-8");
      const frontendOutput = readFileSync(join(frontendDir, ".env"), "utf-8");
      const backendOutput = readFileSync(join(backendDir, ".env"), "utf-8");

      expect(apiOutput).toContain("A=1");
      expect(frontendOutput).toContain("B=2");
      expect(backendOutput).toContain("C=3");
    });
  });

  describe("verbose mode", () => {
    it("should show file generation output", () => {
      const apiDir = join(testDir, "api");
      mkdirSync(apiDir);

      writeFileSync(envFile, "API__KEY=value\n");
      const output = execFileSync(
        "node",
        [
          "--experimental-strip-types",
          "--no-warnings",
          SCRIPT_PATH,
          envFile,
          "API",
        ],
        {
          cwd: testDir,
          encoding: "utf-8",
        },
      );

      expect(output).toContain("Generating");
    });

    it("should show detailed output with --verbose flag", () => {
      const apiDir = join(testDir, "api");
      mkdirSync(apiDir);

      writeFileSync(envFile, "API__KEY=value\n");

      // Use spawnSync to capture both stdout and stderr
      const result = spawnSync(
        "node",
        [
          "--experimental-strip-types",
          "--no-warnings",
          SCRIPT_PATH,
          envFile,
          "API",
          "--verbose",
        ],
        {
          cwd: testDir,
          encoding: "utf-8",
        },
      );

      const output = result.stdout + result.stderr;

      // Verbose mode shows the Map structure and parsed variable counts
      expect(output).toMatch(/Map\(\d+\)/);
      expect(output).toContain("Parsed");
      expect(output).toContain("vars");
    });
  });

  describe("real-world scenarios", () => {
    it("should handle complex multi-service configuration", () => {
      const apiDir = join(testDir, "api");
      const clientDir = join(testDir, "client");
      const workerDir = join(testDir, "worker");
      mkdirSync(apiDir);
      mkdirSync(clientDir);
      mkdirSync(workerDir);

      const envContent = `DATABASE_URL=postgresql://user:password@localhost:5432/mydb
REDIS_URL=redis://localhost:6379
API__PORT=3000
API__SECRET_KEY=api-secret-123
CLIENT__PORT=3001
CLIENT__API_URL=http://localhost:3000
WORKER__QUEUE_NAME=default
WORKER__CONCURRENCY=5
`;

      writeFileSync(envFile, envContent);
      runScript([envFile, "API", "CLIENT", "WORKER"]);

      const apiOutput = readFileSync(join(apiDir, ".env"), "utf-8");
      const clientOutput = readFileSync(join(clientDir, ".env"), "utf-8");
      const workerOutput = readFileSync(join(workerDir, ".env"), "utf-8");

      // Check API output
      expect(apiOutput).toContain("PORT=3000");
      expect(apiOutput).toContain("SECRET_KEY=api-secret-123");
      expect(apiOutput).toContain("DATABASE_URL=postgresql://");
      expect(apiOutput).toContain("REDIS_URL=redis://localhost:6379");

      // Check CLIENT output
      expect(clientOutput).toContain("PORT=3001");
      expect(clientOutput).toContain("API_URL=http://localhost:3000");
      expect(clientOutput).toContain("DATABASE_URL=postgresql://");

      // Check WORKER output
      expect(workerOutput).toContain("QUEUE_NAME=default");
      expect(workerOutput).toContain("CONCURRENCY=5");
      expect(workerOutput).toContain("DATABASE_URL=postgresql://");
    });

    it("should handle nested prefix-like patterns correctly", () => {
      const apiDir = join(testDir, "api");
      mkdirSync(apiDir);

      writeFileSync(envFile, "API__NESTED__VALUE=test\nAPI__SIMPLE=basic\n");
      runScript([envFile, "API"]);

      const output = readFileSync(join(apiDir, ".env"), "utf-8");
      expect(output).toContain("NESTED__VALUE=test");
      expect(output).toContain("SIMPLE=basic");
    });

    it("should handle empty env file", () => {
      const apiDir = join(testDir, "api");
      mkdirSync(apiDir);

      writeFileSync(envFile, "");
      runScript([envFile, "API"]);

      const output = readFileSync(join(apiDir, ".env"), "utf-8");
      expect(output).toContain("# file generated via splitenv script");
    });

    it("should handle comments in env file", () => {
      const apiDir = join(testDir, "api");
      mkdirSync(apiDir);

      writeFileSync(envFile, "# This is a comment\nAPI__KEY=value\n");
      runScript([envFile, "API"]);

      const output = readFileSync(join(apiDir, ".env"), "utf-8");
      expect(output).toContain("KEY=value");
    });
  });

  describe("edge cases", () => {
    it("should handle variable with prefix but no separator", () => {
      const apiDir = join(testDir, "api");
      mkdirSync(apiDir);

      writeFileSync(envFile, "APIKEY=value\n");
      runScript([envFile, "API"]);

      const output = readFileSync(join(apiDir, ".env"), "utf-8");
      // Should be treated as unprefixed (rest) variable
      expect(output).toContain("APIKEY=value");
    });

    it("should handle very long variable names and values", () => {
      const apiDir = join(testDir, "api");
      mkdirSync(apiDir);

      const longKey = "A".repeat(100);
      const longValue = "B".repeat(1000);
      writeFileSync(envFile, `API__${longKey}=${longValue}\n`);
      runScript([envFile, "API"]);

      const output = readFileSync(join(apiDir, ".env"), "utf-8");
      expect(output).toContain(longKey);
      expect(output).toContain(longValue);
    });

    it("should handle uppercase prefix matching to lowercase directory", () => {
      const apiDir = join(testDir, "api");
      mkdirSync(apiDir);

      writeFileSync(envFile, "API__KEY=value\n");
      runScript([envFile, "API"]);
    });

    it("should strip prefixes with underscores correctly", () => {
      const apiDir = join(testDir, "api_client");
      mkdirSync(apiDir);

      writeFileSync(
        envFile,
        "API_CLIENT__DATABASE_URL=postgres://localhost\nAPI_CLIENT__PORT=3000\n",
      );
      runScript([envFile, "API_CLIENT"]);

      const output = readFileSync(join(apiDir, ".env"), "utf-8");
      expect(output).toContain("DATABASE_URL=postgres://localhost");
      expect(output).toContain("PORT=3000");
      expect(output).not.toContain("API_CLIENT__");
    });

    it("should strip prefixes with hyphens correctly", () => {
      const apiDir = join(testDir, "api-client");
      mkdirSync(apiDir);

      writeFileSync(
        envFile,
        "API-CLIENT__DATABASE_URL=postgres://localhost\nAPI-CLIENT__PORT=3000\n",
      );
      runScript([envFile, "API-CLIENT"]);

      const output = readFileSync(join(apiDir, ".env"), "utf-8");
      expect(output).toContain("DATABASE_URL=postgres://localhost");
      expect(output).toContain("PORT=3000");
      expect(output).not.toContain("API-CLIENT__");
    });

    it("should strip prefixes with mixed underscores and hyphens correctly", () => {
      const apiDir = join(testDir, "my_api-client");
      mkdirSync(apiDir);

      writeFileSync(
        envFile,
        "MY_API-CLIENT__SECRET=abc123\nMY_API-CLIENT__ENDPOINT=/api/client\n",
      );
      runScript([envFile, "MY_API-CLIENT"]);

      const output = readFileSync(join(apiDir, ".env"), "utf-8");
      expect(output).toContain("SECRET=abc123");
      expect(output).toContain("ENDPOINT=/api/client");
      expect(output).not.toContain("MY_API-CLIENT__");
    });
  });
});
