import { createElement, type ReactNode } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";

import { Indicator } from "@/types/indicator";
import { Subtopic } from "@/types/topic";

vi.mock("@/lib/cms-content", () => ({ fetchIndicators: vi.fn() }));
vi.mock("@/i18n/use-country", () => ({ useCountry: vi.fn() }));

const { fetchIndicators } = await import("@/lib/cms-content");
const { useCountry } = await import("@/i18n/use-country");
const {
  getIndicators,
  getIndicatorsKey,
  getIndicatorsOptions,
  useGetIndicators,
  useGetDefaultIndicators,
  useGetH3Indicators,
  useGetIndicatorsId,
  useGetIndicatorsLayerId,
} = await import("@/lib/indicators");

const fetchIndicatorsMock = vi.mocked(fetchIndicators);
const useCountryMock = vi.mocked(useCountry);

const subtopic = (over: Partial<Subtopic> & Pick<Subtopic, "id" | "topic_id">): Subtopic => ({
  name: "Subtopic",
  ...over,
});

const indicator = (over: Partial<Indicator> & Pick<Indicator, "id" | "name">): Indicator =>
  ({
    order: 0,
    subtopic: subtopic({ id: 0, topic_id: 0 }),
    resource: { type: "component", name: "total-area" },
    ...over,
  }) as Indicator;

function getWrapper() {
  const queryClient = new QueryClient();
  function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  }
  return Wrapper;
}

beforeEach(() => {
  vi.clearAllMocks();
  useCountryMock.mockReturnValue(null);
});

describe("getIndicators", () => {
  it("reads the catalogue for the given locale and module, sorted by name", async () => {
    fetchIndicatorsMock.mockResolvedValue([
      indicator({ id: 1, name: "Rivers" }),
      indicator({ id: 2, name: "Biodiversity" }),
    ]);

    const result = await getIndicators("en", ["ECU"]);

    expect(fetchIndicatorsMock).toHaveBeenCalledWith({ locale: "en", countries: ["ECU"] });
    expect(result.map((i) => i.name)).toEqual(["Biodiversity", "Rivers"]);
  });
});

describe("getIndicatorsKey", () => {
  it("carries the module, so two modules never share a cache entry", () => {
    expect(getIndicatorsKey("en", ["ECU"])).not.toEqual(getIndicatorsKey("en", []));
    expect(getIndicatorsKey("en", ["ECU"])).toEqual(["indicators", "en", "ECU"]);
    expect(getIndicatorsKey("en", ["ECU", "PER"])).toEqual(["indicators", "en", "ECU", "PER"]);
  });
});

describe("getIndicatorsOptions", () => {
  it("takes the module explicitly, for the non-hook callers outside React", async () => {
    fetchIndicatorsMock.mockResolvedValue([]);

    const options = getIndicatorsOptions("en", ["ECU"]);

    expect(options.queryKey).toEqual(getIndicatorsKey("en", ["ECU"]));
    await (options.queryFn as () => Promise<unknown>)();
    expect(fetchIndicatorsMock).toHaveBeenCalledWith({ locale: "en", countries: ["ECU"] });
  });
});

describe("useGetIndicators", () => {
  it("reads the module from the URL when none is supplied explicitly", async () => {
    useCountryMock.mockReturnValue("ECU");
    fetchIndicatorsMock.mockResolvedValue([]);

    const { result } = renderHook(() => useGetIndicators("en"), { wrapper: getWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(fetchIndicatorsMock).toHaveBeenCalledWith({ locale: "en", countries: ["ECU"] });
  });

  it("honours an explicit module over the URL's, for a report rendered outside its module", async () => {
    useCountryMock.mockReturnValue(null);
    fetchIndicatorsMock.mockResolvedValue([]);

    const { result } = renderHook(() => useGetIndicators("en", undefined, "ECU"), {
      wrapper: getWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(fetchIndicatorsMock).toHaveBeenCalledWith({ locale: "en", countries: ["ECU"] });
  });

  it("honours an explicit regional scope over a URL that is inside a module", async () => {
    useCountryMock.mockReturnValue("ECU");
    fetchIndicatorsMock.mockResolvedValue([]);

    const { result } = renderHook(() => useGetIndicators("en", undefined, null), {
      wrapper: getWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(fetchIndicatorsMock).toHaveBeenCalledWith({ locale: "en", countries: [] });
  });
});

describe("hooks built on useGetIndicators", () => {
  it("useGetDefaultIndicators forwards an explicit module past the URL", async () => {
    useCountryMock.mockReturnValue(null);
    fetchIndicatorsMock.mockResolvedValue([]);

    const { result } = renderHook(() => useGetDefaultIndicators({ locale: "en", country: "ECU" }), {
      wrapper: getWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(fetchIndicatorsMock).toHaveBeenCalledWith({ locale: "en", countries: ["ECU"] });
  });

  it("useGetH3Indicators forwards an explicit module past the URL", async () => {
    useCountryMock.mockReturnValue(null);
    fetchIndicatorsMock.mockResolvedValue([]);

    const { result } = renderHook(() => useGetH3Indicators({ locale: "en", country: "ECU" }), {
      wrapper: getWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(fetchIndicatorsMock).toHaveBeenCalledWith({ locale: "en", countries: ["ECU"] });
  });

  it("useGetIndicatorsId forwards an explicit module past the URL", async () => {
    useCountryMock.mockReturnValue(null);
    fetchIndicatorsMock.mockResolvedValue([indicator({ id: 1, name: "Rivers" })]);

    const { result } = renderHook(() => useGetIndicatorsId(1, "en", "ECU"), {
      wrapper: getWrapper(),
    });

    await waitFor(() => expect(fetchIndicatorsMock).toHaveBeenCalled());
    expect(fetchIndicatorsMock).toHaveBeenCalledWith({ locale: "en", countries: ["ECU"] });
    await waitFor(() => expect(result.current?.name).toBe("Rivers"));
  });

  it("useGetDefaultIndicators keeps a matching subtopic's non-h3 indicators, by display order", async () => {
    useCountryMock.mockReturnValue(null);
    fetchIndicatorsMock.mockResolvedValue([
      indicator({
        id: 1,
        name: "Grid",
        subtopic: subtopic({ id: 2, topic_id: 0 }),
        resource: { type: "h3", name: "Grid", column: "value" },
      }),
      indicator({ id: 2, name: "Second", order: 1, subtopic: subtopic({ id: 2, topic_id: 0 }) }),
      indicator({ id: 3, name: "First", order: 0, subtopic: subtopic({ id: 2, topic_id: 0 }) }),
      indicator({ id: 4, name: "Other subtopic", subtopic: subtopic({ id: 9, topic_id: 0 }) }),
    ]);

    const { result } = renderHook(() => useGetDefaultIndicators({ subtopicId: 2, locale: "en" }), {
      wrapper: getWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.map((i) => i.name)).toEqual(["First", "Second"]);
  });

  it("useGetH3Indicators keeps only the matching topic's h3 indicators", async () => {
    useCountryMock.mockReturnValue(null);
    fetchIndicatorsMock.mockResolvedValue([
      indicator({
        id: 1,
        name: "Grid",
        subtopic: subtopic({ id: 0, topic_id: 5 }),
        resource: { type: "h3", name: "Grid", column: "value" },
      }),
      indicator({ id: 2, name: "Chart", subtopic: subtopic({ id: 0, topic_id: 5 }) }),
      indicator({
        id: 3,
        name: "Other topic",
        subtopic: subtopic({ id: 0, topic_id: 9 }),
        resource: { type: "h3", name: "Grid", column: "value" },
      }),
    ]);

    const { result } = renderHook(() => useGetH3Indicators({ topicId: 5, locale: "en" }), {
      wrapper: getWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.map((i) => i.name)).toEqual(["Grid"]);
  });

  it("useGetIndicatorsLayerId forwards an explicit module past the URL", async () => {
    useCountryMock.mockReturnValue(null);
    fetchIndicatorsMock.mockResolvedValue([
      indicator({ id: 1, name: "Rivers", resource: { type: "web-tile", url: "https://tiles" } }),
    ]);

    renderHook(() => useGetIndicatorsLayerId(1, "en", {}, "ECU"), { wrapper: getWrapper() });

    await waitFor(() =>
      expect(fetchIndicatorsMock).toHaveBeenCalledWith({ locale: "en", countries: ["ECU"] }),
    );
  });
});
