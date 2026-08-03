import type { Field, NonPresentationalField } from "payload";

/**
 * Any field that has a `name` — i.e. everything except layout fields (row, collapsible,
 * tabs). `FieldBase` gives all of these `required`, `localized`, `unique`, `index` and
 * `access`, so those read directly off the union with no cast.
 *
 * Starts from `NonPresentationalField` (Payload's own "everything but UI fields" union),
 * not `Field` directly: Payload's `UIField` has a `name` of its own but doesn't extend
 * `FieldBase`, so `Extract<Field, { name: string }>` would structurally admit it too —
 * and then `.required` wouldn't exist on the union. `RESOURCE_BLOCKS` never uses a `ui`
 * field, so excluding it here costs nothing.
 *
 * Type-specific properties (`options`, `hasMany`, `relationTo`, `minRows`) still need a
 * narrowing cast to the concrete field type at the point of use. Keep it that way — a
 * widened `any`-ish shape here would silently accept a wrong field name or type.
 */
export type NamedField = Extract<NonPresentationalField, { name: string }>;

const hasName = (field: Field): field is NamedField => "name" in field && field.type !== "ui";

export const namedFields = (fields: Field[]): NamedField[] => fields.filter(hasName);

export const findFieldByName = (fields: Field[], name: string): NamedField | undefined =>
  namedFields(fields).find((field) => field.name === name);

export const fieldNames = (fields: Field[]): string[] =>
  namedFields(fields).map((field) => field.name);

/** Treats the source JSON's `""` / `[]` / null sentinels as absent. */
export const isEmptyValue = (value: unknown): boolean =>
  value === null ||
  value === undefined ||
  value === "" ||
  (Array.isArray(value) && value.length === 0);
