import { fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";

import {
  createMockMutation,
  DropdownMenuWrapper,
} from "@/containers/results/header/__tests__/helpers";

import { DuplicateAction } from "./duplicate";

const mockHandleDuplicate = vi.fn();
const mockMutation = createMockMutation();

vi.mock("@/i18n/navigation", () => ({
  useRouter: vi.fn().mockReturnValue({ replace: vi.fn() }),
}));

vi.mock("@/containers/results/callbacks", () => ({
  useDuplicateReportCallback: vi.fn(() => ({
    mutation: mockMutation,
    handleDuplicate: mockHandleDuplicate,
  })),
}));

describe("DuplicateAction", () => {
  beforeEach(() => {
    mockMutation.isPending = false;
    mockHandleDuplicate.mockClear();
  });

  test("renders duplicate menu item with copy icon and translated text", () => {
    render(
      <DropdownMenuWrapper>
        <DuplicateAction reportId="test-id" />
      </DropdownMenuWrapper>,
    );

    expect(screen.getByText("report-results-action-duplicate")).toBeInTheDocument();
  });

  test("clicking the menu item calls handleDuplicate", () => {
    render(
      <DropdownMenuWrapper>
        <DuplicateAction reportId="test-id" />
      </DropdownMenuWrapper>,
    );

    const menuItem = screen
      .getByText("report-results-action-duplicate")
      .closest("[role='menuitem']");
    fireEvent.click(menuItem!);

    expect(mockHandleDuplicate).toHaveBeenCalledTimes(1);
  });

  test("while mutation is pending, item is disabled and shows spinner", () => {
    mockMutation.isPending = true;

    render(
      <DropdownMenuWrapper>
        <DuplicateAction reportId="test-id" />
      </DropdownMenuWrapper>,
    );

    const menuItem = screen
      .getByText("report-results-action-duplicate")
      .closest("[role='menuitem']");
    expect(menuItem).toHaveAttribute("data-disabled", "");
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  test("when mutation is not pending, item is enabled and shows copy icon", () => {
    render(
      <DropdownMenuWrapper>
        <DuplicateAction reportId="test-id" />
      </DropdownMenuWrapper>,
    );

    const menuItem = screen
      .getByText("report-results-action-duplicate")
      .closest("[role='menuitem']");
    expect(menuItem).not.toHaveAttribute("data-disabled");
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});
