// @vitest-environment node
import { QueryClient } from "@tanstack/react-query";

const { findMock } = vi.hoisted(() => ({ findMock: vi.fn() }));

vi.mock("server-only", () => ({}));
vi.mock("@/payload.config", () => ({ default: {} }));
vi.mock("payload", () => ({ getPayload: async () => ({ find: findMock }) }));
vi.mock("@/lib/cms-content", () => ({
  getCountryModulesReadArgs: (locale: string) => ({ modulesArgsFor: locale }),
  getPartnersReadArgs: (locale: string) => ({ partnersArgsFor: locale }),
  getCountryModule: (doc: { id: string }) => ({ mapped: "module", id: doc.id }),
  getPartner: (doc: { id: string }) => ({ mapped: "partner", id: doc.id }),
}));

const { prefetchCountryModules } = await import("./prefetch");
const { getCountryModulesQueryOptions, getPartnersQueryOptions } = await import("./queries");

describe("prefetchCountryModules", () => {
  test("seeds both factories' keys with what the shared read args return, mapped", async () => {
    findMock.mockImplementation(async ({ collection }: { collection: string }) => ({
      docs: [{ id: `${collection}-1` }],
    }));
    const queryClient = new QueryClient();

    await prefetchCountryModules(queryClient, "es");

    expect(findMock).toHaveBeenCalledWith({ collection: "country-modules", modulesArgsFor: "es" });
    expect(findMock).toHaveBeenCalledWith({ collection: "partners", partnersArgsFor: "es" });
    expect(queryClient.getQueryData(getCountryModulesQueryOptions("es").queryKey)).toEqual([
      { mapped: "module", id: "country-modules-1" },
    ]);
    expect(queryClient.getQueryData(getPartnersQueryOptions("es").queryKey)).toEqual([
      { mapped: "partner", id: "partners-1" },
    ]);
  });
});
