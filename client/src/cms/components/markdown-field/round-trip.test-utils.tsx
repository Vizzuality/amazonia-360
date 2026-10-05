import { createRef } from "react";

import type { MDXEditorMethods } from "@mdxeditor/editor";
import { act, render, waitFor } from "@testing-library/react";

// Sandpack, which MDXEditor imports eagerly, registers a CSS custom-property rule jsdom's
// parser rejects, and throws at import time. The rule is irrelevant to Markdown, so a
// rejected one is swapped for an empty rule instead. This has to run before the editor
// module loads, which is why `mountMarkdownEditor` imports it dynamically.
const insertRule = CSSStyleSheet.prototype.insertRule;
CSSStyleSheet.prototype.insertRule = function (rule, index) {
  try {
    return insertRule.call(this, rule, index);
  } catch {
    return insertRule.call(this, ".jsdom-rejected-rule {}", index);
  }
};

export type RoundTrip = (markdown: string) => Promise<{ markdown: string } | { error: string }>;

/**
 * Mounts the real CMS editor and returns a function that loads Markdown into it and reads
 * back what the editor would save.
 */
export async function mountMarkdownEditor(): Promise<RoundTrip> {
  const { default: MarkdownEditor } = await import("./editor");
  const ref = createRef<MDXEditorMethods>();
  const errors: string[] = [];

  render(<MarkdownEditor ref={ref} markdown="" onError={({ error }) => errors.push(error)} />);
  await waitFor(() => expect(ref.current).not.toBeNull());

  return async (markdown) => {
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
