import { render, screen } from "@testing-library/react";
import { vi } from "vitest";

import { ECU_MODULE } from "@integration/fixtures/country-modules";

import { ModuleChips } from "./module-chip";

vi.mock("@/lib/country-modules", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/country-modules")>()),
  useGetCountryModules: () => [ECU_MODULE],
}));

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_FEATURE_FLAGS", "country-module");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("ModuleChips", () => {
  it("renders a chip with the module name and flag for a country module", () => {
    const { container } = render(<ModuleChips modules={[ECU_MODULE.id]} />);

    expect(screen.getAllByTestId("report-module-chip")).toHaveLength(1);
    expect(screen.getByText("Ecuador Amazonia")).toBeTruthy();
    expect(container.querySelector("img")).not.toBeNull();
  });

  it("renders the Amazon Region chip without a flag for a regional report", () => {
    const { container } = render(<ModuleChips modules={[]} />);

    expect(screen.getByText("country-module-amazon-region-name")).toBeTruthy();
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("svg")).not.toBeNull();
  });

  it("renders nothing when no module resolves", () => {
    render(<ModuleChips modules={["unknown-id"]} />);

    expect(screen.queryByTestId("report-module-chip")).toBeNull();
  });

  it("renders nothing with the country-module flag off", () => {
    vi.stubEnv("NEXT_PUBLIC_FEATURE_FLAGS", "");

    render(<ModuleChips modules={[]} />);

    expect(screen.queryByTestId("report-module-chip")).toBeNull();
  });
});
