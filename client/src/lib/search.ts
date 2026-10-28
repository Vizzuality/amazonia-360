import * as projectOperator from "@arcgis/core/geometry/operators/projectOperator";
import SpatialReference from "@arcgis/core/geometry/SpatialReference";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import SearchVM from "@arcgis/core/widgets/Search/SearchViewModel";
import {
  MutationFunction,
  QueryFunction,
  UseMutationOptions,
  UseQueryOptions,
  useMutation,
  useQuery,
} from "@tanstack/react-query";

import { getFeatures } from "@/lib/query";
import {
  getCountrySourceOverrides,
  getSources,
  SearchSourceProperties,
} from "@/lib/search-filters";
import { omit } from "@/lib/utils";

import type { CountryCode } from "@/constants/countries";
import { DATASETS } from "@/constants/datasets";
import { LocationType } from "@/constants/search";

if (!projectOperator.isLoaded()) {
  await projectOperator.load();
}

const SOURCES: Record<LocationType, SearchSourceProperties> = {
  country: {
    name: "Admin0",
    layer: new FeatureLayer(omit(DATASETS.admin0.layer, ["type"])),
    searchFields: ["NAME_0"],
    displayField: "COMPNAME",
    outFields: ["*"],
    maxResults: 1,
    maxSuggestions: 1,
    suggestionsEnabled: true,
    minSuggestCharacters: 2,
  },
  state: {
    name: "Admin1",
    layer: new FeatureLayer(omit(DATASETS.admin1.layer, ["type"])),
    searchFields: ["NAME_0", "NAME_1"],
    displayField: "COMPNAME",
    outFields: ["*"],
    maxResults: 1,
    maxSuggestions: 2,
    suggestionsEnabled: true,
    minSuggestCharacters: 1,
  },
  municipality: {
    name: "Admin2",
    layer: new FeatureLayer(omit(DATASETS.admin2.layer, ["type"])),
    searchFields: ["NAME_0", "NAME_1", "NAME_2"],
    displayField: "COMPNAME",
    outFields: ["*"],
    maxResults: 1,
    maxSuggestions: 2,
    suggestionsEnabled: true,
    minSuggestCharacters: 1,
  },
  capital: {
    name: "Ciudades Capitales",
    layer: new FeatureLayer(omit(DATASETS.ciudades_capitales.layer, ["type"])),
    searchFields: ["NOMBCAP", "NAME_0", "NAME_1", "NAME_2"],
    displayField: "COMPNAME",
    outFields: ["*"],
    maxResults: 1,
    maxSuggestions: 2,
    suggestionsEnabled: true,
    minSuggestCharacters: 1,
  },
  city: {
    name: "ArcGIS World Geocoding Service",
    url: "https://geocode-api.arcgis.com/arcgis/rest/services/World/GeocodeServer",
    singleLineFieldName: "SingleLine",
    countryCode: ["BRA", "BOL", "COL", "ECU", "PER", "VEN"].join(","),
    outFields: ["*"],
    maxResults: 1,
    maxSuggestions: 2,
    suggestionsEnabled: true,
    minSuggestCharacters: 1,
    categories: ["City"],
  },
  "protected-area": {
    name: "Protected areas",
    layer: new FeatureLayer(omit(DATASETS.protected_areas.layer, ["type"])),
    searchFields: ["NAME"],
    displayField: "NAME",
    outFields: ["*"],
    maxResults: 1,
    maxSuggestions: 2,
    suggestionsEnabled: true,
    minSuggestCharacters: 1,
  },
  "indigenous-territory": {
    name: "Indigenous territories",
    layer: new FeatureLayer(omit(DATASETS.indigenous_territories.layer, ["type"])),
    searchFields: ["nombre"],
    displayField: "nombre",
    suggestionTemplate: "{nombre}, {pais}",
    outFields: ["*"],
    maxResults: 1,
    maxSuggestions: 2,
    suggestionsEnabled: true,
    minSuggestCharacters: 1,
  },
};

const searchVM = new SearchVM({
  popupEnabled: false,
  autoSelect: false,
  includeDefaultSources: false,
  sources: getSources(SOURCES),
});

const countrySearchVMs = new Map<CountryCode, Promise<SearchVM>>();

const getCountryGeometry = async (country: CountryCode) => {
  const { features } = await getFeatures({
    feature: DATASETS.admin0.layer,
    query: DATASETS.admin0.getFeatures({
      where: `GID_0 = '${country}'`,
      outFields: ["GID_0"],
      returnGeometry: true,
      maxAllowableOffset: 500,
    }),
  });

  return features[0]?.geometry ?? null;
};

const getCountrySearchVM = (country: CountryCode): Promise<SearchVM> => {
  const cached = countrySearchVMs.get(country);
  if (cached) return cached;

  const vm = getCountryGeometry(country).then((geometry) => {
    if (!geometry) countrySearchVMs.delete(country);

    return new SearchVM({
      popupEnabled: false,
      autoSelect: false,
      includeDefaultSources: false,
      sources: getSources(SOURCES, getCountrySourceOverrides(country, geometry)),
    });
  });

  countrySearchVMs.set(country, vm);
  vm.catch(() => countrySearchVMs.delete(country));

  return vm;
};

/**
 ************************************************************
 ************************************************************
 * Suggestions
 * useGetSuggestions
 ************************************************************
 ************************************************************
 */

export type GetSuggestParams = {
  text: string;
  country?: CountryCode | null;
};
export const getSuggestions = async (params: GetSuggestParams) => {
  const { text, country } = params;

  if (!text) {
    throw new Error("text is required");
  }

  if (country) {
    const countrySearchVM = await getCountrySearchVM(country);
    return countrySearchVM.suggest(text);
  }

  return searchVM.suggest(text);
};

export const getSuggestionsQueryKey = (params: GetSuggestParams) => {
  const { text, country } = params;
  return ["arcgis", "suggest", text, country ?? null] as const;
};

export const getSuggestionsQueryOptions = <
  TData = Awaited<ReturnType<typeof getSuggestions>>,
  TError = unknown,
>(
  params: GetSuggestParams,
  options?: Omit<
    UseQueryOptions<Awaited<ReturnType<typeof getSuggestions>>, TError, TData>,
    "queryKey"
  >,
) => {
  const queryKey = getSuggestionsQueryKey(params);
  const queryFn: QueryFunction<Awaited<ReturnType<typeof getSuggestions>>> = () =>
    getSuggestions(params);
  return { queryKey, queryFn, ...options };
};

export const useGetSuggestions = <
  TData = Awaited<ReturnType<typeof getSuggestions>>,
  TError = unknown,
>(
  params: GetSuggestParams,
  options?: Omit<
    UseQueryOptions<Awaited<ReturnType<typeof getSuggestions>>, TError, TData>,
    "queryKey"
  >,
) => {
  const { queryKey, queryFn } = getSuggestionsQueryOptions(params, options);

  return useQuery({
    queryKey,
    queryFn,
    ...options,
  });
};

/**
 ************************************************************
 ************************************************************
 * Search
 * useGetSearch
 ************************************************************
 ************************************************************
 */
export type SearchResult = {
  text: string;
  key: string | number;
  sourceIndex: number;
};
export type GetSearchParams = SearchResult | null | undefined;
export const getSearch = async (params: GetSearchParams) => {
  if (!params) return null;

  const { text, key, sourceIndex } = params;

  if (!text || !key || sourceIndex === undefined) {
    console.error("text, key and sourceIndex are required");
  }

  const g = await searchVM.search(params as unknown as __esri.SuggestResult).then((res) => {
    if (res?.numResults === 1) {
      const r = res?.results?.[0].results?.[0];

      if (!r?.feature?.geometry) return null;

      const projectedGeo = projectOperator.execute(
        r.feature.geometry,
        new SpatialReference({ wkid: 102100 }),
      );

      if (!projectedGeo) return null;

      return {
        type: projectedGeo.type,
        geometry: projectedGeo.toJSON(),
      };
    }
    return null;
  });

  return g;
};

export const getSearchQueryKey = (params: GetSearchParams) => {
  if (!params) return ["arcgis", "suggest", ""] as const;

  const { text, key, sourceIndex } = params;

  if (!text || !key || sourceIndex === undefined) {
    console.error("text, key and sourceIndex are required");
  }

  return ["arcgis", "suggest", text, key, sourceIndex] as const;
};

export const getSearchQueryOptions = <
  TData = Awaited<ReturnType<typeof getSearch>>,
  TError = unknown,
>(
  params?: GetSearchParams,
  options?: Omit<UseQueryOptions<Awaited<ReturnType<typeof getSearch>>, TError, TData>, "queryKey">,
) => {
  const queryKey = getSearchQueryKey(params);
  const queryFn: QueryFunction<Awaited<ReturnType<typeof getSearch>>> = () => getSearch(params);
  return { queryKey, queryFn, ...options };
};

export const useGetSearch = <TData = Awaited<ReturnType<typeof getSearch>>, TError = unknown>(
  params: GetSearchParams,
  options?: Omit<UseQueryOptions<Awaited<ReturnType<typeof getSearch>>, TError, TData>, "queryKey">,
) => {
  const { queryKey, queryFn } = getSearchQueryOptions(params, options);

  return useQuery({
    queryKey,
    queryFn,
    ...options,
  });
};

/**
 ************************************************************
 ************************************************************
 * Search
 * useGetMutationSearch
 ************************************************************
 ************************************************************
 */

export const getSearchMutationOptions = <TError = unknown, TContext = unknown>(
  options?: UseMutationOptions<
    Awaited<ReturnType<typeof getSearch>>,
    TError,
    SearchResult,
    TContext
  >,
): UseMutationOptions<Awaited<ReturnType<typeof getSearch>>, TError, SearchResult, TContext> => {
  const mutationFn: MutationFunction<Awaited<ReturnType<typeof getSearch>>, SearchResult> = (
    props,
  ) => getSearch(props);

  return { mutationFn, ...options };
};

export const useGetMutationSearch = <TError = unknown, TContext = unknown>(
  options?: UseMutationOptions<
    Awaited<ReturnType<typeof getSearch>>,
    TError,
    SearchResult,
    TContext
  >,
) => {
  const mutationOptions = getSearchMutationOptions(options);

  return useMutation(mutationOptions);
};
