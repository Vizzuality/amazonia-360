import { createHash } from "node:crypto";

import { convertMarkdownToLexical } from "@payloadcms/richtext-lexical";
import type { SanitizedServerEditorConfig } from "@payloadcms/richtext-lexical";

/**
 * Markdown → rich text, plus the normalisations the source content needs first.
 *
 * The app renders descriptions today with react-markdown and no remark-gfm, so
 * the effective grammar is plain CommonMark. Two CommonMark constructs the
 * Payload markdown converter does not implement, verified empirically:
 *
 *  - Autolinks (`<https://example.com>`) become plain text. 192 description
 *    fields use them, so converting without rewriting first drops that many
 *    sets of hyperlinks silently.
 *  - Hard line breaks do not survive in any spelling — trailing backslash,
 *    two trailing spaces, or a bare newline all collapse into one text run.
 *    44 fields use the trailing-backslash form.
 *
 * Autolinks are therefore rewritten to inline-link syntax, which does convert.
 * Line breaks cannot be preserved, only normalised, so the backslash is removed
 * rather than left to render as a literal "\". Every field affected by either
 * rule is listed in the fidelity report for sign-off.
 */

export type RichText = ReturnType<typeof convertMarkdownToLexical>;

/**
 * CommonMark autolink: a scheme-qualified URI in angle brackets, no spaces.
 * Rewritten to `[url](url)`, which is what react-markdown already renders it as.
 */
const AUTOLINK = /<((?:https?|mailto|ftp):[^\s<>]+)>/g;

export const rewriteAutolinks = (markdown: string): string =>
  markdown.replace(AUTOLINK, (_match, url: string) => `[${url}](${url})`);

/**
 * A backslash immediately before a newline is a CommonMark hard line break.
 * Since no break survives conversion, drop the backslash and fold the
 * continuation onto the previous line so it reads as running text instead of
 * leaving a stray "\" in the output.
 */
export const normaliseHardLineBreaks = (markdown: string): string =>
  markdown.replace(/\\\r?\n[ \t]*/g, " ");

/** Both normalisations, in the order they must run. */
export const prepareMarkdown = (markdown: string): string =>
  normaliseHardLineBreaks(rewriteAutolinks(markdown));

/** Counts hard line breaks that will be lost, for the fidelity report. */
export const countHardLineBreaks = (markdown: string): number =>
  (markdown.match(/\\\r?\n/g) ?? []).length;

const INLINE_LINK = /\[(?:[^\]]*)\]\(\s*<?([^)\s>]+)>?(?:\s+"[^"]*")?\s*\)/g;

/**
 * Every URL react-markdown turns into an anchor today: inline links and
 * autolinks. Bare URLs are deliberately excluded — without remark-gfm they are
 * not linkified, so they are not hyperlinks before or after the migration.
 */
export const extractMarkdownLinks = (markdown: string): string[] => {
  const urls: string[] = [];

  for (const match of markdown.matchAll(AUTOLINK)) {
    urls.push(match[1]);
  }
  for (const match of markdown.matchAll(INLINE_LINK)) {
    urls.push(match[1]);
  }

  return urls;
};

type LexicalNode = {
  type?: string;
  text?: string;
  id?: string;
  fields?: { url?: string };
  children?: LexicalNode[];
};

const walk = (node: LexicalNode, visit: (node: LexicalNode) => void): void => {
  visit(node);
  for (const child of node.children ?? []) {
    walk(child, visit);
  }
};

/** URLs that survived as real link nodes. */
export const extractRichTextLinks = (richText: RichText): string[] => {
  const urls: string[] = [];
  walk((richText as { root: LexicalNode }).root, (node) => {
    if (node.type === "link" && node.fields?.url) {
      urls.push(node.fields.url);
    }
  });
  return urls;
};

/** Visible text of the converted document, for artefact detection. */
export const extractRichTextText = (richText: RichText): string => {
  const parts: string[] = [];
  walk((richText as { root: LexicalNode }).root, (node) => {
    if (typeof node.text === "string") {
      parts.push(node.text);
    }
  });
  return parts.join("");
};

/**
 * The converter assigns link nodes a random id, so converting the same markdown
 * twice yields different JSON. That would make the dataset non-reproducible and
 * every re-run look like a content change, so ids are replaced with values
 * derived from the field they belong to and their position in it.
 */
export const stabiliseNodeIds = <T>(richText: T, scope: string): T => {
  let ordinal = 0;

  walk((richText as { root: LexicalNode }).root, (node) => {
    if (typeof node.id === "string") {
      node.id = createHash("sha256")
        .update(`${scope}:${ordinal}`, "utf8")
        .digest("hex")
        .slice(0, 24);
      ordinal += 1;
    }
  });

  return richText;
};

/**
 * Converts one description to rich text.
 *
 * `scope` identifies the field being converted (for example
 * `indicator:42:description:en`) and only affects generated node ids, which
 * must be stable across runs.
 */
export const markdownToRichText = ({
  editorConfig,
  markdown,
  scope,
}: {
  editorConfig: SanitizedServerEditorConfig;
  markdown: string;
  scope: string;
}): RichText =>
  stabiliseNodeIds(
    convertMarkdownToLexical({ editorConfig, markdown: prepareMarkdown(markdown) }),
    scope,
  );
