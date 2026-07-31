import type { Payload } from "payload";

import type { SeededCollection } from "./types";
import { SEEDED_COLLECTIONS } from "./types";

/**
 * An in-memory stand-in for the bits of Payload the seed uses.
 *
 * Modelled rather than mocked, because the invariants worth testing are about
 * stored state — ids surviving, records ending up published, a locale being
 * written only when it differs — and assertions on call arguments alone would
 * pass just as happily against a seeder that wrote nonsense.
 *
 * Localization follows Payload's model closely enough to matter: writes are
 * recorded per locale, and a read resolves `en` first and overlays the requested
 * locale on top, which is what makes fallback observable.
 */

type Row = {
  id: number;
  /** Field values as written, keyed by the locale they were written under. */
  byLocale: Record<string, Record<string, unknown>>;
  /**
   * A newer, unpublished revision — what Payload returns from a `draft: true`
   * query while the published version stays live. Indicator 121 is in this state
   * on a real database, and conflating it with "never published" was a bug.
   */
  pendingDraft?: boolean;
};

export type RecordedCall = {
  op: "create" | "update" | "find" | "count";
  collection: string;
  locale?: string;
  id?: number;
  /** Field names written, so a test can tell a layout write from a locale write. */
  fields?: string[];
};

export type FakePayload = {
  payload: Payload;
  calls: RecordedCall[];
  /** Resolve a record the way a reader at `locale` would see it. */
  read: (collection: SeededCollection, id: number, locale?: string) => Record<string, unknown>;
  /** Seed the fake with pre-existing rows, to simulate a populated database. */
  preload: (collection: SeededCollection, rows: Record<string, unknown>[]) => void;
  ids: (collection: SeededCollection) => number[];
  /**
   * Mark a record as having an unpublished draft revision on top of its live
   * published version — the state an editor mid-edit leaves behind.
   */
  setPendingDraft: (collection: SeededCollection, id: number) => void;
};

const DEFAULT = "en";

export const createFakePayload = ({
  failOn,
}: { failOn?: (call: RecordedCall) => string | undefined } = {}): FakePayload => {
  const store = new Map<string, Map<number, Row>>(
    SEEDED_COLLECTIONS.map((collection) => [collection, new Map<number, Row>()]),
  );
  const calls: RecordedCall[] = [];

  const table = (collection: string) => {
    const existing = store.get(collection);
    if (!existing) throw new Error(`fake payload: unknown collection ${collection}`);
    return existing;
  };

  const resolve = (row: Row, locale: string) => ({
    ...row.byLocale[DEFAULT],
    ...(row.byLocale[locale] ?? {}),
    id: row.id,
  });

  const idFromWhere = (where: unknown): number | undefined =>
    (where as { id?: { equals?: number } } | undefined)?.id?.equals;

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
      where,
      locale = DEFAULT,
      draft = false,
    }: {
      collection: string;
      where?: unknown;
      locale?: string;
      draft?: boolean;
    }) => {
      record({ op: "find", collection, locale });

      const rows = [...table(collection).values()];
      const wanted = idFromWhere(where);
      const matching = wanted === undefined ? rows : rows.filter((row) => row.id === wanted);

      return {
        docs: matching.map((row) => {
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
      const { id, ...fields } = data;
      record({ op: "create", collection, locale, id: id as number, fields: Object.keys(fields) });

      if (typeof id !== "number") {
        throw new Error(`fake payload: ${collection} created without a numeric id`);
      }
      if (table(collection).has(id)) {
        throw new Error(`fake payload: ${collection} ${id} already exists`);
      }

      table(collection).set(id, { id, byLocale: { [locale]: { ...fields } } });
      return resolve(table(collection).get(id)!, locale);
    },

    update: async ({
      collection,
      where,
      data,
      locale = DEFAULT,
    }: {
      collection: string;
      where?: unknown;
      data: Record<string, unknown>;
      locale?: string;
    }) => {
      const id = idFromWhere(where);
      record({ op: "update", collection, locale, id, fields: Object.keys(data) });

      if (id === undefined) throw new Error("fake payload: update without an id in where");

      const row = table(collection).get(id);
      if (!row) return { docs: [], errors: [] };

      row.byLocale[locale] = { ...(row.byLocale[locale] ?? {}), ...data };
      return { docs: [resolve(row, locale)], errors: [] };
    },
  } as unknown as Payload;

  return {
    payload,
    calls,
    read: (collection, id, locale = DEFAULT) => {
      const row = table(collection).get(id);
      if (!row) throw new Error(`${collection} ${id} not found`);
      return resolve(row, locale);
    },
    preload: (collection, rows) => {
      for (const row of rows) {
        const id = row.id as number;
        table(collection).set(id, { id, byLocale: { [DEFAULT]: { ...row } } });
      }
    },
    ids: (collection) => [...table(collection).keys()],
    setPendingDraft: (collection, id) => {
      const row = table(collection).get(id);
      if (!row) throw new Error(`${collection} ${id} not found`);
      row.pendingDraft = true;
    },
  };
};
