import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

import { COUNTRIES } from "@/lib/country";

import CountrySelector from "./desktop";
import MobileCountrySelector from "./mobile";

const mockPathname = vi.fn<() => string>(() => "/reports/grid");
const mockSearchParams = vi.fn(() => new URLSearchParams());
const mockCountry = vi.fn(() => "~");

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
  Link: ({
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
  mockCountry.mockReturnValue("~");
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

  test("the trigger names the active country module", () => {
    mockCountry.mockReturnValue("ECU");
    render(<CountrySelector />);

    expect(screen.getByRole("button", { name: /country-module-ECU-name/ })).toBeInTheDocument();
  });

  test("lists the Amazon Region and every configured country", async () => {
    await openPicker();

    const list = within(screen.getByRole("navigation"));
    expect(list.getAllByText(/^country-module-(amazon-region|[A-Z]{3})-name$/)).toHaveLength(
      COUNTRIES.length + 1,
    );
  });

  test("marks the active row", async () => {
    mockCountry.mockReturnValue("ECU");
    await openPicker();

    expect(screen.getByRole("link", { current: "page" })).toHaveAccessibleName(
      /country-module-ECU-name/,
    );
  });

  test("a module that is not yet available is not a link", async () => {
    await openPicker();

    expect(screen.getByText("country-module-SUR-name")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /country-module-SUR-name/ })).toBeNull();
  });

  test("the partnerships control does not navigate", async () => {
    await openPicker();

    expect(screen.queryByRole("link", { name: /country-module-partnerships-cta/ })).toBeNull();
    expect(screen.getByRole("button", { name: /country-module-partnerships-cta/ })).toBeDisabled();
  });
});

describe("MobileCountrySelector", () => {
  test("offers the same modules as links", () => {
    render(<MobileCountrySelector />);

    expect(
      screen.getByRole("link", { name: /country-module-amazon-region-name/ }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /country-module-ECU-name/ })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /country-module-SUR-name/ })).toBeNull();
  });

  test("switching keeps the path and every search param", () => {
    mockSearchParams.mockReturnValue(new URLSearchParams({ bbox: "1,2,3,4" }));
    render(<MobileCountrySelector />);

    expect(screen.getByRole("link", { name: /country-module-ECU-name/ })).toHaveAttribute(
      "href",
      "/ECU/reports/grid?bbox=1%2C2%2C3%2C4",
    );
    expect(screen.getByRole("link", { name: /country-module-amazon-region-name/ })).toHaveAttribute(
      "href",
      "/~/reports/grid?bbox=1%2C2%2C3%2C4",
    );
  });

  test("offers nothing on a route that carries no module", () => {
    mockPathname.mockReturnValue("/private/my-reports");
    const { container } = render(<MobileCountrySelector />);

    expect(container).toBeEmptyDOMElement();
  });
});
