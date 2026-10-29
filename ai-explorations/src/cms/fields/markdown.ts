import type { TextareaField } from "payload";

export const MARKDOWN_FIELD_COMPONENT =
  "/cms/components/markdown-field/markdown-field#MarkdownField";

/**
 * A localized Markdown description: stored and served as a plain string, edited in the admin
 * with a rich-text editor limited to what `components/ui/markdown.tsx` renders.
 */
export const markdownDescriptionField = (helpText: string): TextareaField => ({
  name: "description",
  type: "textarea",
  localized: true,
  admin: {
    description: helpText,
    components: { Field: MARKDOWN_FIELD_COMPONENT },
  },
});
