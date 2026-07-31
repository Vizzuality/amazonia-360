import type { Access } from "payload";

/**
 * Anyone may read, but an anonymous reader only ever sees published records.
 *
 * Content is public — the app fetches it without a session — so read cannot be
 * restricted to logged-in users. Returning a query constraint rather than
 * `true` is what keeps work-in-progress drafts out of the public site while an
 * editor is still working on them.
 */
export const publishedOrAuthenticatedAccess: Access = ({ req: { user } }) => {
  if (user) return true;

  return {
    _status: { equals: "published" },
  };
};
