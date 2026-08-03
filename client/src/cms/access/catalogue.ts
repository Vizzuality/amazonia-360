import type { Access } from "payload";

/**
 * Read access for the catalogue collections (Topics, Subtopics, Indicators).
 *
 * These collections enable `versions: { drafts: true }`, which means Payload keeps the
 * latest version — draft *or* published — in the main table. A plain `anyoneAccess` read
 * would therefore leak unpublished content to any caller once phase 2 seeds data, so
 * every non-admin caller (anonymous or signed in) is constrained to published documents.
 *
 * Admins are the deliberate exception, not an oversight: Payload's admin UI reuses this
 * same `read` access function, so an admin who could not read drafts could neither see
 * nor edit the drafts they author. Do not simplify this back to `anyoneAccess`.
 */
export const publishedOrAdminAccess: Access = ({ req: { user } }) => {
  if (user?.collection === "admins") return true;

  return { _status: { equals: "published" } };
};
