import INDICATORS_ECU from "@/../datum/indicators.ECU.json";
import INDICATORS from "@/../datum/indicators.json";
import SUBTOPICS from "@/../datum/subtopics.json";
import TOPICS from "@/../datum/topics.json";
import { isEmptyValue } from "@/cms/test-utils/find-field";

/**
 * Content health of the seed source, as opposed to its shape.
 *
 * `collections/*.test.ts` and `fields/resource.test.ts` already check that every row fits the
 * Payload schema. A row can fit the schema perfectly and still render wrong — a backslash the
 * Markdown parser prints instead of honouring, an emphasis marker that never closes, a popup
 * substitution that silently resolves to nothing. Those defects reach the screen, so they get
 * their own guard here rather than being found again by the next person reading the catalogue.
 */

type SourceRow = Record<string, unknown> & { id: number };
type PopupTemplate = {
  title?: string;
  content?: { fieldInfos?: { fieldName?: string; label?: string }[] }[];
};
type SourceResource = Record<string, unknown> & {
  type: string;
  legend?: { items?: { label?: string }[] };
  popupTemplate?: PopupTemplate | "";
};
type SourceIndicator = SourceRow & { resource: SourceResource };

const topics = TOPICS as unknown as SourceRow[];
const subtopics = SUBTOPICS as unknown as SourceRow[];
const indicators = [...INDICATORS, ...INDICATORS_ECU] as unknown as SourceIndicator[];

const LOCALES = ["en", "es", "pt"] as const;

const allRows = [
  ...topics.map((row) => ({ collection: "topic", row })),
  ...subtopics.map((row) => ({ collection: "subtopic", row })),
  ...indicators.map((row) => ({ collection: "indicator", row: row as SourceRow })),
];

/** Every non-empty `description_<locale>` in the catalogue, flattened for the text checks. */
const descriptions = allRows.flatMap(({ collection, row }) =>
  LOCALES.filter((locale) => !isEmptyValue(row[`description_${locale}`]))
    .map((locale) => ({
      where: `${collection} ${row.id} [description_${locale}]`,
      text: row[`description_${locale}`] as string,
    }))
    .filter(({ text }) => text.trim() !== ""),
);

/**
 * A line that opens a new block, so the line before it cannot end in a hard break.
 *
 * An ordered list is the one exception to "any list interrupts a paragraph": CommonMark only
 * lets it in when it starts at 1, so `2)` on the next line continues the paragraph instead.
 */
const BLOCK_START = /^\s*(?:[*+-]\s|1[.)]\s|#{1,6}\s|>|```|~~~)/;
const HEADING = /^\s*#{1,6}\s/;

/**
 * Trailing backslashes that CommonMark renders as a literal `\` rather than a line break.
 *
 * `react-markdown` parses these descriptions as plain CommonMark (no remark-gfm — see
 * `components/ui/markdown.tsx`), where a backslash is a hard line break only when the next
 * line continues the same paragraph. At the end of a heading, at the end of a paragraph, or
 * immediately before a list, the parser has no break to make and prints the backslash.
 *
 * The source data reached us from a pandoc conversion that emits `\` line breaks freely, so
 * most of them are legitimate and stay. Only the ones with nothing to break are defects.
 *
 * The break has to be an odd run of backslashes sitting flush against the line ending. `\\` is
 * an escaped backslash and `\` followed by spaces is just a backslash — both print, neither
 * breaks — so they are reported wherever they appear.
 */
const literalBackslashes = (text: string): string[] => {
  const lines = text.split("\n");

  return lines.flatMap((line, index) => {
    const run = /\\+[ \t]*$/.exec(line)?.[0];
    if (run === undefined) return [];

    const next = lines[index + 1] ?? "";
    const breaks =
      /\\$/.test(run) &&
      run.length % 2 === 1 &&
      !HEADING.test(line) &&
      next.trim() !== "" &&
      !BLOCK_START.test(next);

    return breaks ? [] : [`line ${index + 1}: ${line.trimEnd().slice(-60)}`];
  });
};

/** CommonMark's flanking rules read Unicode punctuation, not just ASCII — the es/pt rows use it. */
const PUNCTUATION = /[\p{P}\p{S}]/u;

/**
 * Single-asterisk emphasis markers that never pair up, so the reader sees a bare `*`.
 *
 * Strong (`**`) runs and list bullets are removed first — neither is emphasis, and both would
 * otherwise swamp the count. Pairs are stripped rather than whole runs, so `***both***` leaves
 * the single marker behind instead of vanishing. What is left is walked in order against
 * CommonMark's flanking rules: a marker can open only when the character after it is not a
 * space, and can close only when the character before it is not a space. `*text *(GADM)`
 * breaks the second rule, which is why it renders as two literal asterisks instead of italics.
 *
 * The walk runs per paragraph, because emphasis cannot span a blank line: `*foo` and `bar*` in
 * two paragraphs are two literal asterisks, not one italic run.
 *
 * A deliberate literal asterisk — `healthcare=\*` in the OpenStreetMap tag lists — is written
 * escaped, which both renders correctly and keeps it out of this walk.
 */
const unpairedEmphasis = (text: string): string[] =>
  text.split(/\n[ \t]*\n/).flatMap((paragraph) => {
    const scannable = paragraph
      .replace(/\*\*/g, "")
      .split("\n")
      .map((line) => line.replace(/^(\s*)\*(\s)/, "$1 $2"))
      .join("\n");

    const problems: string[] = [];
    let open = false;

    for (const match of scannable.matchAll(/(?<!\\)\*/g)) {
      const index = match.index;
      const before = index > 0 ? scannable[index - 1] : " ";
      const after = index + 1 < scannable.length ? scannable[index + 1] : " ";

      const canOpen =
        !/\s/.test(after) &&
        (!PUNCTUATION.test(after) || /\s/.test(before) || PUNCTUATION.test(before));
      const canClose =
        !/\s/.test(before) &&
        (!PUNCTUATION.test(before) || /\s/.test(after) || PUNCTUATION.test(after));

      if (open ? canClose : canOpen) {
        open = !open;
        continue;
      }

      problems.push(
        `${open ? "cannot close" : "stray closer"} at ${index}: ${scannable.slice(Math.max(0, index - 45), index + 45)}`,
      );
    }

    if (open) problems.push(`never closed: ${scannable.slice(-70)}`);

    return problems;
  });

describe("catalogue descriptions", () => {
  test("no backslash sits where CommonMark cannot read it as a line break", () => {
    const offenders = descriptions.flatMap(({ where, text }) =>
      literalBackslashes(text).map((detail) => `${where} ${detail}`),
    );

    expect(offenders).toEqual([]);
  });

  test("single-asterisk emphasis opens and closes", () => {
    const offenders = descriptions.flatMap(({ where, text }) =>
      unpairedEmphasis(text).map((detail) => `${where} ${detail}`),
    );

    expect(offenders).toEqual([]);
  });

  /**
   * English is the fallback locale (see `seed-helpers.ts`, which writes es/pt on top of an
   * English row). A row with Spanish but no English therefore shows nothing at all to an
   * English reader, and there is no further locale for the fallback to reach for.
   */
  test("a row translated into any locale has English too", () => {
    const offenders = allRows
      .filter(({ row }) => LOCALES.some((locale) => !isEmptyValue(row[`description_${locale}`])))
      .filter(({ row }) => isEmptyValue(row.description_en))
      .map(({ collection, row }) => `${collection} ${row.id}`);

    expect(offenders).toEqual([]);
  });
});

describe("catalogue names", () => {
  test("no name, unit or short description carries surrounding whitespace", () => {
    const offenders = allRows.flatMap(({ collection, row }) =>
      Object.entries(row)
        .filter(([key]) => /^(name|unit|description_short)_(en|es|pt)$/.test(key))
        .filter(([, value]) => typeof value === "string" && value !== value.trim())
        .map(([key, value]) => `${collection} ${row.id} [${key}] ${JSON.stringify(value)}`),
    );

    expect(offenders).toEqual([]);
  });
});

const popupTemplates = indicators
  .map((indicator) => ({ id: indicator.id, popupTemplate: indicator.resource.popupTemplate }))
  .filter(
    (entry): entry is { id: number; popupTemplate: PopupTemplate } =>
      typeof entry.popupTemplate === "object" && entry.popupTemplate !== null,
  );

describe("map popups", () => {
  /**
   * ArcGIS resolves `{FIELD}` against the layer's attributes. A token it cannot match — because
   * of a stray space, or because the title is prose rather than a token — resolves to nothing
   * and the popup opens untitled, with no error anywhere.
   */
  test("every popup title is a field substitution", () => {
    const offenders = popupTemplates
      .filter(({ popupTemplate }) => popupTemplate.title !== undefined)
      .filter(({ popupTemplate }) => !/^\{[A-Za-z0-9_]+\}$/.test(popupTemplate.title!))
      .map(({ id, popupTemplate }) => `indicator ${id}: ${JSON.stringify(popupTemplate.title)}`);

    expect(offenders).toEqual([]);
  });

  test("no popup field name carries surrounding whitespace", () => {
    const offenders = popupTemplates.flatMap(({ id, popupTemplate }) =>
      (popupTemplate.content?.[0]?.fieldInfos ?? [])
        .filter(({ fieldName }) => typeof fieldName === "string" && fieldName !== fieldName.trim())
        .map(({ fieldName }) => `indicator ${id}: ${JSON.stringify(fieldName)}`),
    );

    expect(offenders).toEqual([]);
  });
});

describe("legends", () => {
  /**
   * Legend labels are the catalogue's shared vocabulary: the same class on two layers should
   * read the same way, so that a reader comparing them is comparing the data and not the
   * spelling. Hyphenation, spacing and case are the differences that slip through review.
   */
  test("no two legend labels differ only by hyphenation, spacing or case", () => {
    const spellings = new Map<string, Map<string, number[]>>();

    for (const indicator of indicators) {
      for (const item of indicator.resource.legend?.items ?? []) {
        if (typeof item.label !== "string" || item.label === "") continue;

        const key = item.label.replace(/[-–—\s]+/g, "").toLowerCase();
        const byLabel = spellings.get(key) ?? new Map<string, number[]>();
        byLabel.set(item.label, [...(byLabel.get(item.label) ?? []), indicator.id]);
        spellings.set(key, byLabel);
      }
    }

    const offenders = [...spellings.values()]
      .filter((byLabel) => byLabel.size > 1)
      .map((byLabel) =>
        [...byLabel]
          .map(([label, ids]) => `${JSON.stringify(label)} on ${ids.join(", ")}`)
          .join(" vs "),
      );

    expect(offenders).toEqual([]);
  });
});

describe("resources", () => {
  /**
   * `mapResource` drops `rasterFunction` for a feature layer because feature layers have no
   * such concept. Carrying one in the source is therefore invisible in the app but misleading
   * to anyone reading the row — it looks like a setting that does something.
   */
  test("no feature layer carries a raster function", () => {
    const offenders = indicators
      .filter(({ resource }) => resource.type === "feature")
      .filter(({ resource }) => !isEmptyValue(resource.rasterFunction))
      .map(({ id, resource }) => `indicator ${id}: ${JSON.stringify(resource.rasterFunction)}`);

    expect(offenders).toEqual([]);
  });
});
