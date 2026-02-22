import { fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";

import { createMockMutation } from "@/containers/results/header/__tests__/helpers";

import SaveReport from "./save";

const mockHandleSave = vi.fn();
const mockHandleDuplicate = vi.fn();
const mockSaveMutation = createMockMutation();
const mockDuplicateMutation = createMockMutation();
const mockUseReportFormChanged = vi.fn().mockReturnValue(false);
const mockUseCanEditReport = vi.fn().mockReturnValue(true);

vi.mock("next/navigation", () => ({
  useParams: vi.fn().mockReturnValue({ id: "report-123" }),
}));

vi.mock("@/i18n/navigation", () => ({
  useRouter: vi.fn().mockReturnValue({ replace: vi.fn() }),
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

describe("SaveReport", () => {
  beforeEach(() => {
    mockUseCanEditReport.mockReturnValue(true);
    mockUseReportFormChanged.mockReturnValue(false);
    mockSaveMutation.isPending = false;
    mockDuplicateMutation.isPending = false;
    mockHandleSave.mockClear();
    mockHandleDuplicate.mockClear();
  });

  test("when CAN edit, renders save button", () => {
    render(<SaveReport />);

    expect(screen.getByRole("button", { name: /save/i })).toBeInTheDocument();
  });

  test("when CAN edit AND form changed, save button is enabled", () => {
    mockUseReportFormChanged.mockReturnValue(true);

    render(<SaveReport />);

    expect(screen.getByRole("button", { name: /save/i })).toBeEnabled();
  });

  test("when CAN edit AND form NOT changed, save button is disabled", () => {
    mockUseReportFormChanged.mockReturnValue(false);

    render(<SaveReport />);

    expect(screen.getByRole("button", { name: /save/i })).toBeDisabled();
  });

  test("when CAN edit, clicking save calls handleSave", () => {
    mockUseReportFormChanged.mockReturnValue(true);

    render(<SaveReport />);

    const saveButton = screen.getByRole("button", { name: /save/i });
    fireEvent.click(saveButton);

    expect(mockHandleSave).toHaveBeenCalledTimes(1);
  });

  test("when CAN edit AND save pending, shows spinner", () => {
    mockSaveMutation.isPending = true;

    render(<SaveReport />);

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /save/i })).toBeDisabled();
  });

  test("when CANNOT edit, renders make-a-copy button", () => {
    mockUseCanEditReport.mockReturnValue(false);

    render(<SaveReport />);

    expect(screen.getByRole("button", { name: /make-a-copy/i })).toBeInTheDocument();
  });

  test("when CANNOT edit, clicking calls handleDuplicate", () => {
    mockUseCanEditReport.mockReturnValue(false);

    render(<SaveReport />);

    const copyButton = screen.getByRole("button", { name: /make-a-copy/i });
    fireEvent.click(copyButton);

    expect(mockHandleDuplicate).toHaveBeenCalledTimes(1);
  });

  test("when CANNOT edit AND duplicate pending, shows spinner and button disabled", () => {
    mockUseCanEditReport.mockReturnValue(false);
    mockDuplicateMutation.isPending = true;

    render(<SaveReport />);

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /make-a-copy/i })).toBeDisabled();
  });
});
