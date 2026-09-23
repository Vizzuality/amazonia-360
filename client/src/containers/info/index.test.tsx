import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";

vi.mock("@/lib/cms-content", () => ({ fetchIndicatorDescription: vi.fn() }));

const { fetchIndicatorDescription } = await import("@/lib/cms-content");
const { default: Info } = await import("./index");

const DESCRIPTIONS: Record<number, string> = {
  1: "Regional description",
  2: "Ecuador description",
};

function renderInfo(ids: number[]) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <Info ids={ids} />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.mocked(fetchIndicatorDescription).mockImplementation(async ({ id }) => DESCRIPTIONS[id]);
});

describe("Info", () => {
  it("shows a skeleton while the description is in flight", async () => {
    let release: (value: string) => void = () => {};
    vi.mocked(fetchIndicatorDescription).mockReturnValueOnce(
      new Promise<string>((resolve) => {
        release = resolve;
      }),
    );

    const { container } = renderInfo([1]);

    await waitFor(() => expect(container.querySelector(".animate-pulse")).toBeInTheDocument());
    expect(screen.queryByText("Regional description")).not.toBeInTheDocument();

    release("Regional description");

    await waitFor(() => expect(screen.getByText("Regional description")).toBeInTheDocument());
    expect(container.querySelector(".animate-pulse")).not.toBeInTheDocument();
  });

  it("renders a regional indicator's description", async () => {
    renderInfo([1]);

    await waitFor(() => expect(screen.getByText("Regional description")).toBeInTheDocument());
  });

  // The URL of a report page carries no module, so a catalogue lookup would miss this one.
  it("renders a country indicator's description without being told its module", async () => {
    renderInfo([2]);

    await waitFor(() => expect(screen.getByText("Ecuador description")).toBeInTheDocument());
    expect(vi.mocked(fetchIndicatorDescription)).toHaveBeenCalledWith({ id: 2, locale: "en" });
  });
});
