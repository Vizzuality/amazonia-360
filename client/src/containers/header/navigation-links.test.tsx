import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import NavigationLinks from "./navigation-links";

const mockPathname = vi.fn<() => string>();

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/i18n/navigation", () => {
  const Anchor = ({ href, ...rest }: React.ComponentProps<"a">) => <a href={href} {...rest} />;
  return { Link: Anchor, LocaleLink: Anchor, usePathname: () => mockPathname() };
});

describe("NavigationLinks", () => {
  beforeEach(() => {
    mockPathname.mockReset();
  });

  it.each(["/", "/partners", "/reports/grid", "/private/profile"])(
    "renders both links with their hrefs on %s",
    (pathname) => {
      mockPathname.mockReturnValue(pathname);
      render(<NavigationLinks />);

      expect(screen.getByRole("link", { name: "header-report-tool" })).toHaveAttribute(
        "href",
        "/reports",
      );
      expect(screen.getByRole("link", { name: "header-partners" })).toHaveAttribute(
        "href",
        "/partners",
      );
    },
  );

  it("marks Our partners as the current page on the partners page", () => {
    mockPathname.mockReturnValue("/partners");
    render(<NavigationLinks />);

    expect(screen.getByRole("link", { name: "header-partners" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "header-report-tool" })).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("marks the report tool as the current page inside it", () => {
    mockPathname.mockReturnValue("/reports/grid");
    render(<NavigationLinks />);

    expect(screen.getByRole("link", { name: "header-report-tool" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "header-partners" })).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("marks neither link as current on the home page", () => {
    mockPathname.mockReturnValue("/");
    render(<NavigationLinks />);

    expect(screen.queryByRole("link", { current: "page" })).toBeNull();
  });
});
