import { fireEvent, render, screen, within } from "@testing-library/react";
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

let pushState: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  mockPathname.mockReturnValue("/reports/grid");
  mockSearchParams.mockReturnValue(new URLSearchParams());
  mockCountry.mockReturnValue("~");

  // The switch reads the current URL to tell "somewhere else" from "where you already
  // are". Stubbed rather than spied through, so one test's push is not the next one's
  // starting point.
  window.history.replaceState(null, "", "/~/reports/grid");
  pushState = vi.spyOn(window.history, "pushState").mockImplementation(() => {});
});

afterEach(() => {
  pushState.mockRestore();
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

  test("choosing a module swaps the URL instead of following the link", async () => {
    await openPicker();

    const row = screen.getByRole("link", { name: /country-module-ECU-name/ });
    const followed = fireEvent.click(row);

    expect(followed).toBe(false);
    expect(pushState).toHaveBeenCalledWith(null, "", "/ECU/reports/grid");
  });

  test("choosing a module closes the picker", async () => {
    await openPicker();

    fireEvent.click(screen.getByRole("link", { name: /country-module-ECU-name/ }));

    expect(screen.queryByRole("navigation")).toBeNull();
  });

  test("the module you are already in adds no history entry", async () => {
    await openPicker();

    fireEvent.click(screen.getByRole("link", { name: /country-module-amazon-region-name/ }));

    expect(pushState).not.toHaveBeenCalled();
    expect(screen.queryByRole("navigation")).toBeNull();
  });

  test("a cmd/ctrl-click is left to the browser", async () => {
    await openPicker();

    const row = screen.getByRole("link", { name: /country-module-ECU-name/ });

    expect(fireEvent.click(row, { metaKey: true })).toBe(true);
    expect(fireEvent.click(row, { ctrlKey: true })).toBe(true);
    expect(pushState).not.toHaveBeenCalled();
  });

  test("the partnerships control does not navigate", async () => {
    await openPicker();

    expect(screen.queryByRole("link", { name: /country-module-partnerships-cta/ })).toBeNull();
    expect(screen.getByRole("button", { name: /country-module-partnerships-cta/ })).toBeDisabled();
  });
});

describe("MobileCountrySelector", () => {
  test("offers the same modules as links", () => {
    render(<MobileCountrySelector onSelected={vi.fn()} />);

    expect(
      screen.getByRole("link", { name: /country-module-amazon-region-name/ }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /country-module-ECU-name/ })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /country-module-SUR-name/ })).toBeNull();
  });

  test("switching keeps the path and every search param", () => {
    mockSearchParams.mockReturnValue(new URLSearchParams({ bbox: "1,2,3,4" }));
    render(<MobileCountrySelector onSelected={vi.fn()} />);

    expect(screen.getByRole("link", { name: /country-module-ECU-name/ })).toHaveAttribute(
      "href",
      "/ECU/reports/grid?bbox=1%2C2%2C3%2C4",
    );
    expect(screen.getByRole("link", { name: /country-module-amazon-region-name/ })).toHaveAttribute(
      "href",
      "/~/reports/grid?bbox=1%2C2%2C3%2C4",
    );
  });

  test("choosing a module swaps the URL and closes the menu", () => {
    const onSelected = vi.fn();
    render(<MobileCountrySelector onSelected={onSelected} />);

    const followed = fireEvent.click(screen.getByRole("link", { name: /country-module-ECU-name/ }));

    expect(followed).toBe(false);
    expect(pushState).toHaveBeenCalledWith(null, "", "/ECU/reports/grid");
    expect(onSelected).toHaveBeenCalled();
  });

  test("offers nothing on a route that carries no module", () => {
    mockPathname.mockReturnValue("/private/my-reports");
    const { container } = render(<MobileCountrySelector onSelected={vi.fn()} />);

    expect(container).toBeEmptyDOMElement();
  });
});
