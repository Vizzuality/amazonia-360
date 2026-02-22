import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";

import { DropdownMenuWrapper } from "@/containers/results/header/__tests__/helpers";

import { ShareAction } from "./share";

describe("ShareAction", () => {
  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  test("renders share menu item with icon and translated text", () => {
    render(
      <DropdownMenuWrapper>
        <ShareAction reportId="test-report-123" />
      </DropdownMenuWrapper>,
    );

    expect(screen.getByText("share")).toBeInTheDocument();
  });

  test("clicking opens the share dialog", () => {
    render(
      <DropdownMenuWrapper>
        <ShareAction reportId="test-report-123" />
      </DropdownMenuWrapper>,
    );

    const menuItem = screen.getByText("share").closest("[role='menuitem']");
    fireEvent.click(menuItem!);

    const titles = screen.getAllByText("report-results-copy-title");
    expect(titles.length).toBeGreaterThanOrEqual(1);
  });

  test("URL is correctly computed from reportId and locale", () => {
    render(
      <DropdownMenuWrapper>
        <ShareAction reportId="test-report-123" />
      </DropdownMenuWrapper>,
    );

    const menuItem = screen.getByText("share").closest("[role='menuitem']");
    fireEvent.click(menuItem!);

    expect(
      screen.getByText(`${window.location.origin}/en/reports/test-report-123`),
    ).toBeInTheDocument();
  });

  test("clicking copy button calls navigator.clipboard.writeText", async () => {
    render(
      <DropdownMenuWrapper>
        <ShareAction reportId="test-report-123" />
      </DropdownMenuWrapper>,
    );

    const menuItem = screen.getByText("share").closest("[role='menuitem']");
    fireEvent.click(menuItem!);

    const copyButton = screen.getByRole("button", { name: /copy/i });
    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        `${window.location.origin}/en/reports/test-report-123`,
      );
    });
  });

  test("after copy, button text changes to copied state", async () => {
    render(
      <DropdownMenuWrapper>
        <ShareAction reportId="test-report-123" />
      </DropdownMenuWrapper>,
    );

    const menuItem = screen.getByText("share").closest("[role='menuitem']");
    fireEvent.click(menuItem!);

    const copyButton = screen.getByRole("button", { name: /copy/i });
    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(screen.getByText("copied")).toBeInTheDocument();
    });
  });
});
