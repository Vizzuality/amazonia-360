import { render, screen } from "@testing-library/react";
import { vi } from "vitest";

import { DropdownMenuWrapper } from "@/containers/results/header/__tests__/helpers";

import { NewReportAction } from "./new";

vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

describe("NewReportAction", () => {
  test("renders the new report menu item with icon and translated text", () => {
    render(
      <DropdownMenuWrapper>
        <NewReportAction />
      </DropdownMenuWrapper>,
    );

    expect(screen.getByText("report-results-buttons-new-report")).toBeInTheDocument();
  });

  test("renders a link pointing to /reports", () => {
    render(
      <DropdownMenuWrapper>
        <NewReportAction />
      </DropdownMenuWrapper>,
    );

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/reports");
  });
});
