import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

import type { CountryModule } from "@/lib/country-modules";

import { ECU_MODULE, getPartnerFixture } from "@integration/fixtures/country-modules";

import CountryModuleDialog from "./dialog";

const mockPathname = vi.fn<() => string>(() => "/reports/grid");
const mockCountry = vi.fn<() => string | null>(() => "ECU");
const mockIndicators = vi.fn();
const mockModules = vi.fn<() => CountryModule[]>();
const mockCoverage = vi.fn<() => { status: string; ratio: number }>(() => ({
  status: "no-area",
  ratio: 0,
}));
const mockSetCookie = vi.fn();
const mockUseCookie = vi.fn<
  (key: string, initialValue?: string) => [string, typeof mockSetCookie, () => void]
>(() => ["", mockSetCookie, vi.fn()]);

const BOL_MODULE: CountryModule = { ...ECU_MODULE, id: "bol", slug: "BOL", country: "BOL" };
const ECU_PARTNER = getPartnerFixture({
  id: "partner-1",
  name: "Gobierno del Ecuador",
  label: "Gobierno",
  logo: "/partners/ecu/gobierno-del-ecuador.avif",
  moduleIds: [ECU_MODULE.id],
});

vi.mock("@/i18n/use-country", () => ({
  useCountry: () => mockCountry(),
}));

vi.mock("@/lib/country-modules", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/country-modules")>()),
  useGetCountryModules: () => mockModules(),
  useGetPartners: () => [ECU_PARTNER],
}));

vi.mock("@/i18n/navigation", () => ({
  usePathname: () => mockPathname(),
  LocaleLink: ({
    href,
    children,
    ...props
  }: {
    href: string | { pathname: string; query?: Record<string, string> };
    children: React.ReactNode;
  }) => {
    const search = typeof href === "string" ? "" : new URLSearchParams(href.query).toString();
    const path = typeof href === "string" ? href : href.pathname;
    return (
      <a href={search ? `${path}?${search}` : path} {...props}>
        {children}
      </a>
    );
  },
}));

vi.mock("./use-coverage", () => ({
  useCountryModuleCoverage: () => mockCoverage(),
}));

vi.mock("@/lib/indicators", () => ({
  useGetDefaultIndicators: (...args: unknown[]) => mockIndicators(...args),
}));

vi.mock("react-use-cookie", () => ({
  default: (key: string, initialValue?: string) => mockUseCookie(key, initialValue),
}));

beforeEach(() => {
  mockCoverage.mockReturnValue({ status: "no-area", ratio: 0 });
  mockPathname.mockReturnValue("/reports/grid");
  mockCountry.mockReturnValue("ECU");
  mockIndicators.mockReturnValue({ data: [] });
  mockModules.mockReturnValue([ECU_MODULE, BOL_MODULE]);
  mockUseCookie.mockReturnValue(["", mockSetCookie, vi.fn()]);
});

describe("CountryModuleDialog", () => {
  test("opens when the cookie is unset and a module is active", () => {
    render(<CountryModuleDialog />);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  test.each([
    ["pending", false],
    ["outside", false],
    ["inside", true],
    ["no-area", true],
  ])("with coverage %s the dialog open state is %s", (status, expected) => {
    mockCoverage.mockReturnValue({ status, ratio: 0 });

    render(<CountryModuleDialog />);

    expect(!!screen.queryByRole("dialog")).toBe(expected);
  });

  test("explains how to get started when no area is drawn", () => {
    mockCoverage.mockReturnValue({ status: "no-area", ratio: 0 });

    render(<CountryModuleDialog />);

    expect(screen.getByText("country-module-modal-body-no-area")).toBeInTheDocument();
    expect(screen.queryByText("country-module-modal-body")).not.toBeInTheDocument();
  });

  test("keeps the area-inside message when the area is within the module", () => {
    mockCoverage.mockReturnValue({ status: "inside", ratio: 0.4 });

    render(<CountryModuleDialog />);

    expect(screen.getByText("country-module-modal-body")).toBeInTheDocument();
    expect(screen.queryByText("country-module-modal-body-no-area")).not.toBeInTheDocument();
  });

  test("opens once a pending area resolves inside the module", () => {
    mockCoverage.mockReturnValue({ status: "pending", ratio: 0 });
    const { rerender } = render(<CountryModuleDialog />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    mockCoverage.mockReturnValue({ status: "inside", ratio: 0.4 });
    rerender(<CountryModuleDialog />);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  test("stays shut when the cookie is already set", () => {
    mockUseCookie.mockReturnValue(["true", mockSetCookie, vi.fn()]);

    render(<CountryModuleDialog />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  // Regression: the module is not a route segment, so this component never remounts on a
  // switch. A `rerender` — not a fresh `render` — is the only shape that reproduces it.
  test("re-opens when the module changes after an unticked dismissal", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<CountryModuleDialog />);

    await user.click(screen.getByRole("button", { name: "got-it-alert-button" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(mockSetCookie).not.toHaveBeenCalled();

    mockCountry.mockReturnValue(null);
    rerender(<CountryModuleDialog />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    mockCountry.mockReturnValue("ECU");
    rerender(<CountryModuleDialog />);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(mockSetCookie).not.toHaveBeenCalled();
  });

  test("stays shut when no module is active", () => {
    mockCountry.mockReturnValue(null);

    const { container } = render(<CountryModuleDialog />);

    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  test("stays shut on an unscoped path even with an active module", () => {
    mockPathname.mockReturnValue("/private/my-reports");

    render(<CountryModuleDialog />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  test("stays shut on a saved report page even with an active module", () => {
    mockPathname.mockReturnValue("/reports/abc");

    render(<CountryModuleDialog />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  test("keys the cookie by the active module slug", () => {
    render(<CountryModuleDialog />);

    expect(mockUseCookie).toHaveBeenCalledWith("country-module-dialog-ECU", undefined);
  });

  test("ticking the checkbox then Got it writes a slug-keyed cookie", async () => {
    render(<CountryModuleDialog />);

    await userEvent.click(screen.getByRole("checkbox"));
    await userEvent.click(screen.getByRole("button", { name: "got-it-alert-button" }));

    expect(mockSetCookie).toHaveBeenCalledWith("true");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  test("closing Got it without ticking the checkbox writes nothing", async () => {
    render(<CountryModuleDialog />);

    await userEvent.click(screen.getByRole("button", { name: "got-it-alert-button" }));

    expect(mockSetCookie).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  test("layer counts render from indicators data, not hardcoded", () => {
    mockIndicators.mockReturnValue({
      data: [
        { module: null },
        { module: null },
        { module: null },
        { module: { slug: "ECU" } },
        { module: { slug: "ECU" } },
      ],
    });

    render(<CountryModuleDialog />);

    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  test("shows skeletons instead of counts while indicators load", () => {
    mockIndicators.mockReturnValue({ data: undefined });

    const { container } = render(<CountryModuleDialog />);

    expect(container.ownerDocument.querySelectorAll('[aria-busy="true"]')).toHaveLength(2);
    expect(container.ownerDocument.querySelectorAll(".animate-pulse")).toHaveLength(2);
    expect(screen.queryByText("0")).not.toBeInTheDocument();
  });

  test("shows the numbers, no skeleton, once indicators load", () => {
    mockIndicators.mockReturnValue({ data: [{ module: { slug: "ECU" } }] });

    const { container } = render(<CountryModuleDialog />);

    expect(container.ownerDocument.querySelectorAll('[aria-busy="true"]')).toHaveLength(0);
    expect(container.ownerDocument.querySelectorAll(".animate-pulse")).toHaveLength(0);
    expect(screen.getByText("0")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  test("renders the collaborators heading for a module that has partner logos", () => {
    render(<CountryModuleDialog />);

    expect(screen.getByRole("heading", { level: 3 })).toBeInTheDocument();
  });

  test("derives the flag from the module country, not its slug", () => {
    mockCountry.mockReturnValue("bra-para");
    mockModules.mockReturnValue([{ ...ECU_MODULE, slug: "bra-para", country: "BRA" }]);

    render(<CountryModuleDialog />);

    expect(document.body.querySelector('img[src*="BRA.png"]')).not.toBeNull();
  });

  test("hides the collaborators heading for a module with no partner logos", () => {
    mockCountry.mockReturnValue("BOL");

    render(<CountryModuleDialog />);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { level: 3 })).not.toBeInTheDocument();
  });

  test("the Learn more link opens the partners page for the module in a new tab", () => {
    render(<CountryModuleDialog />);

    const link = screen.getByRole("link", { name: "country-module-partnerships-cta" });
    expect(link).toHaveAttribute("href", "/partners?country=ECU");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  test("the Learn more link falls back to the plain partners page for a module without partners", () => {
    mockCountry.mockReturnValue("BOL");

    render(<CountryModuleDialog />);

    expect(screen.getByRole("link", { name: "country-module-partnerships-cta" })).toHaveAttribute(
      "href",
      "/partners",
    );
  });
});
