"use client";

import { forwardRef } from "react";

import { MDXEditor, type MDXEditorMethods, type MDXEditorProps } from "@mdxeditor/editor";

import { markdownFieldPlugins } from "./plugins";

export type MarkdownEditorProps = Omit<
  MDXEditorProps,
  "plugins" | "suppressHtmlProcessing" | "toMarkdownOptions"
>;

// The catalogue was written with `-` bullets and `---` rules; MDXEditor defaults to `*` for
// both, which would rewrite every list on the first save.
const TO_MARKDOWN_OPTIONS = { bullet: "-", rule: "-" } as const;

/**
 * `suppressHtmlProcessing` switches the parser from MDX back to CommonMark. Under MDX, every
 * `<https://…>` autolink is read as a JSX tag and the whole description fails to load.
 */
const MarkdownEditor = forwardRef<MDXEditorMethods, MarkdownEditorProps>((props, ref) => (
  <MDXEditor
    {...props}
    ref={ref}
    plugins={markdownFieldPlugins()}
    toMarkdownOptions={TO_MARKDOWN_OPTIONS}
    suppressHtmlProcessing
  />
));

MarkdownEditor.displayName = "MarkdownEditor";

export default MarkdownEditor;
