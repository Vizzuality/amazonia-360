import type { Indicator } from "@/payload-types";

import { fixVisualizationTypes } from "./fixes";
import { omitUndefined } from "./map-topic";
import { json, localized, text, type Locale, type RawIndicator, type RawResource } from "./source";

type ResourceBlock = Indicator["resource"][number];
type FieldInfo = { fieldName: string; label: string };

export type IndicatorBaseData = {
  legacy_id: number;
  order: number;
  subtopic: string;
  name: string;
  description_short: string;
  unit?: string;
  description?: string;
  visualization_types?: Indicator["visualization_types"];
  resource: Indicator["resource"];
};

export type IndicatorLocaleData = {
  name?: string;
  unit?: string;
  description?: string;
  description_short?: string;
};

type RawPopupTemplate = {
  title?: string;
  content?: { type?: string; fieldInfos?: FieldInfo[] }[];
};

/**
 * The source stores `{ title, content: [{ type: 'fields', fieldInfos }] }`. The wrapper is
 * exactly one `type: 'fields'` element in all 45 rows that have content, and 10 rows are
 * title-only, so it is dropped on write and rebuilt deterministically on read.
 */
function mapPopupTemplate(value: unknown, legacyId: number) {
  const raw = json<RawPopupTemplate>(value);
  if (!raw) return undefined;

  const fieldInfos = (raw.content ?? []).find((c) => c.type === "fields")?.fieldInfos;
  const mapped = omitUndefined({
    title: text(raw.title),
    fieldInfos: fieldInfos?.length
      ? fieldInfos.map((f) => ({
          fieldName: requireText(
            f.fieldName,
            `indicator ${legacyId}: popupTemplate fieldInfo missing fieldName`,
          ),
          label: requireText(
            f.label,
            `indicator ${legacyId}: popupTemplate fieldInfo missing label`,
          ),
        }))
      : undefined,
  });

  return Object.keys(mapped).length > 0 ? mapped : undefined;
}

function mapLegend(value: unknown, legacyId: number, blockType: string) {
  const raw = json<{ type?: string; items?: { label: string; color: string }[] }>(value);
  if (!raw) throw new Error(`indicator ${legacyId}: ${blockType} resource missing legend`);

  return {
    type: (raw.type ?? "basic") as "basic",
    items: (raw.items ?? []).map((i) => ({
      label: requireText(i.label, `indicator ${legacyId}: legend item missing label`),
      color: requireText(i.color, `indicator ${legacyId}: legend item missing color`),
    })),
  };
}

function requireText(value: unknown, message: string): string {
  const result = text(value);
  if (!result) throw new Error(message);
  return result;
}

/**
 * Block slugs are the source `resource.type` verbatim, so `blockType` *is* the resource
 * type and phase 3 needs no mapping table.
 *
 * `layer_id` is dropped on every non-feature block: it is `'0'` on all 76 h3, 27 imagery
 * and 1 component rows, an inert placeholder, and those blocks have no such field.
 */
export function mapResource(resource: RawResource, legacyId: number): Indicator["resource"] {
  const name = text(resource.name);

  switch (resource.type) {
    // Fix 3 is structural: the feature block has no rasterFunction field, so indicator 12's
    // bare-string `rasterFunction: 'Forest_Cover_Change'` is never carried across. See
    // INDICATOR_DROPS_RASTER_FUNCTION in fixes.ts; asserted by the test suite.
    case "feature": {
      const block = {
        blockType: "feature" as const,
        url: requireText(resource.url, `indicator ${legacyId}: feature resource missing url`),
        layer_id: requireText(
          resource.layer_id,
          `indicator ${legacyId}: feature resource missing layer_id`,
        ),
        ...omitUndefined({
          name,
          popupTemplate: mapPopupTemplate(resource.popupTemplate, legacyId),
          query_numeric: json(resource.query_numeric),
          query_table: json(resource.query_table),
          query_chart: json(resource.query_chart),
          query_ai: json(resource.query_ai),
        }),
      };
      return [block as ResourceBlock];
    }

    case "imagery":
    case "imagery-tile": {
      const rasterFunction = json(resource.rasterFunction);
      if (rasterFunction === undefined) {
        throw new Error(`indicator ${legacyId}: ${resource.type} resource missing rasterFunction`);
      }

      return [
        {
          blockType: resource.type,
          url: requireText(resource.url, `indicator ${legacyId}: imagery resource missing url`),
          rasterFunction,
          legend: mapLegend(resource.legend, legacyId, resource.type),
          ...omitUndefined({ name }),
        } as ResourceBlock,
      ];
    }

    case "web-tile": {
      return [
        {
          blockType: "web-tile",
          url: requireText(resource.url, `indicator ${legacyId}: web-tile resource missing url`),
          ...omitUndefined({ name }),
        } as ResourceBlock,
      ];
    }

    case "h3": {
      return [
        {
          blockType: "h3",
          name: requireText(resource.name, `indicator ${legacyId}: h3 resource missing name`),
          column: requireText(resource.column, `indicator ${legacyId}: h3 resource missing column`),
          ...omitUndefined({ url: text(resource.url) }),
        } as ResourceBlock,
      ];
    }

    case "component": {
      return [
        {
          blockType: "component",
          name: requireText(
            resource.name,
            `indicator ${legacyId}: component resource missing name`,
          ),
          ...omitUndefined({ query_ai: json(resource.query_ai) }),
        } as ResourceBlock,
      ];
    }

    default:
      throw new Error(`indicator ${legacyId}: unknown resource type ${String(resource.type)}`);
  }
}

export function mapIndicatorBase(
  row: RawIndicator,
  subtopicIds: Map<number, string>,
): IndicatorBaseData {
  const name = localized(row, "name", "en");
  if (!name) throw new Error(`indicator ${row.id}: missing name_en`);

  const descriptionShort = localized(row, "description_short", "en");
  if (!descriptionShort) throw new Error(`indicator ${row.id}: missing description_short_en`);

  const subtopic = subtopicIds.get(row.subtopic_id);
  if (!subtopic) {
    throw new Error(`indicator ${row.id}: unresolvable subtopic ${row.subtopic_id}`);
  }

  const types = fixVisualizationTypes(row.id, row.visualization_types ?? []);

  return {
    legacy_id: row.id,
    order: row.order,
    subtopic,
    name,
    description_short: descriptionShort,
    resource: mapResource(row.resource, row.id),
    ...omitUndefined({
      unit: localized(row, "unit", "en"),
      description: localized(row, "description", "en"),
      visualization_types: types.length
        ? (types as NonNullable<Indicator["visualization_types"]>)
        : undefined,
    }),
  };
}

export function mapIndicatorLocale(row: RawIndicator, locale: Locale): IndicatorLocaleData {
  return omitUndefined({
    name: localized(row, "name", locale),
    unit: localized(row, "unit", locale),
    description: localized(row, "description", locale),
    description_short: localized(row, "description_short", locale),
  });
}
