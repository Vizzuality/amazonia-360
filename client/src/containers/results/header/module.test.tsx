import { render, screen } from "@testing-library/react";
import { vi } from "vitest";

import ModuleReport from "./module";

const { mockCountry, normaliseCodes } = vi.hoisted(() => ({
  mockCountry: vi.fn(),
  normaliseCodes: vi.fn(),
}));

vi.mock("@/lib/use-report-country", () => ({ useReportCountry: () => mockCountry() }));

vi.mock("@/lib/country", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/country")>();
  return { ...actual, getCountryCodes: (value: unknown) => normaliseCodes(value) };
});

beforeEach(async () => {
  const actual = await vi.importActual<typeof import("@/lib/country")>("@/lib/country");
  normaliseCodes.mockImplementation(actual.getCountryCodes);
  mockCountry.mockReturnValue(null);
});

describe("ModuleReport", () => {
  it("renders the module name for a report saved inside a module", () => {
    mockCountry.mockReturnValue(["ECU"]);

    render(<ModuleReport />);

    expect(screen.getByText("country-module-ECU-name")).toBeInTheDocument();
  });

  it("renders nothing for a report saved before country modules existed", () => {
    mockCountry.mockReturnValue(null);

    const { container } = render(<ModuleReport />);

    expect(container).toBeEmptyDOMElement();
  });

  // `getCountryCodes` drops codes that are not live yet, so a second module cannot be
  // exercised through it while ECU is the only available one.
  test("renders one badge per module a report was built in", () => {
    normaliseCodes.mockImplementation((value: string[]) => value);
    mockCountry.mockReturnValue(["ECU", "PER"]);

    render(<ModuleReport />);

    expect(screen.getByText("country-module-ECU-name")).toBeInTheDocument();
    expect(screen.getByText("country-module-PER-name")).toBeInTheDocument();
  });
});
