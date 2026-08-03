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
 * 2. **Carried fields win over the locale payload.** Their job is to guarantee that required
 *    localized subfields exist in every locale (see `CARRIED_TO_TRANSLATIONS` in
 *    `scripts/seed-catalogue.ts` for why). A locale mapper that started emitting one of these
 *    fields — with a partial value, or none at all — would silently reintroduce the validation
 *    failure the carry exists to prevent, so the carried value takes precedence. Emitting a
 *    field per locale on purpose means dropping it from the carry list.
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
  return { ...localeData, ...carried };
}
