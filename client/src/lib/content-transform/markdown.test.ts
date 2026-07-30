import {
  countHardLineBreaks,
  extractMarkdownLinks,
  extractRichTextLinks,
  extractRichTextText,
  markdownToRichText,
  normaliseHardLineBreaks,
  prepareMarkdown,
  rewriteAutolinks,
  stabiliseNodeIds,
} from "./markdown";
import { createTestEditorConfig } from "./test-support";

describe("rewriteAutolinks", () => {
  test("rewrites an http autolink to inline-link syntax", () => {
    expect(rewriteAutolinks("see <https://raisg.org/es/mapas/> for maps")).toBe(
      "see [https://raisg.org/es/mapas/](https://raisg.org/es/mapas/) for maps",
    );
  });

  test("rewrites every autolink in the field, not just the first", () => {
    expect(rewriteAutolinks("<https://a.test> and <https://b.test>")).toBe(
      "[https://a.test](https://a.test) and [https://b.test](https://b.test)",
    );
  });

  test("handles mailto and ftp schemes", () => {
    expect(rewriteAutolinks("<mailto:a@b.test>")).toBe("[mailto:a@b.test](mailto:a@b.test)");
    expect(rewriteAutolinks("<ftp://x.test/f>")).toBe("[ftp://x.test/f](ftp://x.test/f)");
  });

  test("leaves inline links untouched", () => {
    const md = "an [inline link](https://example.com) stays put";
    expect(rewriteAutolinks(md)).toBe(md);
  });

  test("leaves non-URL angle brackets alone", () => {
    expect(rewriteAutolinks("values <   5 and > 2")).toBe("values <   5 and > 2");
    expect(rewriteAutolinks("a <b> tag")).toBe("a <b> tag");
  });
});

describe("normaliseHardLineBreaks", () => {
  test("folds a trailing backslash break into running text", () => {
    expect(normaliseHardLineBreaks("LSIB.\\\n    https://x.test/y")).toBe("LSIB. https://x.test/y");
  });

  test("handles CRLF", () => {
    expect(normaliseHardLineBreaks("one\\\r\ntwo")).toBe("one two");
  });

  test("leaves a lone backslash that is not at end of line", () => {
    expect(normaliseHardLineBreaks("a \\ b")).toBe("a \\ b");
  });

  test("leaves paragraph breaks intact", () => {
    expect(normaliseHardLineBreaks("one\n\ntwo")).toBe("one\n\ntwo");
  });
});

describe("countHardLineBreaks", () => {
  test("counts each backslash break", () => {
    expect(countHardLineBreaks("a\\\nb\\\nc")).toBe(2);
    expect(countHardLineBreaks("no breaks here")).toBe(0);
  });
});

describe("prepareMarkdown", () => {
  test("applies both normalisations", () => {
    expect(prepareMarkdown("ref.\\\n    <https://x.test>")).toBe(
      "ref. [https://x.test](https://x.test)",
    );
  });
});

describe("extractMarkdownLinks", () => {
  test("finds autolinks and inline links", () => {
    expect(
      extractMarkdownLinks("<https://a.test> then [b](https://b.test) then [c](https://c.test)"),
    ).toEqual(["https://a.test", "https://b.test", "https://c.test"]);
  });

  test("ignores bare URLs, which are not links without remark-gfm", () => {
    expect(extractMarkdownLinks("visit https://bare.test today")).toEqual([]);
  });

  test("ignores bracketed URLs with no target", () => {
    expect(extractMarkdownLinks("[https://nope.test]")).toEqual([]);
  });

  test("handles a title after the target", () => {
    expect(extractMarkdownLinks('[a](https://a.test "Title")')).toEqual(["https://a.test"]);
  });
});

describe("markdownToRichText", () => {
  let editorConfig: Awaited<ReturnType<typeof createTestEditorConfig>>;

  beforeAll(async () => {
    editorConfig = await createTestEditorConfig();
  });

  test("preserves an autolink as a real link node", () => {
    const richText = markdownToRichText({
      editorConfig,
      markdown: "see <https://raisg.org/es/mapas/>",
      scope: "test",
    });

    expect(extractRichTextLinks(richText)).toEqual(["https://raisg.org/es/mapas/"]);
  });

  test("without the rewrite the same autolink would be lost", () => {
    // Guards the reason prepareMarkdown exists: this is the silent failure.
    const richText = markdownToRichText({
      editorConfig,
      markdown: "see [x](https://kept.test) and <https://dropped.test>",
      scope: "test",
    });

    expect(extractRichTextLinks(richText)).toEqual(["https://kept.test", "https://dropped.test"]);
  });

  test("leaves no literal backslash in the converted text", () => {
    const richText = markdownToRichText({
      editorConfig,
      markdown: "line one\\\n    line two",
      scope: "test",
    });

    expect(extractRichTextText(richText)).not.toContain("\\");
    expect(extractRichTextText(richText)).toBe("line one line two");
  });

  test("is deterministic across runs", () => {
    const markdown = "a [link](https://example.com) and [another](https://example.org)";
    const first = markdownToRichText({
      editorConfig,
      markdown,
      scope: "indicator:1:description:en",
    });
    const second = markdownToRichText({
      editorConfig,
      markdown,
      scope: "indicator:1:description:en",
    });

    expect(JSON.stringify(first)).toBe(JSON.stringify(second));
  });

  test("gives different scopes different node ids", () => {
    const markdown = "a [link](https://example.com)";
    const a = markdownToRichText({ editorConfig, markdown, scope: "indicator:1:description:en" });
    const b = markdownToRichText({ editorConfig, markdown, scope: "indicator:2:description:en" });

    expect(JSON.stringify(a)).not.toBe(JSON.stringify(b));
  });

  test("keeps headings, emphasis and lists", () => {
    const richText = markdownToRichText({
      editorConfig,
      markdown: "# Title\n\nSome *emphasis*.\n\n-   one\n-   two",
      scope: "test",
    });
    const json = JSON.stringify(richText);

    expect(json).toContain('"type":"heading"');
    expect(json).toContain('"type":"list"');
    expect(extractRichTextText(richText)).toContain("emphasis");
  });
});

describe("stabiliseNodeIds", () => {
  test("replaces ids with deterministic values and leaves other nodes alone", () => {
    const tree = {
      root: {
        type: "root",
        children: [
          { type: "link", id: "random-one", fields: { url: "https://a.test" }, children: [] },
          { type: "text", text: "no id here" },
          { type: "link", id: "random-two", fields: { url: "https://b.test" }, children: [] },
        ],
      },
    };

    const result = stabiliseNodeIds(structuredClone(tree), "scope");
    const again = stabiliseNodeIds(structuredClone(tree), "scope");

    expect(result).toEqual(again);
    expect(result.root.children[0].id).not.toBe("random-one");
    expect(result.root.children[0].id).not.toBe(result.root.children[2].id);
    expect(result.root.children[1]).toEqual({ type: "text", text: "no id here" });
  });
});
