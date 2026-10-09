import { useCountry } from "@/i18n/use-country";

import { useGetCountryModules } from "./queries";
import type { CountryModule, Partner } from "./types";

export {
  getCountryModulesQueryOptions,
  getPartnersQueryOptions,
  useGetActiveModuleSlugs,
  useGetCountryModules,
  useGetPartners,
} from "./queries";
export type { CountryModule, Partner } from "./types";

export function getCountryModuleBySlug(
  modules: readonly CountryModule[],
  slug: string | null,
): CountryModule | null {
  return modules.find((module) => module.slug === slug) ?? null;
}

export function getModulePartners(partners: readonly Partner[], moduleId: string): Partner[] {
  return partners.filter(({ moduleIds }) => moduleIds.includes(moduleId));
}

export function getRegionalPartners(partners: readonly Partner[]): Partner[] {
  return partners.filter(({ regional }) => regional);
}

export const useGetCountryModule = (): CountryModule | null => {
  const modules = useGetCountryModules();
  const slug = useCountry();
  return getCountryModuleBySlug(modules, slug);
};
