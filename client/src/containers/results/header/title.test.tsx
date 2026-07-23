import { fireEvent, render, screen } from "@testing-library/react";
import { useTranslations } from "next-intl";
import { vi } from "vitest";

import TitleReport from "./title";

const mockSetTitle = vi.fn();
const mockTitle = vi.fn<() => string | null | undefined>().mockReturnValue("Default Title");

vi.mock("@/app/(frontend)/store", () => ({
  useFormTitle: vi.fn(() => ({
    title: mockTitle(),
    setTitle: mockSetTitle,
  })),
}));

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

function enterEditMode() {
  const editButton = screen.getByRole("button", { name: "edit" });
  fireEvent.click(editButton);
}

describe("TitleReport — character count indicators", () => {
  beforeEach(() => {
    mockTitle.mockReturnValue("Default Title");
    mockTranslationsWithCharCount();
  });

  test("counter is not visible in read mode", () => {
    render(<TitleReport />);

    expect(document.getElementById("title-character-count")).not.toBeInTheDocument();
  });

  test("renders counter with initial character count from title", () => {
    mockTitle.mockReturnValue("Default Title");

    render(<TitleReport />);
    enterEditMode();

    expect(screen.getByText("13/60 characters")).toBeInTheDocument();
  });

  test("renders 0/60 when title is empty", () => {
    mockTitle.mockReturnValue("");

    render(<TitleReport />);
    enterEditMode();

    expect(screen.getByText("0/60 characters")).toBeInTheDocument();
  });

  test("counter updates as the user types", () => {
    mockTitle.mockReturnValue("");

    render(<TitleReport />);
    enterEditMode();

    const titleInput = screen.getByRole("textbox");
    fireEvent.change(titleInput, { target: { value: "Hello" } });

    expect(screen.getByText("5/60 characters")).toBeInTheDocument();
  });

  test("counter has the correct id for aria-describedby linkage", () => {
    render(<TitleReport />);
    enterEditMode();

    const titleInput = screen.getByRole("textbox");
    const counter = document.getElementById("title-character-count");

    expect(counter).toBeInTheDocument();
    expect(titleInput).toHaveAttribute("aria-describedby", "title-character-count");
  });

  test("counter does not have destructive class when below threshold", () => {
    mockTitle.mockReturnValue("short");

    render(<TitleReport />);
    enterEditMode();

    const counter = document.getElementById("title-character-count");
    expect(counter).not.toHaveClass("text-destructive");
  });

  test("counter has destructive class when at threshold (50 characters)", () => {
    mockTitle.mockReturnValue("a".repeat(50));

    render(<TitleReport />);
    enterEditMode();

    const counter = document.getElementById("title-character-count");
    expect(counter).toHaveClass("text-destructive");
  });

  test("counter has destructive class when above threshold (55 characters)", () => {
    mockTitle.mockReturnValue("a".repeat(55));

    render(<TitleReport />);
    enterEditMode();

    const counter = document.getElementById("title-character-count");
    expect(counter).toHaveClass("text-destructive");
  });
});
