import { useCallback, useMemo } from "react";

import { useNavigate, useSearch } from "@tanstack/react-router";

export const URL_STATE_KEYS = ["bbox", "defaultTopics", "country"] as const;

export type UrlStateKey = (typeof URL_STATE_KEYS)[number];

export type UrlStateSearch = Partial<Record<UrlStateKey, string>>;

export type SearchParser<T> = {
  parse: (value: string) => T | null;
  serialize: (value: T) => string;
  eq: (a: T, b: T) => boolean;
  defaultValue?: T;
  history?: "push" | "replace";
  clearOnDefault?: boolean;
};

type SearchUpdater<T> = (prev: T) => T | null;

export type SetSearchState<T> = (value: T | null | SearchUpdater<T>) => Promise<void>;

function getSearchString(value: unknown): string | undefined {
  const first = Array.isArray(value) ? value[0] : value;
  return typeof first === "string" ? first : undefined;
}

export function getUrlStateSearch(search: Record<string, unknown>): UrlStateSearch {
  const urlState: UrlStateSearch = {};

  for (const key of URL_STATE_KEYS) {
    const value = getSearchString(search[key]);
    if (value !== undefined) urlState[key] = value;
  }

  return urlState;
}

export function getParsedValue<T>(parser: SearchParser<T>, query: string | undefined): T | null {
  if (query === undefined) return null;

  try {
    return parser.parse(query) ?? null;
  } catch {
    return null;
  }
}

export function getSerializedValue<T>(
  parser: SearchParser<T>,
  value: T | null,
): string | undefined {
  if (value === null) return undefined;

  const isDefault = parser.defaultValue !== undefined && parser.eq(value, parser.defaultValue);
  if ((parser.clearOnDefault ?? true) && isDefault) return undefined;

  return parser.serialize(value);
}

function isUpdater<T>(value: T | null | SearchUpdater<T>): value is SearchUpdater<T> {
  return typeof value === "function";
}

export function useSearchState<T>(
  key: UrlStateKey,
  parser: SearchParser<T> & { defaultValue: T },
): [T, SetSearchState<T>];
export function useSearchState<T>(
  key: UrlStateKey,
  parser: SearchParser<T>,
): [T | null, SetSearchState<T | null>];
export function useSearchState<T>(
  key: UrlStateKey,
  parser: SearchParser<T>,
): [T | null, SetSearchState<T | null>] {
  const navigate = useNavigate();
  const query = useSearch({ strict: false, select: (search) => getSearchString(search[key]) });

  const value = useMemo(
    () => getParsedValue(parser, query) ?? parser.defaultValue ?? null,
    [parser, query],
  );

  const setValue = useCallback<SetSearchState<T | null>>(
    (next) =>
      navigate({
        to: ".",
        search: (prev: Record<string, unknown>) => {
          const prevValue =
            getParsedValue(parser, getSearchString(prev[key])) ?? parser.defaultValue ?? null;
          const nextValue = isUpdater(next) ? next(prevValue) : next;
          return { ...prev, [key]: getSerializedValue(parser, nextValue) };
        },
        replace: (parser.history ?? "replace") === "replace",
        resetScroll: false,
        hash: true,
      }),
    [key, navigate, parser],
  );

  return [value, setValue];
}
