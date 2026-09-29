import { ReactNode } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, renderHook, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider, createStore } from "jotai";
import { vi } from "vitest";

import { tmpBboxAtom } from "@/app/(frontend)/store";

import { TooltipProvider } from "@/components/ui/tooltip";

import MobileCountrySelector from "./mobile";
import { getTooltipPlacement } from "./module-list";
import { useCountryOptions } from "./options";

import CountrySelector from "./index";

const mockPathname = vi.fn<() => string>(() => "/reports/grid");
const mockSearchParams = vi.fn(() => new URLSearchParams());
const mockCountry = vi.fn<() => string | null>(() => null);
const mockBoundary = vi.fn<() => Promise<{ extent: { id: string } } | null>>();
const mockLocation = vi.fn<() => unknown>(() => null);
const mockGeometry = vi.fn<() => unknown>(() => null);
const mockLiveBoundaries = vi.fn<() => unknown>(() => undefined);
const mockCalculating = vi.fn<() => boolean>(() => false);
const mockLiveOptions = vi.fn();
const mockRatio = vi.fn<() => number>(() => 1);

const AREA = { type: "polygon" };
const AREA_GEOMETRY = { id: "area-geometry" };
const LIVE_BOUNDARIES = [{ code: "ECU", geometry: { id: "ecu-boundary" } }];

vi.mock("@/app/(frontend)/store", async () => {
  const { atom } = await import("jotai");
  return {
    tmpBboxAtom: atom<unknown>(undefined),
    useSyncLocation: () => [mockLocation(), vi.fn()],
  };
});

vi.mock("@/lib/location", () => ({
  useLocationGeometryWithStatus: () => ({
    geometry: mockGeometry(),
    isCalculating: mockCalculating(),
  }),
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => mockSearchParams(),
}));

vi.mock("@/i18n/use-country", () => ({
  useCountry: () => mockCountry(),
}));

const mockIndicators =
  vi.fn<(args: unknown) => { data: { country: string | null }[] | undefined }>();

vi.mock("@/lib/indicators", () => ({
  useGetDefaultIndicators: (args: unknown) => mockIndicators(args),
}));

vi.mock("@/lib/country/coverage", () => ({
  useGetLiveCountryBoundaries: (options: unknown) => {
    mockLiveOptions(options);
    return { data: mockLiveBoundaries() };
  },
  getCountryCoverageRatio: () => mockRatio(),
  getCountryAmazoniaBoundaryOptions: (code: string) => ({
    queryKey: ["boundary", code],
    queryFn: () => mockBoundary(),
  }),
}));

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string, values?: Record<string, unknown>) =>
    values ? `${key}:${JSON.stringify(values)}` : key,
}));

vi.mock("@/i18n/navigation", () => ({
  usePathname: () => mockPathname(),
  LocaleLink: ({
    href,
    children,
    ...rest
  }: {
    href: { pathname: string; query: Record<string, string> };
    children?: ReactNode;
  }) => {
    const search = new URLSearchParams(href.query).toString();
    return (
      <a
        href={search ? `${href.pathname}?${search}` : href.pathname}
        onClick={(event) => event.preventDefault()}
        {...rest}
      >
        {children}
      </a>
    );
  },
}));

function setup() {
  const store = createStore();
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <Provider store={store}>
        <TooltipProvider>{children}</TooltipProvider>
      </Provider>
    </QueryClientProvider>
  );
  return { store, wrapper };
}

beforeEach(() => {
  mockPathname.mockReturnValue("/reports/grid");
  mockSearchParams.mockReturnValue(new URLSearchParams("bbox=1,2,3,4&x=1"));
  mockCountry.mockReturnValue(null);
  mockBoundary.mockResolvedValue({ extent: { id: "ecu-extent" } });
  mockLocation.mockReturnValue(null);
  mockGeometry.mockReturnValue(null);
  mockCalculating.mockReturnValue(false);
  mockLiveBoundaries.mockReturnValue(undefined);
  mockRatio.mockReturnValue(1);
  mockIndicators.mockReturnValue({
    data: [{ country: "ECU" }, { country: "ECU" }, { country: null }],
  });
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("useCountryOptions", () => {
  test("offers only the Amazon Region and the available country", () => {
    const { wrapper } = setup();
    const { result } = renderHook(() => useCountryOptions(), { wrapper });

    expect(result.current?.map((option) => option.code)).toEqual([null, "ECU"]);
  });

  test("marks the regional module active outside a country and builds hrefs that keep the query", () => {
    const { wrapper } = setup();
    const { result } = renderHook(() => useCountryOptions(), { wrapper });

    expect(result.current?.map((option) => option.active)).toEqual([true, false]);
    expect(result.current?.[0].href).toEqual({
      pathname: "/reports/grid",
      query: { bbox: "1,2,3,4", x: "1" },
    });
    expect(result.current?.[1].href).toEqual({
      pathname: "/ECU/reports/grid",
      query: { bbox: "1,2,3,4", x: "1" },
    });
  });

  test("marks the country active inside it and links the region to the stripped path", () => {
    mockCountry.mockReturnValue("ECU");
    const { wrapper } = setup();
    const { result } = renderHook(() => useCountryOptions(), { wrapper });

    expect(result.current?.map((option) => option.active)).toEqual([false, true]);
    expect(result.current?.[0].href.pathname).toBe("/reports/grid");
  });

  test("counts national datasets and partners in the country description", () => {
    const { wrapper } = setup();
    const { result } = renderHook(() => useCountryOptions(), { wrapper });

    expect(result.current?.[1].description).toBe(
      `country-module-country-description:${JSON.stringify({ count: 2, partners: 5 })}`,
    );
  });

  test("asks for the live modules' indicators on a regional pathname and counts them there", () => {
    const { wrapper } = setup();
    const { result } = renderHook(() => useCountryOptions(), { wrapper });

    expect(mockIndicators).toHaveBeenCalledWith({ locale: "en", country: ["ECU"] });
    expect(result.current?.[1].description).toContain('"count":2');
  });

  test("marks the country description as loading, with no count, until indicators arrive", () => {
    mockIndicators.mockReturnValue({ data: undefined });
    const { wrapper } = setup();
    const { result } = renderHook(() => useCountryOptions(), { wrapper });

    expect(result.current?.map((option) => option.isDescriptionLoading)).toEqual([false, true]);
    expect(result.current?.[1].description).toBe("");
  });

  test.each(["/private/my-reports", "/reports/some-saved-id"])("is null on %s", (pathname) => {
    mockPathname.mockReturnValue(pathname);
    const { wrapper } = setup();
    const { result } = renderHook(() => useCountryOptions(), { wrapper });

    expect(result.current).toBeNull();
  });

  test("is null when the country-module flag is off", () => {
    vi.stubEnv("NEXT_PUBLIC_FEATURE_FLAGS", "");
    const { wrapper } = setup();
    const { result } = renderHook(() => useCountryOptions(), { wrapper });

    expect(result.current).toBeNull();
  });
});

describe("CountrySelector (desktop)", () => {
  test("the trigger carries the structural hooks of the active module", () => {
    const { wrapper } = setup();
    render(<CountrySelector />, { wrapper });

    const trigger = screen.getByTestId("country-selector-trigger");
    expect(trigger).toHaveAttribute("data-country", "REGIONAL");
    expect(trigger).toHaveTextContent("country-module-amazon-region-name");
  });

  test("the trigger names the active country", () => {
    mockCountry.mockReturnValue("ECU");
    const { wrapper } = setup();
    render(<CountrySelector />, { wrapper });

    expect(screen.getByTestId("country-selector-trigger")).toHaveAttribute("data-country", "ECU");
  });

  test("opens onto exactly two rows, a section label and a disabled Learn more", async () => {
    const { wrapper } = setup();
    render(<CountrySelector />, { wrapper });
    await userEvent.click(screen.getByTestId("country-selector-trigger"));

    const rows = screen.getAllByTestId("country-selector-option");
    expect(rows.map((row) => row.getAttribute("data-country"))).toEqual(["REGIONAL", "ECU"]);
    expect(rows[0]).toHaveAttribute("aria-current", "page");
    expect(rows[1]).not.toHaveAttribute("aria-current");
    expect(screen.getByText("country-module-selector-section-label")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "country-module-partnerships-cta" })).toBeDisabled();
  });

  test("shows a skeleton instead of a count while indicators load, the number once loaded", async () => {
    mockIndicators.mockReturnValue({ data: undefined });
    const { wrapper } = setup();
    const { rerender } = render(<MobileCountrySelector onSelect={vi.fn()} />, { wrapper });

    const row = screen.getAllByTestId("country-selector-option")[1];
    expect(row).toHaveAttribute("aria-busy", "true");
    expect(row.querySelector(".animate-pulse")).toBeInTheDocument();
    expect(row).not.toHaveTextContent("0");

    mockIndicators.mockReturnValue({ data: [{ country: "ECU" }] });
    rerender(<MobileCountrySelector onSelect={vi.fn()} />);

    const loaded = screen.getAllByTestId("country-selector-option")[1];
    expect(loaded).toHaveAttribute("aria-busy", "false");
    expect(loaded.querySelector(".animate-pulse")).not.toBeInTheDocument();
    expect(loaded).toHaveTextContent('"count":1');
  });

  test("picking Ecuador pans the map to the module boundary and closes the panel", async () => {
    const { wrapper, store } = setup();
    render(<CountrySelector />, { wrapper });
    await userEvent.click(screen.getByTestId("country-selector-trigger"));
    await userEvent.click(screen.getAllByTestId("country-selector-option")[1]);

    await waitFor(() => expect(store.get(tmpBboxAtom)).toEqual({ id: "ecu-extent" }));
    expect(screen.queryByTestId("country-selector-option")).not.toBeInTheDocument();
  });

  test("a modified click on Ecuador neither pans nor closes the panel", async () => {
    const onSelect = vi.fn();
    const { wrapper, store } = setup();
    render(<MobileCountrySelector onSelect={onSelect} />, { wrapper });
    const row = screen.getAllByTestId("country-selector-option")[1];

    fireEvent.click(row, { ctrlKey: true });
    fireEvent.click(row, { metaKey: true });
    fireEvent.click(row, { shiftKey: true });
    fireEvent.click(row, { altKey: true });
    fireEvent.click(row, { button: 1 });

    expect(onSelect).not.toHaveBeenCalled();
    expect(mockBoundary).not.toHaveBeenCalled();
    expect(store.get(tmpBboxAtom)).toBeUndefined();
  });

  test("picking Ecuador does not pan when the boundary is missing or fails", async () => {
    mockBoundary.mockResolvedValueOnce(null);
    const { wrapper, store } = setup();
    render(<CountrySelector />, { wrapper });
    await userEvent.click(screen.getByTestId("country-selector-trigger"));
    await userEvent.click(screen.getAllByTestId("country-selector-option")[1]);
    await waitFor(() => expect(mockBoundary).toHaveBeenCalledTimes(1));
    expect(store.get(tmpBboxAtom)).toBeUndefined();
  });

  test("picking Ecuador swallows a failed boundary fetch", async () => {
    mockBoundary.mockRejectedValueOnce(new Error("boom"));
    const { wrapper, store } = setup();
    render(<CountrySelector />, { wrapper });
    await userEvent.click(screen.getByTestId("country-selector-trigger"));
    await userEvent.click(screen.getAllByTestId("country-selector-option")[1]);
    await waitFor(() => expect(mockBoundary).toHaveBeenCalledTimes(1));
    expect(store.get(tmpBboxAtom)).toBeUndefined();
  });

  test("picking the Amazon Region closes the panel without panning", async () => {
    mockCountry.mockReturnValue("ECU");
    const { wrapper, store } = setup();
    render(<CountrySelector />, { wrapper });
    await userEvent.click(screen.getByTestId("country-selector-trigger"));
    await userEvent.click(screen.getAllByTestId("country-selector-option")[0]);

    expect(mockBoundary).not.toHaveBeenCalled();
    expect(store.get(tmpBboxAtom)).toBeUndefined();
    expect(screen.queryByTestId("country-selector-option")).not.toBeInTheDocument();
  });

  test("renders nothing on an unscoped path", () => {
    mockPathname.mockReturnValue("/private/my-reports");
    const { wrapper } = setup();
    const { container } = render(<CountrySelector />, { wrapper });

    expect(container).toBeEmptyDOMElement();
  });

  test("renders nothing on a saved report", () => {
    mockPathname.mockReturnValue("/reports/some-saved-id");
    const { wrapper } = setup();
    const { container } = render(<CountrySelector />, { wrapper });

    expect(container).toBeEmptyDOMElement();
  });

  test("renders nothing when the country-module flag is off", () => {
    vi.stubEnv("NEXT_PUBLIC_FEATURE_FLAGS", "");
    const { wrapper } = setup();
    const { container } = render(<CountrySelector />, { wrapper });

    expect(container).toBeEmptyDOMElement();
  });
});

describe("MobileCountrySelector", () => {
  test("renders both rows inline and reports the selection", async () => {
    const onSelect = vi.fn();
    const { wrapper, store } = setup();
    render(<MobileCountrySelector onSelect={onSelect} />, { wrapper });

    const rows = screen.getAllByTestId("country-selector-option");
    expect(rows).toHaveLength(2);

    await userEvent.click(rows[1]);

    expect(onSelect).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(store.get(tmpBboxAtom)).toEqual({ id: "ecu-extent" }));
  });

  test("renders nothing when the flag is off", () => {
    vi.stubEnv("NEXT_PUBLIC_FEATURE_FLAGS", "");
    const { wrapper } = setup();
    const { container } = render(<MobileCountrySelector onSelect={vi.fn()} />, { wrapper });

    expect(container).toBeEmptyDOMElement();
  });
});

function arrangeArea({ ratio, resolved = true }: { ratio: number; resolved?: boolean }) {
  mockLocation.mockReturnValue(AREA);
  mockGeometry.mockReturnValue(resolved ? AREA_GEOMETRY : null);
  mockLiveBoundaries.mockReturnValue(LIVE_BOUNDARIES);
  mockRatio.mockReturnValue(ratio);
}

describe("getTooltipPlacement", () => {
  test("sits to the right of the row without a pointer", () => {
    expect(getTooltipPlacement(null)).toEqual({ side: "right" });
  });

  test("anchors 12px right of and 16px below the cursor", () => {
    expect(getTooltipPlacement({ x: 30, y: 20, rowHeight: 56 })).toEqual({
      side: "bottom",
      align: "start",
      alignOffset: 42,
      sideOffset: -20,
    });
  });
});

function getAnimationName(element: Element): string {
  return element.getAttribute("data-state") === "closed" ? "fade-out" : "none";
}

describe("country row availability", () => {
  test("is disabled only when a resolved area has nothing inside the resolved boundary", () => {
    arrangeArea({ ratio: 0 });
    const { wrapper } = setup();
    const { result } = renderHook(() => useCountryOptions(), { wrapper });

    expect(result.current?.map((option) => option.disabled)).toEqual([false, true]);
    expect(result.current?.[1].disabledReason).toBe(
      `country-module-selector-outside:${JSON.stringify({ name: "country-module-ECU-name" })}`,
    );
  });

  test.each([
    ["the area partly inside", () => arrangeArea({ ratio: 0.3 })],
    ["the geometry pending", () => arrangeArea({ ratio: 0, resolved: false })],
    [
      "the boundaries pending",
      () => {
        arrangeArea({ ratio: 0 });
        mockLiveBoundaries.mockReturnValue(undefined);
      },
    ],
    [
      "the new area still calculating",
      () => {
        arrangeArea({ ratio: 0 });
        mockCalculating.mockReturnValue(true);
      },
    ],
    [
      "the location cleared while the geometry is stale",
      () => {
        arrangeArea({ ratio: 0 });
        mockLocation.mockReturnValue(null);
      },
    ],
    [
      "the module already active",
      () => {
        arrangeArea({ ratio: 0 });
        mockCountry.mockReturnValue("ECU");
      },
    ],
    [
      "no area",
      () => {
        arrangeArea({ ratio: 0 });
        mockLocation.mockReturnValue(null);
        mockGeometry.mockReturnValue(null);
      },
    ],
  ])("stays enabled with %s", (_name, arrange) => {
    arrange();
    const { wrapper } = setup();
    const { result } = renderHook(() => useCountryOptions(), { wrapper });

    expect(result.current?.[1].disabled).toBe(false);
  });

  test("the live boundaries are only fetched once there is an area", () => {
    const { wrapper } = setup();
    renderHook(() => useCountryOptions(), { wrapper });
    expect(mockLiveOptions).toHaveBeenLastCalledWith({ enabled: false });

    arrangeArea({ ratio: 1 });
    renderHook(() => useCountryOptions(), { wrapper });
    expect(mockLiveOptions).toHaveBeenLastCalledWith({ enabled: true });
  });

  test("inside a module the live boundaries are not fetched", () => {
    arrangeArea({ ratio: 0 });
    mockCountry.mockReturnValue("ECU");
    const { wrapper } = setup();
    renderHook(() => useCountryOptions(), { wrapper });

    expect(mockLiveOptions).toHaveBeenLastCalledWith({ enabled: false });
  });

  test("the region row is never disabled", () => {
    arrangeArea({ ratio: 0 });
    const { wrapper } = setup();
    const { result } = renderHook(() => useCountryOptions(), { wrapper });

    expect(result.current?.[0].disabled).toBe(false);
  });

  test("a disabled row is not a link and does nothing when activated", async () => {
    arrangeArea({ ratio: 0 });
    const onSelect = vi.fn();
    const { wrapper, store } = setup();
    render(<MobileCountrySelector onSelect={onSelect} />, { wrapper });
    const row = screen.getAllByTestId("country-selector-option")[1];

    await userEvent.click(row);
    await userEvent.type(row, "{Enter}");

    expect(row.tagName).not.toBe("A");
    expect(row).not.toHaveAttribute("href");
    expect(row).not.toHaveAttribute("role");
    expect(row).not.toHaveAttribute("tabindex");
    expect(row).toHaveAttribute("aria-disabled", "true");
    expect(row).toHaveAttribute("data-disabled");
    expect(row).toHaveAttribute("data-country", "ECU");
    expect(onSelect).not.toHaveBeenCalled();
    expect(mockBoundary).not.toHaveBeenCalled();
    expect(store.get(tmpBboxAtom)).toBeUndefined();
  });

  test("an enabled row stays a link", () => {
    arrangeArea({ ratio: 0.3 });
    const { wrapper } = setup();
    render(<MobileCountrySelector onSelect={vi.fn()} />, { wrapper });

    expect(screen.getAllByTestId("country-selector-option")[1]).toHaveAttribute("href");
  });

  test("the mobile list shows the reason in place of the subtitle", () => {
    arrangeArea({ ratio: 0 });
    const { wrapper } = setup();
    render(<MobileCountrySelector onSelect={vi.fn()} />, { wrapper });
    const row = screen.getAllByTestId("country-selector-option")[1];

    expect(row).toHaveTextContent("country-module-selector-outside");
    expect(row).not.toHaveTextContent("country-module-country-description");
  });

  test("the desktop row keeps the subtitle and reveals the reason in a tooltip on hover", async () => {
    arrangeArea({ ratio: 0 });
    const { wrapper } = setup();
    render(<CountrySelector />, { wrapper });
    await userEvent.click(screen.getByTestId("country-selector-trigger"));
    const row = screen.getAllByTestId("country-selector-option")[1];

    expect(row).toHaveTextContent("country-module-country-description");
    expect(row).toHaveAttribute("tabindex", "0");
    expect(row).toHaveAttribute("role", "link");
    expect(row).toHaveAccessibleDescription(
      `country-module-selector-outside:${JSON.stringify({ name: "country-module-ECU-name" })}`,
    );

    await userEvent.hover(row);

    expect(await screen.findByRole("tooltip")).toHaveTextContent("country-module-selector-outside");
  });

  test("the desktop tooltip follows the pointer below and right of the cursor", async () => {
    arrangeArea({ ratio: 0 });
    const { wrapper } = setup();
    render(<CountrySelector />, { wrapper });
    await userEvent.click(screen.getByTestId("country-selector-trigger"));
    const row = screen.getAllByTestId("country-selector-option")[1];

    await userEvent.pointer({ target: row, coords: { clientX: 30, clientY: 20 } });

    await screen.findByRole("tooltip");
    const content = document.querySelector('[data-slot="tooltip-content"]');
    expect(content).toHaveAttribute("data-side", "bottom");
    expect(content).toHaveAttribute("data-align", "start");
  });

  test("the tooltip keeps its pointer placement while it closes", async () => {
    const realGetComputedStyle = window.getComputedStyle.bind(window);
    vi.spyOn(window, "getComputedStyle").mockImplementation((element, pseudo) => {
      const style = realGetComputedStyle(element, pseudo);
      return new Proxy(style, {
        get: (target, property) =>
          property === "animationName"
            ? getAnimationName(element)
            : Reflect.get(target, property, target),
      });
    });
    arrangeArea({ ratio: 0 });
    const { wrapper } = setup();
    render(<CountrySelector />, { wrapper });
    await userEvent.click(screen.getByTestId("country-selector-trigger"));
    const row = screen.getAllByTestId("country-selector-option")[1];

    await userEvent.pointer({ target: row, coords: { clientX: 30, clientY: 20 } });
    await screen.findByRole("tooltip");
    await userEvent.unhover(row);
    await userEvent.pointer({ target: document.body, coords: { clientX: 900, clientY: 900 } });

    const closing = document.querySelector('[data-slot="tooltip-content"]');
    await waitFor(() => expect(closing).toHaveAttribute("data-state", "closed"));
    expect(closing).toHaveAttribute("data-side", "bottom");

    vi.restoreAllMocks();
  });

  test("the tooltip opens on keyboard focus to the right of the row", async () => {
    arrangeArea({ ratio: 0 });
    const { wrapper } = setup();
    render(<CountrySelector />, { wrapper });
    await userEvent.click(screen.getByTestId("country-selector-trigger"));

    screen.getAllByTestId("country-selector-option")[1].focus();

    expect(await screen.findByRole("tooltip")).toHaveTextContent("country-module-selector-outside");
    expect(document.querySelector('[data-slot="tooltip-content"]')).toHaveAttribute(
      "data-side",
      "right",
    );
  });

  test("keyboard focus after the pointer has left drops the stale pointer placement", async () => {
    arrangeArea({ ratio: 0 });
    const { wrapper } = setup();
    render(<CountrySelector />, { wrapper });
    await userEvent.click(screen.getByTestId("country-selector-trigger"));
    const row = screen.getAllByTestId("country-selector-option")[1];

    await userEvent.pointer({ target: row, coords: { clientX: 30, clientY: 20 } });
    await userEvent.unhover(row);
    await userEvent.pointer({ target: document.body, coords: { clientX: 900, clientY: 900 } });
    await userEvent.tab();
    await userEvent.tab({ shift: true });

    await screen.findByRole("tooltip");
    expect(document.querySelector('[data-slot="tooltip-content"]')).toHaveAttribute(
      "data-side",
      "right",
    );
  });
});
