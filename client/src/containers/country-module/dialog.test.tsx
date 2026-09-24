import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

import CountryModuleDialog from "./dialog";

const mockPathname = vi.fn<() => string>(() => "/reports/grid");
const mockCountry = vi.fn<() => string | null>(() => "ECU");
const mockIndicators = vi.fn();
const mockSetCookie = vi.fn();
const mockUseCookie = vi.fn<
  (key: string, initialValue?: string) => [string, typeof mockSetCookie, () => void]
>(() => ["", mockSetCookie, vi.fn()]);

vi.mock("@/i18n/use-country", () => ({
  useCountry: () => mockCountry(),
}));

vi.mock("@/i18n/navigation", () => ({
  usePathname: () => mockPathname(),
}));

vi.mock("@/lib/indicators", () => ({
  useGetDefaultIndicators: (...args: unknown[]) => mockIndicators(...args),
}));

vi.mock("react-use-cookie", () => ({
  default: (key: string, initialValue?: string) => mockUseCookie(key, initialValue),
}));

beforeEach(() => {
  mockPathname.mockReturnValue("/reports/grid");
  mockCountry.mockReturnValue("ECU");
  mockIndicators.mockReturnValue({ data: [] });
  mockUseCookie.mockReturnValue(["", mockSetCookie, vi.fn()]);
});

describe("CountryModuleDialog", () => {
  test("opens when the cookie is unset and a module is active", () => {
    render(<CountryModuleDialog />);

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

  test("keys the cookie by the active country code", () => {
    render(<CountryModuleDialog />);

    expect(mockUseCookie).toHaveBeenCalledWith("country-module-dialog-ECU", undefined);
  });

  test("ticking the checkbox then Got it writes a country-keyed cookie", async () => {
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
        { country: undefined },
        { country: undefined },
        { country: undefined },
        { country: "ECU" },
        { country: "ECU" },
      ],
    });

    render(<CountryModuleDialog />);

    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  test("renders the collaborators heading for a module that has partner logos", () => {
    render(<CountryModuleDialog />);

    expect(screen.getByRole("heading", { level: 3 })).toBeInTheDocument();
  });

  test("hides the collaborators heading for a module with no partner logos", () => {
    mockCountry.mockReturnValue("BOL");

    render(<CountryModuleDialog />);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { level: 3 })).not.toBeInTheDocument();
  });

  test("the Learn more button is disabled", () => {
    render(<CountryModuleDialog />);

    expect(screen.getByRole("button", { name: "country-module-partnerships-cta" })).toBeDisabled();
  });
});
