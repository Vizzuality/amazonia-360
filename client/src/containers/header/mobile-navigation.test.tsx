import { render, screen } from "@testing-library/react";
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
    screen.getByRole("button", { name: "header-menu-label" }).click();

    expect(await screen.findByRole("link", { name: "header-partners" })).toHaveAttribute(
      "href",
      "/partners",
    );
  });
});
