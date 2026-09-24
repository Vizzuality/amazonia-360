import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

import CountryBadge from "./index";

const mockPathname = vi.fn<() => string>(() => "/ECU/reports");
const mockCountry = vi.fn<() => string | null>(() => "ECU");

vi.mock("@/i18n/use-country", () => ({
  useCountry: () => mockCountry(),
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams("bbox=1,2,3,4"),
}));

vi.mock("@/i18n/navigation", () => ({
  usePathname: () => mockPathname(),
  LocaleLink: ({
    href,
    children,
    ...props
  }: {
    href: { pathname: string; query: Record<string, string> };
    children: React.ReactNode;
  }) => (
    <a href={`${href.pathname}?${new URLSearchParams(href.query).toString()}`} {...props}>
      {children}
    </a>
  ),
}));

beforeEach(() => {
  mockPathname.mockReturnValue("/ECU/reports");
  mockCountry.mockReturnValue("ECU");
});

describe("CountryBadge", () => {
  test("names the active module and offers an exit", () => {
    render(<CountryBadge />);

    expect(screen.getByText("country-module-ECU-name")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "country-module-exit" })).toBeInTheDocument();
  });

  test("the exit drops the country segment and keeps the query", () => {
    render(<CountryBadge />);

    expect(screen.getByRole("link", { name: "country-module-exit" })).toHaveAttribute(
      "href",
      "/reports?bbox=1%2C2%2C3%2C4",
    );
  });

  test("tells the mobile menu to close itself when the exit is taken", async () => {
    const onExit = vi.fn();

    render(<CountryBadge onExit={onExit} />);
    await userEvent.click(screen.getByRole("link", { name: "country-module-exit" }));

    expect(onExit).toHaveBeenCalledTimes(1);
  });

  test("shows the active module's own flag", () => {
    render(<CountryBadge />);

    // Decorative: the badge already names the module in text, so the flag carries alt="".
    expect(screen.getByRole("presentation")).toHaveAttribute("src", expect.stringContaining("ECU"));
  });

  test("names the regional module and offers no exit when none is active", () => {
    mockCountry.mockReturnValue(null);
    mockPathname.mockReturnValue("/reports");

    render(<CountryBadge />);

    expect(screen.getByText("country-module-amazon-region-name")).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.queryByRole("presentation")).not.toBeInTheDocument();
  });

  test("renders nothing on an unscoped path", () => {
    mockPathname.mockReturnValue("/private/my-reports");
    mockCountry.mockReturnValue(null);

    const { container } = render(<CountryBadge />);

    expect(container).toBeEmptyDOMElement();
  });
});
