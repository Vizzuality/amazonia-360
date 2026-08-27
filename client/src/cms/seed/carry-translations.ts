/**
 * Builds the `data` for a translation write: the locale's own text fields, plus the structural
 * fields carried over from the `en` write.
 *
 * Extracted from the seed shell purely so it can be tested. `scripts/seed-catalogue.ts` runs
 * `main()` at module scope, so importing `upsert` from a test would open a database connection
 * and run the whole seed; this function is the part of that write path with real logic in it.
 *
 * Two behaviours the seed depends on:
 *
 * 1. **Ids survive.** Values are taken from the document the `en` write returned, so Payload
 *    block and array rows keep the ids it assigned and are matched and reused on the next
 *    write instead of being deleted and recreated.
 * 2. **Carried fields never silently lose to — or silently win over — the locale payload.**
 *    Their job is to guarantee that required localized subfields exist in every locale (see
 *    `CARRIED_TO_TRANSLATIONS` in `scripts/seed-catalogue.ts` for why). Today no locale mapper
 *    emits a field that is also carried, so there is nothing to prefer one way or the other —
 *    a collision means a locale mapper started emitting a real per-locale value for a field
 *    that `CARRIED_TO_TRANSLATIONS` still carries wholesale from the `en` write, and either
 *    resolution (silently keep the carried value, or silently let the locale value through)
 *    would hide that. This throws instead: fix it by removing the field from
 *    `CARRIED_TO_TRANSLATIONS` in `scripts/seed-catalogue.ts` once the locale mapper covers it
 *    for real.
 *
 * A carried field that is absent from the written document is omitted rather than sent as
 * `undefined`.
 */
export function buildTranslationData(
  written: Record<string, unknown>,
  carryFields: readonly string[],
  localeData: Record<string, unknown>,
): Record<string, unknown> {
  const carried = Object.fromEntries(
    carryFields
      .filter((field) => written[field] !== undefined)
      .map((field) => [field, written[field]]),
  );

  for (const key of Object.keys(carried)) {
    if (key in localeData) {
      throw new Error(
        `buildTranslationData: "${key}" is present in both the locale payload and ` +
          `CARRIED_TO_TRANSLATIONS. A locale mapper is now emitting a real value for a field ` +
          `that scripts/seed-catalogue.ts's CARRIED_TO_TRANSLATIONS still carries wholesale ` +
          `from the "en" write — remove "${key}" from CARRIED_TO_TRANSLATIONS there.`,
      );
    }
  }

  return { ...localeData, ...carried };
}
