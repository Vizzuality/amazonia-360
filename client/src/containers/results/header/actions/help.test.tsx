import { render, screen } from "@testing-library/react";
import { useLocale } from "next-intl";
import { vi } from "vitest";

import { DropdownMenuWrapper } from "@/containers/results/header/__tests__/helpers";

import { HelpAction } from "./help";

describe("HelpAction", () => {
  test("renders help menu item with icon and translated text", () => {
    render(
      <DropdownMenuWrapper>
        <HelpAction reportId="test-id" />
      </DropdownMenuWrapper>,
    );

    expect(screen.getByText("help")).toBeInTheDocument();
  });

  test("renders anchor with correct href for English locale", () => {
    render(
      <DropdownMenuWrapper>
        <HelpAction reportId="test-id" />
      </DropdownMenuWrapper>,
    );

    const menuItem = screen.getByRole("menuitem");
    expect(menuItem.tagName).toBe("A");
    expect(menuItem).toHaveAttribute(
      "href",
      "https://rise.articulate.com/share/DzHpFspTQWmMCeeoMXA2_6v5Zljl-b7i#/?locale=en-us",
    );
  });

  test("anchor opens in new tab with proper rel attributes", () => {
    render(
      <DropdownMenuWrapper>
        <HelpAction reportId="test-id" />
      </DropdownMenuWrapper>,
    );

    const menuItem = screen.getByRole("menuitem");
    expect(menuItem).toHaveAttribute("target", "_blank");
    expect(menuItem).toHaveAttribute("rel", "noreferrer noopener");
  });

  test("uses correct help link for Spanish locale", () => {
    vi.mocked(useLocale).mockReturnValue("es");

    render(
      <DropdownMenuWrapper>
        <HelpAction reportId="test-id" />
      </DropdownMenuWrapper>,
    );

    const menuItem = screen.getByRole("menuitem");
    expect(menuItem).toHaveAttribute(
      "href",
      "https://rise.articulate.com/share/DzHpFspTQWmMCeeoMXA2_6v5Zljl-b7i#/",
    );
  });

  test("uses correct help link for Portuguese locale", () => {
    vi.mocked(useLocale).mockReturnValue("pt");

    render(
      <DropdownMenuWrapper>
        <HelpAction reportId="test-id" />
      </DropdownMenuWrapper>,
    );

    const menuItem = screen.getByRole("menuitem");
    expect(menuItem).toHaveAttribute(
      "href",
      "https://rise.articulate.com/share/DzHpFspTQWmMCeeoMXA2_6v5Zljl-b7i#/?locale=pt-br",
    );
  });
});
