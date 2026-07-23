import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";

import { ActionsReport } from "./index";

vi.mock("next/navigation", () => ({
  useParams: vi.fn().mockReturnValue({ id: "report-123" }),
}));

vi.mock("@/i18n/navigation", () => ({
  useRouter: vi.fn().mockReturnValue({ replace: vi.fn(), push: vi.fn() }),
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("@/containers/results/callbacks", () => ({
  useSaveReportCallback: vi.fn(() => ({
    mutation: { isPending: false },
    handleSave: vi.fn(),
  })),
  useDuplicateReportCallback: vi.fn(() => ({
    mutation: { isPending: false },
    handleDuplicate: vi.fn(),
  })),
}));

vi.mock("@/lib/report", () => ({
  useCanEditReport: vi.fn().mockReturnValue(true),
}));

vi.mock("@/app/(frontend)/store", () => ({
  useReportFormChanged: vi.fn().mockReturnValue(false),
}));

describe("ActionsReport", () => {
  test("renders dropdown trigger button with ellipsis icon", () => {
    render(<ActionsReport />);

    const triggerButton = screen.getByRole("button", { name: /open menu/i });
    expect(triggerButton).toBeInTheDocument();
  });

  test("clicking trigger opens dropdown with all action items", async () => {
    render(<ActionsReport />);

    const triggerButton = screen.getByRole("button", { name: /open menu/i });
    fireEvent.pointerDown(triggerButton, { button: 0, pointerType: "mouse" });

    await waitFor(() => {
      expect(screen.getByText("share")).toBeInTheDocument();
    });

    expect(screen.getByText("download")).toBeInTheDocument();
    expect(screen.getByText("report-results-action-duplicate")).toBeInTheDocument();
    expect(screen.getByText("report-results-buttons-new-report")).toBeInTheDocument();
    expect(screen.getByText("help")).toBeInTheDocument();
  });

  test("passes report ID from useParams to child components", async () => {
    render(<ActionsReport />);

    const triggerButton = screen.getByRole("button", { name: /open menu/i });
    fireEvent.pointerDown(triggerButton, { button: 0, pointerType: "mouse" });

    await waitFor(() => {
      expect(screen.getByText("help")).toBeInTheDocument();
    });

    // The help action renders an anchor with locale-based href
    const helpMenuItem = screen.getByText("help").closest("[role='menuitem']");
    expect(helpMenuItem).toHaveAttribute(
      "href",
      "https://rise.articulate.com/share/DzHpFspTQWmMCeeoMXA2_6v5Zljl-b7i#/?locale=en-us",
    );
  });

  test("renders separators between action groups", async () => {
    render(<ActionsReport />);

    const triggerButton = screen.getByRole("button", { name: /open menu/i });
    fireEvent.pointerDown(triggerButton, { button: 0, pointerType: "mouse" });

    await waitFor(() => {
      expect(screen.getByText("share")).toBeInTheDocument();
    });

    const separators = screen.getAllByRole("separator");
    expect(separators.length).toBeGreaterThanOrEqual(2);
  });
});
