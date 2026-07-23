import { fireEvent, render, screen } from "@testing-library/react";
import { useTranslations } from "next-intl";
import { vi } from "vitest";

import { DropdownMenuWrapper } from "@/containers/results/header/__tests__/helpers";

import type { Report } from "@/payload-types";

import { RenameAction } from "./rename";

const mockMutateAsync = vi.fn().mockResolvedValue(undefined);

vi.mock("@/lib/report", () => ({
  useSaveReport: vi.fn(() => ({
    mutateAsync: mockMutateAsync,
  })),
}));

function createMockReport(overrides: Partial<Report> = {}): Report {
  return {
    id: "report-1",
    title: "Test Report",
    description: "A test description",
    location: {
      type: "search",
      key: "123",
      text: "Amazon River",
      sourceIndex: 0,
    },
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2025-01-01T00:00:00.000Z",
    ...overrides,
  };
}

/**
 * Override the global next-intl mock so that `field-character-count` interpolates
 * its `current` and `max` params, allowing us to verify the rendered count text.
 * All other keys still return the key string.
 */
function mockTranslationsWithCharCount() {
  vi.mocked(useTranslations).mockReturnValue(((key: string, params?: Record<string, unknown>) => {
    if (key === "field-character-count" && params) {
      return `${params.current}/${params.max} characters`;
    }
    return key;
  }) as ReturnType<typeof useTranslations>);
}

function openRenameDialog() {
  const menuItem = screen.getByText("my-reports-action-rename").closest("[role='menuitem']");
  fireEvent.click(menuItem!);
}

describe("RenameAction — character count indicators", () => {
  beforeEach(() => {
    mockTranslationsWithCharCount();
  });

  describe("title field", () => {
    test("renders counter with initial character count from report title", () => {
      const report = createMockReport({ title: "Test Report" });

      render(
        <DropdownMenuWrapper>
          <RenameAction report={report} />
        </DropdownMenuWrapper>,
      );
      openRenameDialog();

      expect(screen.getByText("11/60 characters")).toBeInTheDocument();
    });

    test("renders 0/60 when title is empty", () => {
      const report = createMockReport({ title: "" });

      render(
        <DropdownMenuWrapper>
          <RenameAction report={report} />
        </DropdownMenuWrapper>,
      );
      openRenameDialog();

      expect(screen.getByText("0/60 characters")).toBeInTheDocument();
    });

    test("counter updates as the user types", () => {
      const report = createMockReport({ title: "" });

      render(
        <DropdownMenuWrapper>
          <RenameAction report={report} />
        </DropdownMenuWrapper>,
      );
      openRenameDialog();

      const titleInput = screen.getByRole("textbox", { name: "my-reports-rename-field-title" });
      fireEvent.change(titleInput, { target: { value: "Hello" } });

      expect(screen.getByText("5/60 characters")).toBeInTheDocument();
    });

    test("counter has the correct id for aria-describedby linkage", () => {
      const report = createMockReport({ title: "" });

      render(
        <DropdownMenuWrapper>
          <RenameAction report={report} />
        </DropdownMenuWrapper>,
      );
      openRenameDialog();

      const titleInput = screen.getByRole("textbox", { name: "my-reports-rename-field-title" });
      const counter = document.getElementById("title-character-count");

      expect(counter).toBeInTheDocument();
      expect(titleInput).toHaveAttribute("aria-describedby", "title-character-count");
    });

    test("counter does not have destructive class when below threshold", () => {
      const report = createMockReport({ title: "short" });

      render(
        <DropdownMenuWrapper>
          <RenameAction report={report} />
        </DropdownMenuWrapper>,
      );
      openRenameDialog();

      const counter = document.getElementById("title-character-count");
      expect(counter).not.toHaveClass("text-destructive");
    });

    test("counter has destructive class when at threshold (50 characters)", () => {
      const title50 = "a".repeat(50);
      const report = createMockReport({ title: title50 });

      render(
        <DropdownMenuWrapper>
          <RenameAction report={report} />
        </DropdownMenuWrapper>,
      );
      openRenameDialog();

      const counter = document.getElementById("title-character-count");
      expect(counter).toHaveClass("text-destructive");
    });

    test("counter has destructive class when above threshold (55 characters)", () => {
      const title55 = "a".repeat(55);
      const report = createMockReport({ title: title55 });

      render(
        <DropdownMenuWrapper>
          <RenameAction report={report} />
        </DropdownMenuWrapper>,
      );
      openRenameDialog();

      const counter = document.getElementById("title-character-count");
      expect(counter).toHaveClass("text-destructive");
    });
  });

  describe("description field", () => {
    test("renders counter with initial character count from report description", () => {
      const report = createMockReport({ description: "A test description" });

      render(
        <DropdownMenuWrapper>
          <RenameAction report={report} />
        </DropdownMenuWrapper>,
      );
      openRenameDialog();

      expect(screen.getByText("18/200 characters")).toBeInTheDocument();
    });

    test("renders 0/200 when description is empty", () => {
      const report = createMockReport({ description: "" });

      render(
        <DropdownMenuWrapper>
          <RenameAction report={report} />
        </DropdownMenuWrapper>,
      );
      openRenameDialog();

      expect(screen.getByText("0/200 characters")).toBeInTheDocument();
    });

    test("counter updates as the user types", () => {
      const report = createMockReport({ description: "" });

      render(
        <DropdownMenuWrapper>
          <RenameAction report={report} />
        </DropdownMenuWrapper>,
      );
      openRenameDialog();

      const descInput = screen.getByRole("textbox", {
        name: "my-reports-rename-field-description",
      });
      fireEvent.change(descInput, { target: { value: "New desc" } });

      expect(screen.getByText("8/200 characters")).toBeInTheDocument();
    });

    test("counter has the correct id for aria-describedby linkage", () => {
      const report = createMockReport({ description: "" });

      render(
        <DropdownMenuWrapper>
          <RenameAction report={report} />
        </DropdownMenuWrapper>,
      );
      openRenameDialog();

      const descInput = screen.getByRole("textbox", {
        name: "my-reports-rename-field-description",
      });
      const counter = document.getElementById("description-character-count");

      expect(counter).toBeInTheDocument();
      expect(descInput).toHaveAttribute("aria-describedby", "description-character-count");
    });

    test("counter does not have destructive class when below threshold", () => {
      const report = createMockReport({ description: "short" });

      render(
        <DropdownMenuWrapper>
          <RenameAction report={report} />
        </DropdownMenuWrapper>,
      );
      openRenameDialog();

      const counter = document.getElementById("description-character-count");
      expect(counter).not.toHaveClass("text-destructive");
    });

    test("counter has destructive class when at threshold (190 characters)", () => {
      const desc190 = "a".repeat(190);
      const report = createMockReport({ description: desc190 });

      render(
        <DropdownMenuWrapper>
          <RenameAction report={report} />
        </DropdownMenuWrapper>,
      );
      openRenameDialog();

      const counter = document.getElementById("description-character-count");
      expect(counter).toHaveClass("text-destructive");
    });

    test("counter has destructive class when above threshold (195 characters)", () => {
      const desc195 = "a".repeat(195);
      const report = createMockReport({ description: desc195 });

      render(
        <DropdownMenuWrapper>
          <RenameAction report={report} />
        </DropdownMenuWrapper>,
      );
      openRenameDialog();

      const counter = document.getElementById("description-character-count");
      expect(counter).toHaveClass("text-destructive");
    });
  });
});
