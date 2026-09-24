import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

// A saved report always lives at an unscoped URL, so on its surfaces the module has to come from
// the report. Reading it off the URL there resolves the regional catalogue instead, and the
// country indicators vanish from the widgets, the sidebar and the PDF without any error.
const REPORT_SURFACES = [
  "src/containers/indicators",
  "src/containers/results",
  "src/containers/webshot",
];

const URL_COUNTRY_IMPORT = "@/i18n/use-country";

function getSourcePaths(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return getSourcePaths(path);
    return /\.tsx?$/.test(entry.name) && !entry.name.includes(".test.") ? [path] : [];
  });
}

const sources = REPORT_SURFACES.flatMap((surface) =>
  getSourcePaths(join(process.cwd(), surface)).map((path) => ({
    path: path.replace(`${process.cwd()}/`, ""),
    source: readFileSync(path, "utf8"),
  })),
);

describe("the report's own module", () => {
  test("every report surface is covered by this scan", () => {
    expect(sources.length).toBeGreaterThan(20);
  });

  test.each(sources.map(({ path, source }) => [path, source]))(
    "%s does not read the module off the URL",
    (_path, source) => {
      expect(source).not.toContain(URL_COUNTRY_IMPORT);
    },
  );
});
