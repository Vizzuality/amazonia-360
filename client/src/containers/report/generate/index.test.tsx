import type { ReactNode } from "react";

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";

import { Indicator } from "@/types/indicator";
import { Topic } from "@/types/topic";

import ReportGenerate from "@/containers/report/generate";

const {
  mockUseCountry,
  mockUseGetIndicators,
  mockUseGetDefaultTopics,
  mockUseGetDefaultSubtopics,
  mockUseSaveReport,
  mockMutateAsync,
  mockPush,
  mockGetPathname,
} = vi.hoisted(() => ({
  mockUseCountry: vi.fn(),
  mockUseGetIndicators: vi.fn(),
  mockUseGetDefaultTopics: vi.fn(),
  mockUseGetDefaultSubtopics: vi.fn(),
  mockUseSaveReport: vi.fn(),
  mockMutateAsync: vi.fn(),
  mockPush: vi.fn(),
  mockGetPathname: vi.fn(
    ({ href, locale }: { href: string; locale: string }) => `/${locale}${href}`,
  ),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/app/(frontend)/store", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/app/(frontend)/store")>();
  return { ...actual, useSyncLocation: () => [null, vi.fn()] };
});
vi.mock("@/i18n/use-country", () => ({ useCountry: () => mockUseCountry() }));
vi.mock("@/i18n/navigation", () => ({
  Link: ({ children }: { children: ReactNode }) => <>{children}</>,
}));
vi.mock("@/i18n/navigation-client", () => ({ getPathname: mockGetPathname }));
vi.mock("@/lib/topics", () => ({ useGetDefaultTopics: () => mockUseGetDefaultTopics() }));
vi.mock("@/lib/subtopics", () => ({ useGetDefaultSubtopics: () => mockUseGetDefaultSubtopics() }));
vi.mock("@/lib/indicators", () => ({ useGetIndicators: () => mockUseGetIndicators() }));
vi.mock("@/lib/report", () => ({ useSaveReport: () => mockUseSaveReport() }));
vi.mock("@/containers/report/generate/topics", () => ({ default: () => null }));
vi.mock("sonner", () => ({ toast: { promise: (promise: Promise<unknown>) => promise } }));

const buildIndicator = (over: Partial<Indicator> & Pick<Indicator, "id">): Indicator =>
  ({
    order: 0,
    name: "Indicator",
    subtopic: { id: 0, topic_id: 0, name: "Subtopic" },
    topic: { id: 0, name: "Topic" },
    visualization_types: [],
    resource: { type: "component", name: "total-area" },
    ...over,
  }) as Indicator;

const topicFixture: Topic = {
  id: 7,
  name: "Nature",
  image: "",
  default_visualization: [
    { id: "row-a", indicator_id: 11, type: "numeric", x: 0, y: 0, w: 1, h: 1 },
    { id: "row-b", indicator_id: 99, type: "numeric", x: 1, y: 0, w: 1, h: 1 },
  ],
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

async function submitReport() {
  render(<ReportGenerate />);
  fireEvent.click(screen.getByRole("button", { name: "select-all" }));
  fireEvent.click(screen.getByRole("button", { name: "create" }));
  await waitFor(() => expect(mockMutateAsync).toHaveBeenCalled());

  const [data] = mockMutateAsync.mock.calls[0];
  return data as {
    topics: { indicators: { id: string; indicator_id: number }[] }[];
    country: string | null;
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockUseGetDefaultTopics.mockReturnValue({ data: [topicFixture] });
  mockUseGetDefaultSubtopics.mockReturnValue({ data: [] });
  mockUseSaveReport.mockReturnValue({ mutateAsync: mockMutateAsync, isPending: false });
  mockMutateAsync.mockImplementation((data, options) => {
    options?.onSuccess?.({ id: "123" });
    return Promise.resolve({ id: "123" });
  });
});

describe("ReportGenerate", () => {
  it("substitutes a regional indicator with the active module's own indicator", async () => {
    mockUseCountry.mockReturnValue("ECU");
    mockUseGetIndicators.mockReturnValue({ data: [buildIndicator({ id: 216, replaces: "11" })] });

    const data = await submitReport();
    const indicators = data.topics[0].indicators;

    const substituted = indicators.find((i) => i.id.startsWith("row-a-"));
    const untouched = indicators.find((i) => i.id.startsWith("row-b-"));

    expect(substituted?.indicator_id).toBe(216);
    expect(substituted?.id.replace("row-a-", "")).toMatch(UUID_RE);
    expect(untouched?.indicator_id).toBe(99);
    expect(data.country).toEqual(["ECU"]);
  });

  it("leaves every indicator id untouched outside a module", async () => {
    mockUseCountry.mockReturnValue(null);
    mockUseGetIndicators.mockReturnValue({
      data: [buildIndicator({ id: 11 }), buildIndicator({ id: 14 })],
    });

    const data = await submitReport();
    const indicators = data.topics[0].indicators;

    expect(indicators.find((i) => i.id.startsWith("row-a-"))?.indicator_id).toBe(11);
    expect(indicators.find((i) => i.id.startsWith("row-b-"))?.indicator_id).toBe(99);
    expect(data.country).toBeNull();
  });

  it("routes to the saved report without a module segment in the URL", async () => {
    mockUseCountry.mockReturnValue("ECU");
    mockUseGetIndicators.mockReturnValue({ data: [] });

    await submitReport();

    expect(mockGetPathname).toHaveBeenCalledWith({ href: "/reports/123", locale: "en" });
    expect(mockPush).toHaveBeenCalledWith("/en/reports/123");
  });
});
