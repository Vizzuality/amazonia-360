import { queryOptions, useQuery } from "@tanstack/react-query";
import { useLocale } from "use-intl";

import { fetchCountryModules, fetchPartners } from "@/lib/cms-content";

import type { CountryModule, Partner } from "./types";

const NO_MODULES: readonly CountryModule[] = [];
const NO_PARTNERS: readonly Partner[] = [];
const NO_SLUGS: readonly string[] = [];

export const getCountryModulesQueryOptions = (locale: string) =>
  queryOptions({
    queryKey: ["country-modules", locale] as const,
    queryFn: () => fetchCountryModules({ locale }),
    staleTime: Infinity,
  });

export const getPartnersQueryOptions = (locale: string) =>
  queryOptions({
    queryKey: ["partners", locale] as const,
    queryFn: () => fetchPartners({ locale }),
    staleTime: Infinity,
  });

export const getActiveModuleSlugs = (modules: readonly CountryModule[]): readonly string[] =>
  modules.map(({ slug }) => slug);

export const useGetCountryModules = (): readonly CountryModule[] => {
  const { data } = useQuery(getCountryModulesQueryOptions(useLocale()));
  return data ?? NO_MODULES;
};

export const useGetPartners = (): readonly Partner[] => {
  const { data } = useQuery(getPartnersQueryOptions(useLocale()));
  return data ?? NO_PARTNERS;
};

export const useGetActiveModuleSlugs = (): readonly string[] => {
  const { data } = useQuery({
    ...getCountryModulesQueryOptions(useLocale()),
    select: getActiveModuleSlugs,
  });
  return data ?? NO_SLUGS;
};
