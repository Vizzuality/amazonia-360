import { sanitizeConfig } from "payload";

import { editorConfigFactory, lexicalEditor } from "@payloadcms/richtext-lexical";
import type { SanitizedServerEditorConfig } from "@payloadcms/richtext-lexical";

/**
 * A sanitized editor config built without loading the app's Payload config.
 *
 * The transform runs offline, before any database exists, so it must not pull
 * in `payload.config.ts` — that would drag in env validation and a database
 * adapter for what is a pure text conversion. The features used here are the
 * lexical editor defaults, which is what the content collections declare.
 */
export const createTestEditorConfig = async (): Promise<SanitizedServerEditorConfig> => {
  const config = await sanitizeConfig({
    secret: "content-transform",
    db: () => ({}) as never,
    collections: [],
    editor: lexicalEditor(),
  } as never);

  return editorConfigFactory.default({ config });
};
