"use client";

import {
  BlockTypeSelect,
  BoldItalicUnderlineToggles,
  CodeToggle,
  CreateLink,
  DiffSourceToggleWrapper,
  InsertThematicBreak,
  ListsToggle,
  Separator,
  UndoRedo,
  addExportVisitor$,
  diffSourcePlugin,
  headingsPlugin,
  linkDialogPlugin,
  linkPlugin,
  listsPlugin,
  markdownShortcutPlugin,
  quotePlugin,
  realmPlugin,
  thematicBreakPlugin,
  toolbarPlugin,
  type LexicalExportVisitor,
  type RealmPlugin,
} from "@mdxeditor/editor";

// `lexical` itself is MDXEditor's dependency, not ours, so its node type is borrowed from the
// visitor signature rather than imported.
type LexicalNode = Parameters<
  NonNullable<LexicalExportVisitor<never, never>["testLexicalNode"]>
>[0];

/**
 * Writes a Lexical line break back out as a Markdown hard break.
 *
 * MDXEditor's own visitor appends a bare `"\n"` text node instead, which CommonMark reads as
 * a soft break — so every `\` or two-space break in the catalogue would collapse into the
 * line before it on the first save. The higher priority makes this one win.
 */
const hardBreakVisitor: LexicalExportVisitor<LexicalNode, never> = {
  priority: 1,
  testLexicalNode: (node): node is LexicalNode => node?.getType() === "linebreak",
  visitLexicalNode: ({ mdastParent, actions }) => {
    actions.appendToParent(mdastParent, { type: "break" });
  },
};

const hardBreakPlugin = realmPlugin({
  init: (realm) => realm.pub(addExportVisitor$, hardBreakVisitor),
});

/**
 * Everything the catalogue's Markdown editor can produce, and nothing the site cannot render.
 *
 * `components/ui/markdown.tsx` parses plain CommonMark — no remark-gfm — so strikethrough,
 * tables and checklists are left out, and so is underline, which MDXEditor writes as raw
 * `<u>`. Auto-linking is off because a bare URL is not a link to that renderer: the editor
 * would show a link the page then prints as text.
 *
 * The data tests run the catalogue through this exact list, so a plugin added here changes
 * how every stored description is written back — see `datum-markdown.test.tsx`.
 */
export const markdownFieldPlugins = (): RealmPlugin[] => [
  headingsPlugin({ allowedHeadingLevels: [1, 2, 3, 4] }),
  listsPlugin(),
  linkPlugin({ disableAutoLink: true }),
  linkDialogPlugin(),
  quotePlugin(),
  thematicBreakPlugin(),
  markdownShortcutPlugin(),
  hardBreakPlugin(),
  diffSourcePlugin({ viewMode: "rich-text" }),
  toolbarPlugin({
    toolbarContents: () => (
      <DiffSourceToggleWrapper options={["rich-text", "source"]}>
        <UndoRedo />
        <Separator />
        <BlockTypeSelect />
        <Separator />
        <BoldItalicUnderlineToggles options={["Bold", "Italic"]} />
        <CodeToggle />
        <Separator />
        <ListsToggle options={["bullet", "number"]} />
        <Separator />
        <CreateLink />
        <InsertThematicBreak />
      </DiffSourceToggleWrapper>
    ),
  }),
];
