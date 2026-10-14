/**
 * The location type of each search source, in source order.
 *
 * A saved or shared search location stores its source by position (`sourceIndex`) and is
 * looked up again every time it is opened, so this order is a contract: append new
 * sources at the end, never reorder or remove one.
 */
export const LOCATION_TYPES = ["country", "state", "municipality", "capital", "city"] as const;

export type LocationType = (typeof LOCATION_TYPES)[number];
