import { fireEvent, render, screen } from "@testing-library/react";
import { useLocale } from "next-intl";
import { vi } from "vitest";

import {
  createMockMutation,
  DropdownMenuWrapper,
} from "@/containers/results/header/__tests__/helpers";

import { DownloadAction } from "./download";

const mockHandleSave = vi.fn();
const mockHandleDuplicate = vi.fn();
const mockSaveMutation = createMockMutation();
const mockDuplicateMutation = createMockMutation();
const mockUseReportFormChanged = vi.fn().mockReturnValue(false);
const mockUseCanEditReport = vi.fn().mockReturnValue(true);

vi.mock("@/i18n/navigation", () => ({
  useRouter: vi.fn().mockReturnValue({ push: vi.fn() }),
}));

vi.mock("@/containers/results/callbacks", () => ({
  useSaveReportCallback: vi.fn(() => ({
    mutation: mockSaveMutation,
    handleSave: mockHandleSave,
  })),
  useDuplicateReportCallback: vi.fn(() => ({
    mutation: mockDuplicateMutation,
    handleDuplicate: mockHandleDuplicate,
  })),
}));

vi.mock("@/lib/report", () => ({
  useCanEditReport: vi.fn(() => mockUseCanEditReport()),
}));

vi.mock("@/app/(frontend)/store", () => ({
  useReportFormChanged: vi.fn(() => mockUseReportFormChanged()),
}));

describe("DownloadAction", () => {
  beforeEach(() => {
    vi.mocked(useLocale).mockReturnValue("en");
    mockUseReportFormChanged.mockReturnValue(false);
    mockUseCanEditReport.mockReturnValue(true);
    mockSaveMutation.isPending = false;
    mockDuplicateMutation.isPending = false;
    mockHandleSave.mockClear();
    mockHandleDuplicate.mockClear();
  });

  test("when form NOT changed, renders direct download link", () => {
    render(
      <DropdownMenuWrapper>
        <DownloadAction reportId="test-id" />
      </DropdownMenuWrapper>,
    );

    expect(screen.getByText("download")).toBeInTheDocument();
    expect(screen.getByRole("link")).toBeInTheDocument();
  });

  test("when form NOT changed, download link has correct href, target, rel", () => {
    render(
      <DropdownMenuWrapper>
        <DownloadAction reportId="test-id" />
      </DropdownMenuWrapper>,
    );

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/en/webshot/reports/test-id");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  test("when form IS changed, clicking opens AlertDialog with warning", () => {
    mockUseReportFormChanged.mockReturnValue(true);

    render(
      <DropdownMenuWrapper>
        <DownloadAction reportId="test-id" />
      </DropdownMenuWrapper>,
    );

    const menuItem = screen.getByText("download").closest("[role='menuitem']");
    fireEvent.click(menuItem!);

    expect(screen.getByText("report-results-unsaved-changes-title")).toBeInTheDocument();
  });

  test("when changed AND CAN edit, dialog shows save warning text", () => {
    mockUseReportFormChanged.mockReturnValue(true);
    mockUseCanEditReport.mockReturnValue(true);

    render(
      <DropdownMenuWrapper>
        <DownloadAction reportId="test-id" />
      </DropdownMenuWrapper>,
    );

    const menuItem = screen.getByText("download").closest("[role='menuitem']");
    fireEvent.click(menuItem!);

    expect(screen.getByText("report-results-unsaved-changes-download-warning")).toBeInTheDocument();
  });

  test("when changed AND CANNOT edit, dialog shows duplicate warning text", () => {
    mockUseReportFormChanged.mockReturnValue(true);
    mockUseCanEditReport.mockReturnValue(false);

    render(
      <DropdownMenuWrapper>
        <DownloadAction reportId="test-id" />
      </DropdownMenuWrapper>,
    );

    const menuItem = screen.getByText("download").closest("[role='menuitem']");
    fireEvent.click(menuItem!);

    expect(
      screen.getByText("report-results-unsaved-changes-download-warning-duplicate"),
    ).toBeInTheDocument();
  });

  test("when changed AND CAN edit, save button calls handleSave", () => {
    mockUseReportFormChanged.mockReturnValue(true);
    mockUseCanEditReport.mockReturnValue(true);

    render(
      <DropdownMenuWrapper>
        <DownloadAction reportId="test-id" />
      </DropdownMenuWrapper>,
    );

    const menuItem = screen.getByText("download").closest("[role='menuitem']");
    fireEvent.click(menuItem!);

    const saveButton = screen.getByRole("button", { name: /save/i });
    fireEvent.click(saveButton);

    expect(mockHandleSave).toHaveBeenCalledTimes(1);
  });

  test("when changed AND CANNOT edit, duplicate button calls handleDuplicate", () => {
    mockUseReportFormChanged.mockReturnValue(true);
    mockUseCanEditReport.mockReturnValue(false);

    render(
      <DropdownMenuWrapper>
        <DownloadAction reportId="test-id" />
      </DropdownMenuWrapper>,
    );

    const menuItem = screen.getByText("download").closest("[role='menuitem']");
    fireEvent.click(menuItem!);

    const duplicateButton = screen.getByRole("button", { name: /make-a-copy/i });
    fireEvent.click(duplicateButton);

    expect(mockHandleDuplicate).toHaveBeenCalledTimes(1);
  });

  test("save pending: save button disabled with spinner", () => {
    mockUseReportFormChanged.mockReturnValue(true);
    mockUseCanEditReport.mockReturnValue(true);
    mockSaveMutation.isPending = true;

    render(
      <DropdownMenuWrapper>
        <DownloadAction reportId="test-id" />
      </DropdownMenuWrapper>,
    );

    const menuItem = screen.getByText("download").closest("[role='menuitem']");
    fireEvent.click(menuItem!);

    const saveButton = screen.getByRole("button", { name: /save/i });
    expect(saveButton).toBeDisabled();
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  test("duplicate pending: duplicate button disabled with spinner", () => {
    mockUseReportFormChanged.mockReturnValue(true);
    mockUseCanEditReport.mockReturnValue(false);
    mockDuplicateMutation.isPending = true;

    render(
      <DropdownMenuWrapper>
        <DownloadAction reportId="test-id" />
      </DropdownMenuWrapper>,
    );

    const menuItem = screen.getByText("download").closest("[role='menuitem']");
    fireEvent.click(menuItem!);

    const duplicateButton = screen.getByRole("button", { name: /make-a-copy/i });
    expect(duplicateButton).toBeDisabled();
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  test("discard and continue link has correct download href", () => {
    mockUseReportFormChanged.mockReturnValue(true);

    render(
      <DropdownMenuWrapper>
        <DownloadAction reportId="test-id" />
      </DropdownMenuWrapper>,
    );

    const menuItem = screen.getByText("download").closest("[role='menuitem']");
    fireEvent.click(menuItem!);

    const discardLink = screen.getByRole("link");
    expect(discardLink).toHaveAttribute("href", "/en/webshot/reports/test-id");
  });

  test("cancel button closes dialog", () => {
    mockUseReportFormChanged.mockReturnValue(true);

    render(
      <DropdownMenuWrapper>
        <DownloadAction reportId="test-id" />
      </DropdownMenuWrapper>,
    );

    const menuItem = screen.getByText("download").closest("[role='menuitem']");
    fireEvent.click(menuItem!);

    expect(screen.getByText("report-results-unsaved-changes-title")).toBeInTheDocument();

    const cancelButton = screen.getByRole("button", { name: "cancel" });
    fireEvent.click(cancelButton);

    expect(screen.queryByText("report-results-unsaved-changes-title")).not.toBeInTheDocument();
  });
});
