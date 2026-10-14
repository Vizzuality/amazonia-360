import { render, screen } from "@testing-library/react";

import { IndicatorScopeBadge } from "./scope-badge";

describe("IndicatorScopeBadge", () => {
  it("renders the regional badge when the indicator has no module", () => {
    render(<IndicatorScopeBadge module={null} />);

    expect(screen.getByText("country-module-badge-regional")).toBeInTheDocument();
  });

  it("renders the module's tag for a scoped indicator", () => {
    render(<IndicatorScopeBadge module={{ slug: "ECU", tag: "ECU" }} />);

    expect(screen.getByText("ECU")).toBeInTheDocument();
    expect(screen.queryByText("country-module-badge-regional")).not.toBeInTheDocument();
  });
});
