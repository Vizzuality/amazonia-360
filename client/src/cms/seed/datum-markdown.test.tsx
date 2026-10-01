import { createRef } from "react";

import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import type { MDXEditorMethods } from "@mdxeditor/editor";
import { act, render, waitFor } from "@testing-library/react";

/**
 * Every catalogue description survives a pass through the CMS editor unchanged.
 *
 * MDXEditor does not keep the text it loads: it parses it and writes it back in its own
 * style. A description it would rewrite therefore changes on the first save even when nobody
 * touched it, and a rewrite that drops something (a hard break, the bold around a link)
 * changes what the page shows. Keeping `datum/` in the editor's own form rules both out.
 *
 * After changing the editor's plugins or adding a delivery, rewrite the source in that form
 * and review the diff before committing it:
 *
 *   NORMALIZE_DATUM=1 pnpm test src/cms/seed/datum-markdown.test.tsx
 */

const DATUM_FILES = ["topics", "subtopics", "indicators", "indicators.ECU"] as const;
const LOCALES = ["en", "es", "pt"] as const;
const DATUM_DIR = path.resolve(__dirname, "../../../datum");

// Sandpack, which MDXEditor imports eagerly, registers a CSS custom-property rule jsdom's
// parser rejects, and throws at import time. The rule is irrelevant to Markdown, so a
// rejected one is swapped for an empty rule instead.
const insertRule = CSSStyleSheet.prototype.insertRule;
CSSStyleSheet.prototype.insertRule = function (rule, index) {
  try {
    return insertRule.call(this, rule, index);
  } catch {
    return insertRule.call(this, ".jsdom-rejected-rule {}", index);
  }
};

type DatumFile = (typeof DATUM_FILES)[number];
type Description = { where: string; file: DatumFile; text: string };

const readDescriptions = (): Description[] =>
  DATUM_FILES.flatMap((file) => {
    const rows = JSON.parse(readFileSync(path.join(DATUM_DIR, `${file}.json`), "utf8")) as Record<
      string,
      unknown
    >[];

    return rows.flatMap((row) =>
      LOCALES.flatMap((locale) => {
        const text = row[`description_${locale}`];

        return typeof text === "string" && text !== ""
          ? [{ where: `${file} ${row.id} [description_${locale}]`, file, text }]
          : [];
      }),
    );
  });

async function mountEditor() {
  const { default: MarkdownEditor } = await import("@/cms/components/markdown-field/editor");
  const ref = createRef<MDXEditorMethods>();
  const errors: string[] = [];

  render(<MarkdownEditor ref={ref} markdown="" onError={({ error }) => errors.push(error)} />);
  await waitFor(() => expect(ref.current).not.toBeNull());

  return async (markdown: string) => {
    const before = errors.length;

    await act(async () => {
      ref.current!.setMarkdown(markdown);
      // The editor commits the parsed state on the next tick.
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    return errors.length > before
      ? { error: errors.at(-1)! }
      : { markdown: ref.current!.getMarkdown() };
  };
}

describe("catalogue descriptions in the CMS editor", () => {
  test("load without a parse error and save back unchanged", async () => {
    const roundTrip = await mountEditor();
    const offenders: string[] = [];
    const rewrites = new Map<DatumFile, Map<string, string>>();

    for (const { where, file, text } of readDescriptions()) {
      const result = await roundTrip(text);

      if ("error" in result) {
        offenders.push(`${where} does not parse: ${result.error}`);
      } else if (result.markdown !== text) {
        offenders.push(`${where} is rewritten on save`);
        if (!rewrites.has(file)) rewrites.set(file, new Map());
        rewrites.get(file)!.set(text, result.markdown);
      }
    }

    if (process.env.NORMALIZE_DATUM) {
      for (const [file, replacements] of rewrites) {
        const target = path.join(DATUM_DIR, `${file}.json`);
        let source = readFileSync(target, "utf8");
        for (const [from, to] of replacements) {
          source = source.replaceAll(JSON.stringify(from), JSON.stringify(to));
        }
        writeFileSync(target, source);
      }
      return;
    }

    expect(offenders).toEqual([]);
  }, 120_000);
});
