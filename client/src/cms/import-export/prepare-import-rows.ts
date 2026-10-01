import type { Field } from "payload";

export type ImportRow = Record<string, unknown>;

export type PrepareImportRowsOptions = {
  fields: Field[];
  locales: readonly string[];
  defaultLocale: string;
  /** Rows already stored, by Content Code, read with `locale: "all"`. */
  existing: Map<string, ImportRow>;
};

export const IMPORT_ROW_ERRORS = "__importRowErrors";

type NamedField = Field & { name: string };

const isNamed = (field: Field): field is NamedField => "name" in field && !!field.name;

const isLocalized = (field: NamedField) => "localized" in field && field.localized === true;

const isRequired = (field: NamedField) => "required" in field && field.required === true;

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isLocaleMap = (value: unknown, locales: readonly string[]) =>
  isPlainObject(value) &&
  Object.keys(value).length > 0 &&
  Object.keys(value).every((key) => locales.includes(key));

/**
 * The plugin writes a map's first locale through the default-locale request, then each other
 * locale on its own. Leading with the default locale, even as `undefined`, keeps a Spanish-only
 * edit out of the English slot; `undefined` leaves the stored English untouched.
 */
const toLocaleMap = (value: unknown, { locales, defaultLocale }: PrepareImportRowsOptions) =>
  isLocaleMap(value, locales)
    ? { [defaultLocale]: undefined, ...(value as Record<string, unknown>) }
    : { [defaultLocale]: value };

const normaliseId = (id: unknown) => (typeof id === "number" ? String(id) : id);

/** The plugin exports at depth 1, so a related entry comes back whole rather than as its Code. */
const normaliseRelation = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(normaliseRelation);
  return normaliseId(isPlainObject(value) && "id" in value ? value.id : value);
};

const childFields = (field: NamedField, item: unknown): Field[] => {
  if (field.type === "blocks") {
    const blockType = isPlainObject(item) ? item.blockType : undefined;
    return field.blocks.find((block) => block.slug === blockType)?.fields ?? [];
  }
  if (field.type === "array" || field.type === "group") return field.fields;

  return [];
};

const isStructured = (field: NamedField) =>
  field.type === "blocks" || field.type === "array" || field.type === "group";

/** Each item of an array or blocks field, or the group itself, paired with its fields. */
const children = (field: NamedField, value: unknown): [Record<string, unknown>, NamedField[]][] => {
  const items = field.type === "group" ? [value] : Array.isArray(value) ? value : [];

  return items
    .filter(isPlainObject)
    .map((item) => [item, childFields(field, item).filter(isNamed)]);
};

type NestedTranslation = { field: NamedField; locale: string; value: unknown };

/** Every value of every localized field nested inside `value`, one entry per locale. */
function nestedTranslations(
  value: unknown,
  field: NamedField,
  options: PrepareImportRowsOptions,
): NestedTranslation[] {
  return children(field, value).flatMap(([item, fields]) =>
    fields.flatMap((child) => {
      const childValue = item[child.name];

      if (isLocalized(child)) {
        return Object.entries(toLocaleMap(childValue, options)).map(([locale, translation]) => ({
          field: child,
          locale,
          value: translation,
        }));
      }
      return isStructured(child) ? nestedTranslations(childValue, child, options) : [];
    }),
  );
}

/** The non-default locales that some localized field nested inside `value` carries. */
const nestedLocales = (value: unknown, field: NamedField, options: PrepareImportRowsOptions) =>
  new Set(
    nestedTranslations(value, field, options)
      .filter(({ locale, value }) => locale !== options.defaultLocale && value !== undefined)
      .map(({ locale }) => locale),
  );

/** `value` as one locale sees it: every localized field nested inside it reduced to that locale. */
function inLocale(
  value: unknown,
  field: NamedField,
  locale: string,
  options: PrepareImportRowsOptions,
): unknown {
  if (isLocalized(field)) {
    if (isLocaleMap(value, options.locales)) return (value as Record<string, unknown>)[locale];
    return locale === options.defaultLocale ? value : undefined;
  }
  if (field.type === "relationship") return normaliseRelation(value);
  if (!isStructured(field)) return value;

  const resolveItem = (item: unknown) => {
    if (!isPlainObject(item)) return item;
    const resolved = { ...item };
    for (const child of childFields(field, item).filter(isNamed)) {
      if (child.name in item)
        resolved[child.name] = inLocale(item[child.name], child, locale, options);
    }
    return resolved;
  };

  if (field.type === "group") return resolveItem(value);
  return Array.isArray(value) ? value.map(resolveItem) : value;
}

/**
 * The plugin only splits locales at the top of a row, so a translated label inside a block
 * would reach the CMS as an object where a string belongs. Such a field becomes a map of whole
 * per-locale copies instead, which the plugin then writes one locale at a time.
 */
function prepareStructured(value: unknown, field: NamedField, options: PrepareImportRowsOptions) {
  const locales = nestedLocales(value, field, options);
  const base = inLocale(value, field, options.defaultLocale, options);
  if (locales.size === 0) return base;

  const map: Record<string, unknown> = { [options.defaultLocale]: base };
  for (const locale of locales) map[locale] = inLocale(value, field, locale, options);

  return map;
}

export function prepareImportRows(rows: ImportRow[], options: PrepareImportRowsOptions) {
  const fields = options.fields.filter(isNamed);

  return rows.map((row) => {
    const prepared: ImportRow = { ...row, id: normaliseId(row.id) };

    for (const field of fields) {
      if (!(field.name in row)) continue;

      if (isLocalized(field)) prepared[field.name] = toLocaleMap(row[field.name], options);
      else if (isStructured(field))
        prepared[field.name] = prepareStructured(row[field.name], field, options);
      else if (field.type === "relationship")
        prepared[field.name] = normaliseRelation(row[field.name]);
    }

    const errors = rowErrors(row, fields, options);
    if (errors.length > 0) prepared[IMPORT_ROW_ERRORS] = errors;

    return prepared;
  });
}

const isBlank = (value: unknown) => value === undefined || value === null || value === "";

const isTextField = (field: NamedField) => field.type === "text" || field.type === "textarea";

function rowErrors(row: ImportRow, fields: NamedField[], options: PrepareImportRowsOptions) {
  const errors: string[] = [];

  if (isBlank(row.id)) {
    errors.push("Content Code (`id`) is missing. Every catalogue row names its own.");
  }
  if (isBlank(row._status)) {
    errors.push('`_status` is missing. Set "draft" or "published" on every row.');
  }

  const localized = fields.filter((field) => isLocalized(field) && field.name in row);
  const written = new Map(
    localized.map((field) => [field.name, toLocaleMap(row[field.name], options)] as const),
  );

  for (const field of localized.filter(isTextField)) {
    for (const [locale, value] of Object.entries(written.get(field.name) ?? {})) {
      if (!isBlank(value) && typeof value !== "string") {
        errors.push(`\`${field.name}\` in \`${locale}\` must be text.`);
      }
    }
  }

  for (const field of fields.filter((f) => isStructured(f) && f.name in row)) {
    for (const nested of nestedTranslations(row[field.name], field, options)) {
      if (isTextField(nested.field) && !isBlank(nested.value) && typeof nested.value !== "string") {
        errors.push(
          `\`${field.name}\` has a \`${nested.field.name}\` in \`${nested.locale}\` that is not text.`,
        );
      }
    }
  }

  // Payload checks `required` against the locale it is writing, using what is stored for the
  // fields the row leaves out. A gap only shows once the plugin writes that locale on its own,
  // and the plugin logs that failure while counting the row as imported.
  const stored = isBlank(row.id) ? undefined : options.existing.get(String(row.id));
  const touched = new Set(
    [...written.values()].flatMap((map) =>
      Object.entries(map)
        .filter(([, value]) => value !== undefined)
        .map(([locale]) => locale),
    ),
  );
  if (!stored) touched.add(options.defaultLocale);

  for (const locale of options.locales.filter((code) => touched.has(code))) {
    for (const field of fields.filter((f) => isLocalized(f) && isRequired(f))) {
      const fromRow = written.get(field.name)?.[locale];
      const value =
        fromRow !== undefined ? fromRow : toLocaleMap(stored?.[field.name], options)[locale];

      if (isBlank(value)) {
        errors.push(
          `\`${field.name}\` is required in \`${locale}\`, and this row leaves it empty.`,
        );
      }
    }
  }

  return errors;
}
