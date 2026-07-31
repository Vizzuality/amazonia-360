import type { Payload } from "payload";

import type { SeededCollection } from "./types";
import { SEEDED_COLLECTIONS } from "./types";

/**
 * An in-memory stand-in for the bits of Payload the seed uses.
 *
 * Modelled rather than mocked, because the invariants worth testing are about
 * stored state — parents resolving to the right record, layouts pointing at real
 * Indicators, records ending up published, a locale being written only when it
 * differs — and assertions on call arguments alone would pass just as happily
 * against a seeder that wrote nonsense.
 *
 * Localization follows Payload's model closely enough to matter: writes are
 * recorded per locale, and a read resolves `en` first and overlays the requested
 * locale on top, which is what makes fallback observable.
 *
 * Uuids are minted here, since that is now the only place ids come from. Tests
 * cannot name a record up front, so they look it up by name.
 */

type Row = {
  id: string;
  /** Field values as written, keyed by the locale they were written under. */
  byLocale: Record<string, Record<string, unknown>>;
  /**
   * A newer, unpublished revision — what Payload returns from a `draft: true`
   * query while the published version stays live. One real Indicator is in this
   * state on a live database, and conflating it with "never published" was a bug.
   */
  pendingDraft?: boolean;
};

export type RecordedCall = {
  op: "create" | "update" | "find" | "count" | "delete";
  collection: string;
  locale?: string;
  id?: string;
  /** Field names written, so a test can tell a layout write from a locale write. */
  fields?: string[];
  /** Recorded on delete: an empty `where` is not a match-all, so it is load-bearing. */
  where?: unknown;
};

export type FakePayload = {
  payload: Payload;
  calls: RecordedCall[];
  /** Ids in creation order. Opaque by design — assert on content, not on these. */
  ids: (collection: SeededCollection) => string[];
  /** Every record as a reader at `locale` would see it, in creation order. */
  all: (collection: SeededCollection, locale?: string) => Record<string, unknown>[];
  read: (collection: SeededCollection, id: string, locale?: string) => Record<string, unknown>;
  /** The natural handle in a test now that ids are minted: the English name. */
  named: (collection: SeededCollection, name: string, locale?: string) => Record<string, unknown>;
  /** Seed the fake with pre-existing rows, to simulate a populated database. */
  preload: (collection: SeededCollection, rows: Record<string, unknown>[]) => void;
  /**
   * Mark a record as having an unpublished draft revision on top of its live
   * published version — the state an editor mid-edit leaves behind.
   */
  setPendingDraft: (collection: SeededCollection, id: string) => void;
};

const DEFAULT = "en";

/** Realistic in shape, deterministic so a failure message is readable. */
const uuid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;

export const createFakePayload = ({
  failOn,
}: { failOn?: (call: RecordedCall) => string | undefined } = {}): FakePayload => {
  const store = new Map<string, Map<string, Row>>(
    SEEDED_COLLECTIONS.map((collection) => [collection, new Map<string, Row>()]),
  );
  const calls: RecordedCall[] = [];
  let minted = 0;

  const table = (collection: string) => {
    const existing = store.get(collection);
    if (!existing) throw new Error(`fake payload: unknown collection ${collection}`);
    return existing;
  };

  const resolve = (row: Row, locale: string): Record<string, unknown> => ({
    ...row.byLocale[DEFAULT],
    ...(row.byLocale[locale] ?? {}),
    id: row.id,
  });

  const record = (call: RecordedCall) => {
    calls.push(call);
    const failure = failOn?.(call);
    if (failure) throw new Error(failure);
  };

  const payload = {
    count: async ({ collection }: { collection: string }) => {
      record({ op: "count", collection });
      return { totalDocs: table(collection).size };
    },

    find: async ({
      collection,
      locale = DEFAULT,
      draft = false,
    }: {
      collection: string;
      locale?: string;
      draft?: boolean;
    }) => {
      record({ op: "find", collection, locale });

      return {
        docs: [...table(collection).values()].map((row) => {
          const resolved = resolve(row, locale);
          // A draft query surfaces the pending revision; the published view does not.
          return draft && row.pendingDraft ? { ...resolved, _status: "draft" } : resolved;
        }),
      };
    },

    create: async ({
      collection,
      data,
      locale = DEFAULT,
    }: {
      collection: string;
      data: Record<string, unknown>;
      locale?: string;
    }) => {
      if ("id" in data) {
        throw new Error(`fake payload: ${collection} created with an explicit id`);
      }

      const id = uuid((minted += 1));
      record({ op: "create", collection, locale, id, fields: Object.keys(data) });

      table(collection).set(id, { id, byLocale: { [locale]: { ...data } } });
      return resolve(table(collection).get(id)!, locale);
    },

    update: async ({
      collection,
      id,
      data,
      locale = DEFAULT,
    }: {
      collection: string;
      id?: string;
      data: Record<string, unknown>;
      locale?: string;
    }) => {
      record({ op: "update", collection, locale, id, fields: Object.keys(data) });

      if (id === undefined) throw new Error("fake payload: update without an id");

      const row = table(collection).get(id);
      if (!row) throw new Error(`fake payload: ${collection} ${id} not found`);

      row.byLocale[locale] = { ...(row.byLocale[locale] ?? {}), ...data };
      return resolve(row, locale);
    },

    delete: async ({ collection, where }: { collection: string; where?: unknown }) => {
      const rows = [...table(collection).values()];
      record({ op: "delete", collection, where });
      table(collection).clear();

      return { docs: rows.map((row) => resolve(row, DEFAULT)), errors: [] };
    },
  } as unknown as Payload;

  const all = (collection: SeededCollection, locale = DEFAULT) =>
    [...table(collection).values()].map((row) => resolve(row, locale));

  return {
    payload,
    calls,
    ids: (collection) => [...table(collection).keys()],
    all,
    read: (collection, id, locale = DEFAULT) => {
      const row = table(collection).get(id);
      if (!row) throw new Error(`${collection} ${id} not found`);
      return resolve(row, locale);
    },
    named: (collection, name, locale = DEFAULT) => {
      const matches = all(collection, locale).filter((doc) => doc.name === name);
      if (matches.length !== 1) {
        throw new Error(
          `${collection}: expected one record named "${name}", found ${matches.length}`,
        );
      }
      return matches[0];
    },
    preload: (collection, rows) => {
      for (const row of rows) {
        // An explicit id is honoured so a test can model a record that is *not*
        // uuid-keyed.
        const { id: given, ...fields } = row;
        const id = typeof given === "string" ? given : uuid((minted += 1));

        table(collection).set(id, { id, byLocale: { [DEFAULT]: { ...fields } } });
      }
    },
    setPendingDraft: (collection, id) => {
      const row = table(collection).get(id);
      if (!row) throw new Error(`${collection} ${id} not found`);
      row.pendingDraft = true;
    },
  };
};
