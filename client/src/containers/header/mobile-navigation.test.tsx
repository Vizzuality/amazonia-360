import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import MobileNavigation from "./mobile-navigation";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/i18n/navigation", () => {
  const Anchor = ({ href, ...rest }: React.ComponentProps<"a">) => <a href={href} {...rest} />;
  return { Link: Anchor, LocaleLink: Anchor, usePathname: () => "/partners" };
});

vi.mock("@/containers/header/country-selector/mobile", () => ({ default: () => null }));
vi.mock("@/containers/header/language-selector/mobile", () => ({ default: () => null }));
vi.mock("./logo", () => ({ default: () => null }));

describe("MobileNavigation", () => {
  it("links to the partners page", async () => {
    render(<MobileNavigation />);
    await userEvent.click(screen.getByRole("button", { name: "header-menu-label" }));

    expect(await screen.findByRole("link", { name: "header-partners" })).toHaveAttribute(
      "href",
      "/partners",
    );
  });

  it("keeps the trigger fixed by default and in flow when inline", () => {
    const { rerender } = render(<MobileNavigation />);
    expect(screen.getByRole("button", { name: "header-menu-label" })).toHaveClass("fixed");

    rerender(<MobileNavigation inline />);
    expect(screen.getByRole("button", { name: "header-menu-label" })).not.toHaveClass("fixed");
  });
});
