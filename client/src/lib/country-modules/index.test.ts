import { createElement, type ReactNode } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";

import type { CountryModule, Partner } from "./types";

const { fetchCountryModulesMock, fetchPartnersMock, countryMock } = vi.hoisted(() => ({
  fetchCountryModulesMock: vi.fn(),
  fetchPartnersMock: vi.fn(),
  countryMock: vi.fn<() => string | null>(),
}));

vi.mock("@/lib/cms-content", () => ({
  fetchCountryModules: fetchCountryModulesMock,
  fetchPartners: fetchPartnersMock,
}));
vi.mock("next-intl", () => ({ useLocale: () => "es" }));
vi.mock("@/i18n/use-country", () => ({ useCountry: countryMock }));

const {
  getCountryModuleBySlug,
  getModulePartners,
  getRegionalPartners,
  useGetActiveModuleSlugs,
  useGetCountryModule,
  useGetCountryModules,
  useGetPartners,
} = await import("./index");

const getModule = (over: Partial<CountryModule> & Pick<CountryModule, "id" | "slug">) =>
  ({
    country: "ECU",
    name: "Ecuador",
    moduleName: "Ecuadorian Amazon",
    partnersDescription: null,
    bbox: null,
    ...over,
  }) satisfies CountryModule;

const getPartner = (over: Partial<Partner> & Pick<Partner, "id">) =>
  ({
    name: "Esri",
    label: null,
    logo: "/partners/esri.avif",
    logoSize: "default",
    regional: false,
    moduleIds: [],
    ...over,
  }) satisfies Partner;

const ECU = getModule({ id: "m1", slug: "ECU" });
const PARA = getModule({ id: "m2", slug: "bra-para", country: "BRA" });

function getWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  function Wrapper({ children }: Readonly<{ children: ReactNode }>) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  }
  return Wrapper;
}

beforeEach(() => {
  fetchCountryModulesMock.mockResolvedValue([ECU, PARA]);
  fetchPartnersMock.mockResolvedValue([]);
  countryMock.mockReturnValue(null);
});

describe("the hooks", () => {
  test("read the current locale's modules and partners, empty until they arrive", async () => {
    const partners = [getPartner({ id: "p1" })];
    fetchPartnersMock.mockResolvedValue(partners);
    const wrapper = getWrapper();

    const modules = renderHook(() => useGetCountryModules(), { wrapper });
    const partnersHook = renderHook(() => useGetPartners(), { wrapper });

    expect(modules.result.current).toEqual([]);
    expect(partnersHook.result.current).toEqual([]);
    await waitFor(() => expect(modules.result.current).toEqual([ECU, PARA]));
    await waitFor(() => expect(partnersHook.result.current).toEqual(partners));
    expect(fetchCountryModulesMock).toHaveBeenCalledWith({ locale: "es" });
    expect(fetchPartnersMock).toHaveBeenCalledWith({ locale: "es" });
  });

  test("reduce the modules to their slugs", async () => {
    const { result } = renderHook(() => useGetActiveModuleSlugs(), { wrapper: getWrapper() });

    await waitFor(() => expect(result.current).toEqual(["ECU", "bra-para"]));
  });

  test("resolve the URL's module, or none in the Amazon Region", async () => {
    countryMock.mockReturnValue("bra-para");
    const { result, rerender } = renderHook(() => useGetCountryModule(), { wrapper: getWrapper() });

    await waitFor(() => expect(result.current).toEqual(PARA));

    countryMock.mockReturnValue(null);
    rerender();
    expect(result.current).toBeNull();
  });
});

describe("the pure helpers", () => {
  test("find a module by its exact slug", () => {
    expect(getCountryModuleBySlug([ECU, PARA], "bra-para")).toBe(PARA);
    expect(getCountryModuleBySlug([ECU, PARA], "ecu")).toBeNull();
    expect(getCountryModuleBySlug([ECU, PARA], null)).toBeNull();
  });

  test("split partners by module and by region", () => {
    const regional = getPartner({ id: "p1", regional: true });
    const both = getPartner({ id: "p2", regional: true, moduleIds: ["m1"] });
    const moduleOnly = getPartner({ id: "p3", moduleIds: ["m1", "m2"] });
    const partners = [regional, both, moduleOnly];

    expect(getModulePartners(partners, "m1")).toEqual([both, moduleOnly]);
    expect(getModulePartners(partners, "m2")).toEqual([moduleOnly]);
    expect(getRegionalPartners(partners)).toEqual([regional, both]);
  });
});
