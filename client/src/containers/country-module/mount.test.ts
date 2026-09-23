import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const APP_DIR = join(process.cwd(), "src/app");

function getLayoutPaths(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return getLayoutPaths(path);
    return entry.name === "layout.tsx" ? [path] : [];
  });
}

const layouts = getLayoutPaths(APP_DIR).map((path) => ({
  path: path.replace(`${process.cwd()}/`, ""),
  source: readFileSync(path, "utf8"),
}));

const mountingLayouts = layouts.filter(({ source }) => source.includes("<CountryModule />"));

// `useSyncLocation` reads a Jotai atom from whichever store is in scope. Mounted outside a
// Provider it silently reads the default store and auto-activation goes dead, which no test
// exercising the component can see because they all mock the hook.
describe("CountryModule mount points", () => {
  test("at least one layout mounts it", () => {
    expect(mountingLayouts.length).toBeGreaterThan(0);
  });

  test.each(mountingLayouts.map(({ path, source }) => [path, source]))(
    "%s mounts it inside its JotaiProvider",
    (_path, source) => {
      const providerIndex = source.indexOf("<JotaiProvider>");
      const mountIndex = source.indexOf("<CountryModule />");

      expect(providerIndex).toBeGreaterThan(-1);
      expect(mountIndex).toBeGreaterThan(providerIndex);
    },
  );
});
