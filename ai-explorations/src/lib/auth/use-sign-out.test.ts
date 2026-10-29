// @vitest-environment jsdom
import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { useSignOut } from "./use-sign-out";

// Locale prefixing is `createNavigation`'s job, so `getPathname` is stubbed and what is
// asserted here is the href handed to it.
const { signOutMock, countryMock, liveSlugsMock, getPathnameMock } = vi.hoisted(() => ({
  signOutMock: vi.fn(),
  countryMock: vi.fn<() => string | null>(),
  liveSlugsMock: vi.fn(() => ["ECU"]),
  getPathnameMock: vi.fn(({ href, locale }: { href: string; locale: string }) =>
    href === "/" ? `/${locale}` : `/${locale}${href}`,
  ),
}));

vi.mock("@/lib/auth/react", () => ({ signOut: signOutMock }));
vi.mock("@/i18n/use-country", () => ({ useCountry: countryMock }));
vi.mock("@/i18n/navigation-client", () => ({ getPathname: getPathnameMock }));
vi.mock("@/lib/country-modules", () => ({ useGetActiveModuleSlugs: liveSlugsMock }));

beforeEach(() => {
  vi.clearAllMocks();
  countryMock.mockReturnValue(null);
  liveSlugsMock.mockReturnValue(["ECU"]);
});

describe("useSignOut", () => {
  // `redirect: true` is the whole point: it leaves with a full page load rather than a soft
  // navigation, so no gated page rendered in this session stays in memory.
  test("signs out with a full page load", () => {
    const { result } = renderHook(() => useSignOut());

    result.current();

    expect(signOutMock).toHaveBeenCalledWith({ redirect: true, redirectTo: "/en" });
  });

  test("defaults to the home page and honours an explicit destination", () => {
    const { result } = renderHook(() => useSignOut());

    result.current();
    expect(getPathnameMock).toHaveBeenLastCalledWith({ href: "/", locale: "en" });

    result.current("/auth/sign-in");
    expect(getPathnameMock).toHaveBeenLastCalledWith({ href: "/auth/sign-in", locale: "en" });
    expect(signOutMock).toHaveBeenLastCalledWith({
      redirect: true,
      redirectTo: "/en/auth/sign-in",
    });
  });

  test("keeps a scoped destination inside the active country module", () => {
    countryMock.mockReturnValue("ECU");
    const { result } = renderHook(() => useSignOut());

    result.current("/reports");

    expect(getPathnameMock).toHaveBeenCalledWith({ href: "/ECU/reports", locale: "en" });
  });

  test("sends the user to the home page outside the country module", () => {
    countryMock.mockReturnValue("ECU");
    const { result } = renderHook(() => useSignOut());

    result.current();

    expect(getPathnameMock).toHaveBeenCalledWith({ href: "/", locale: "en" });
  });

  test("leaves the country off the paths that are never country-scoped", () => {
    countryMock.mockReturnValue("ECU");
    const { result } = renderHook(() => useSignOut());

    result.current("/auth/sign-in");

    expect(getPathnameMock).toHaveBeenCalledWith({ href: "/auth/sign-in", locale: "en" });
  });
});
