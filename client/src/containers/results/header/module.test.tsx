import { render, screen } from "@testing-library/react";
import { vi } from "vitest";

import ModuleReport from "./module";

const { mockModules } = vi.hoisted(() => ({ mockModules: vi.fn() }));

vi.mock("@/lib/report/use-report-modules", () => ({ useReportModules: () => mockModules() }));

vi.mock("next-intl", () => {
  const t = (key: string) => key;
  t.rich = (
    key: string,
    values: { names: string; count: number; b: (chunks: string) => React.ReactNode },
  ) => (
    <>
      {key}:{values.count}:{values.b(values.names)}
    </>
  );
  return {
    useTranslations: () => t,
    useFormatter: () => ({ list: (items: string[]) => items.join(" & ") }),
  };
});

describe("ModuleReport", () => {
  it("names the module the report was made with, in bold", () => {
    mockModules.mockReturnValue([{ code: "ECU", name: "Ecuador Amazonia" }]);

    render(<ModuleReport />);

    expect(screen.getByTestId("report-module-note")).toHaveTextContent(
      "country-module-report-note:1:Ecuador Amazonia",
    );
    expect(screen.getByText("Ecuador Amazonia")).toHaveClass("font-semibold");
  });

  it("names every module a report was built in", () => {
    mockModules.mockReturnValue([
      { code: "ECU", name: "Ecuador Amazonia" },
      { code: "PER", name: "Peru Amazonia" },
    ]);

    render(<ModuleReport />);

    expect(screen.getByTestId("report-module-note")).toHaveTextContent(
      "country-module-report-note:2:Ecuador Amazonia & Peru Amazonia",
    );
  });

  it("renders nothing with the country-module flag off", () => {
    mockModules.mockReturnValue(null);

    const { container } = render(<ModuleReport />);

    expect(container).toBeEmptyDOMElement();
  });
});
