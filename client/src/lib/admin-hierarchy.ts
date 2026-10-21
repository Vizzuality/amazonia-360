import { LocationType } from "@/constants/search";

/**
 * When the location is itself an administrative unit, the other units it relates to are read
 * from how Countries, States and Municipalities nest, never from how their shapes overlap. The
 * Esri boundaries are simplified, so Pando's outline grazes Brazil and Peru and a spatial query
 * reports three countries for a department that lies in one.
 */

export type AdminLevel = 0 | 1 | 2;

/** A searched Country, State or Municipality, identified by its place in the nesting. */
export type AdminUnit = {
  level: AdminLevel;
  gid0: string;
  name1?: string;
  name2?: string;
};

const LEVEL_BY_LOCATION_TYPE: Partial<Record<LocationType, AdminLevel>> = {
  country: 0,
  state: 1,
  municipality: 2,
};

const getString = (value: unknown) =>
  typeof value === "string" && value.trim() !== "" ? value : undefined;

export const getAdminUnit = (
  type: LocationType | undefined,
  attributes: Record<string, unknown> | null | undefined,
): AdminUnit | null => {
  const level = type ? LEVEL_BY_LOCATION_TYPE[type] : undefined;
  const gid0 = getString(attributes?.GID_0);

  if (level === undefined || !attributes || !gid0) return null;

  const name1 = getString(attributes.NAME_1);
  const name2 = getString(attributes.NAME_2);

  if (level >= 1 && !name1) return null;
  if (level === 2 && !name2) return null;

  return {
    level,
    gid0,
    ...(level >= 1 && { name1 }),
    ...(level === 2 && { name2 }),
  };
};

/**
 * A layer whose features carry the nesting: the three boundary levels, and the capitals, which
 * name the Municipality and State they sit in. Other layers stay spatial.
 */
export type HierarchyLayer =
  | { kind: "admin"; level: AdminLevel; countryField: "GID_0" }
  | { kind: "capital"; countryField: "ISO" };

const HIERARCHY_LAYERS: [RegExp, HierarchyLayer][] = [
  [
    /\/Political_administrative_division_of_order_0\/FeatureServer/i,
    { kind: "admin", level: 0, countryField: "GID_0" },
  ],
  [
    /\/Political_administrative_division_of_order_1\/FeatureServer/i,
    { kind: "admin", level: 1, countryField: "GID_0" },
  ],
  [
    /\/Political_administrative_division_of_order_2\/FeatureServer/i,
    { kind: "admin", level: 2, countryField: "GID_0" },
  ],
  [
    /\/Administrative_capitals_at_admin_0_to_2_levels\/FeatureServer/i,
    { kind: "capital", countryField: "ISO" },
  ],
];

export const getHierarchyLayer = (url: string | null | undefined): HierarchyLayer | null =>
  HIERARCHY_LAYERS.find(([pattern]) => !!url && pattern.test(url))?.[1] ?? null;

/**
 * The capitals layer spells names its own way ("Federico Roman" against the boundaries'
 * "Federico Román"), so names compare without accents, case or stray spaces.
 */
export const normalizeName = (value: unknown) =>
  typeof value === "string"
    ? value
        .normalize("NFKD")
        .replace(/\p{Diacritic}/gu, "")
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim()
    : "";

/** The levels a feature of `layer` must agree with `unit` on. */
const getSharedDepth = (layer: HierarchyLayer, unit: AdminUnit) =>
  layer.kind === "admin" ? Math.min(layer.level, unit.level) : unit.level;

/**
 * Whether a feature belongs to the unit: the unit itself or one of its ancestors on coarser
 * levels, one of its descendants on finer ones, and any capital inside it.
 */
export const belongsToAdminUnit = (
  attributes: Record<string, unknown>,
  layer: HierarchyLayer,
  unit: AdminUnit,
) => {
  const depth = getSharedDepth(layer, unit);

  if (normalizeName(attributes[layer.countryField]) !== normalizeName(unit.gid0)) return false;
  if (depth >= 1 && normalizeName(attributes.NAME_1) !== normalizeName(unit.name1)) return false;
  if (depth >= 2 && normalizeName(attributes.NAME_2) !== normalizeName(unit.name2)) return false;

  return true;
};

/**
 * A layer at or above the unit's level holds exactly one match: the unit or its ancestor. That
 * ancestor exists even when the layer has no shape for it, as with a Municipality on the edge
 * of the study area whose State lies mostly outside the Amazon.
 */
export const isAncestorLayer = (layer: HierarchyLayer, unit: AdminUnit) =>
  layer.kind === "admin" && layer.level <= unit.level;

/** Stands in for an ancestor the layer has no shape for, named from the unit's own attributes. */
export const getAncestorAttributes = (layer: HierarchyLayer, unit: AdminUnit) => ({
  GID_0: unit.gid0,
  ...(layer.kind === "admin" && layer.level >= 1 && { NAME_1: unit.name1 }),
  ...(layer.kind === "admin" && layer.level >= 2 && { NAME_2: unit.name2 }),
});

export const getCountryWhere = (layer: HierarchyLayer, unit: AdminUnit) =>
  `${layer.countryField} = '${unit.gid0.replaceAll("'", "''")}'`;
