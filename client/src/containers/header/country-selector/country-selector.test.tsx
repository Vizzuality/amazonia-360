import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

import CountrySelector from "./desktop";
import MobileCountrySelector from "./mobile";

const mockPathname = vi.fn<() => string>(() => "/reports/grid");
const mockSearchParams = vi.fn(() => new URLSearchParams());
const mockCountry = vi.fn<() => string | null>(() => null);

vi.mock("next/navigation", () => ({
  useSearchParams: () => mockSearchParams(),
}));

vi.mock("@/i18n/use-country", () => ({
  useCountry: () => mockCountry(),
}));

// A plain anchor stands in for next-intl's `Link` so the tests can read the href the
// picker builds. The locale prefix is next-intl's job and is asserted end to end.
vi.mock("@/i18n/navigation", () => ({
  usePathname: () => mockPathname(),
  LocaleLink: ({
    href,
    children,
    ...rest
  }: {
    href: { pathname: string; query: Record<string, string> };
    children?: React.ReactNode;
  }) => {
    const search = new URLSearchParams(href.query).toString();
    return (
      <a href={search ? `${href.pathname}?${search}` : href.pathname} {...rest}>
        {children}
      </a>
    );
  },
}));

beforeEach(() => {
  mockPathname.mockReturnValue("/reports/grid");
  mockSearchParams.mockReturnValue(new URLSearchParams());
  mockCountry.mockReturnValue(null);
});

/** Opens the popover, which renders its rows in a portal only once open. */
async function openPicker() {
  render(<CountrySelector />);
  await userEvent.click(screen.getByRole("button", { name: /country-module-selector-label/ }));
}

describe("CountrySelector (desktop)", () => {
  test("the trigger names the active module", () => {
    render(<CountrySelector />);

    expect(
      screen.getByRole("button", { name: /country-module-amazon-region-name/ }),
    ).toBeInTheDocument();
  });

  test("the trigger names the active country when one is selected", () => {
    mockCountry.mockReturnValue("ECU");
    mockPathname.mockReturnValue("/reports/grid");

    render(<CountrySelector />);

    expect(screen.getByRole("button", { name: /country-module-ECU-name/ })).toBeInTheDocument();
  });

  test("a live country links to the current path under its code", async () => {
    await openPicker();

    expect(screen.getByRole("link", { name: /country-module-ECU-name/ })).toHaveAttribute(
      "href",
      "/ECU/reports/grid",
    );
  });

  test("it carries the search params across verbatim", async () => {
    mockSearchParams.mockReturnValue(new URLSearchParams("bbox=1,2,3,4&ref=newsletter"));

    await openPicker();

    expect(screen.getByRole("link", { name: /country-module-ECU-name/ })).toHaveAttribute(
      "href",
      "/ECU/reports/grid?bbox=1%2C2%2C3%2C4&ref=newsletter",
    );
  });

  // The Amazon Region is the path with no code in it, so its row is the one href in the
  // app that must not be prefixed with the module you are currently in.
  test("the Amazon Region links back to the unprefixed path from inside a country", async () => {
    mockCountry.mockReturnValue("ECU");

    await openPicker();

    expect(screen.getByRole("link", { name: /country-module-amazon-region-name/ })).toHaveAttribute(
      "href",
      "/reports/grid",
    );
  });

  test("a country without data is shown but cannot be entered", async () => {
    await openPicker();

    expect(screen.queryByRole("link", { name: /country-module-SUR-name/ })).not.toBeInTheDocument();

    const row = screen.getByText("country-module-SUR-name").closest("div[aria-disabled]");
    expect(row).not.toBeNull();
    expect(within(row as HTMLElement).getByText("country-module-coming-soon")).toBeInTheDocument();
  });

  test("the active module is marked as the current page", async () => {
    mockCountry.mockReturnValue("ECU");

    await openPicker();

    expect(screen.getByRole("link", { name: /country-module-ECU-name/ })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  test("it is hidden on routes that carry no module", () => {
    mockPathname.mockReturnValue("/auth/sign-in");

    const { container } = render(<CountrySelector />);

    expect(container).toBeEmptyDOMElement();
  });
});

describe("MobileCountrySelector", () => {
  test("choosing a module closes the menu", async () => {
    const onSelected = vi.fn();
    render(<MobileCountrySelector onSelected={onSelected} />);

    await userEvent.click(screen.getByRole("link", { name: /country-module-ECU-name/ }));

    expect(onSelected).toHaveBeenCalled();
  });

  test("it is hidden on routes that carry no module", () => {
    mockPathname.mockReturnValue("/private/my-reports");

    const { container } = render(<MobileCountrySelector onSelected={vi.fn()} />);

    expect(container).toBeEmptyDOMElement();
  });
});
