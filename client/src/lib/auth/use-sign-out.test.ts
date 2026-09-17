import { renderHook } from "@testing-library/react";

import { useSignOut } from "./use-sign-out";

// `@/i18n/navigation-client` is stubbed because importing it for real drags next-intl's
// `next/navigation` import into the module graph, which vitest cannot resolve. Locale
// prefixing is next-intl's job; what is asserted here is the href handed to it.
const { signOutMock, countryMock, getPathnameMock } = vi.hoisted(() => ({
  signOutMock: vi.fn(),
  countryMock: vi.fn<() => string | null>(),
  getPathnameMock: vi.fn(({ href, locale }: { href: string; locale: string }) =>
    href === "/" ? `/${locale}` : `/${locale}${href}`,
  ),
}));

vi.mock("next-auth/react", () => ({ signOut: signOutMock }));
vi.mock("@/i18n/use-country", () => ({ useCountry: countryMock }));
vi.mock("@/i18n/navigation-client", () => ({ getPathname: getPathnameMock }));

beforeEach(() => {
  vi.clearAllMocks();
  countryMock.mockReturnValue(null);
});

describe("useSignOut", () => {
  // `redirect: true` is the whole point: it is what makes next-auth leave with a full page
  // load rather than a soft navigation. See the hook for why that matters.
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

  test("keeps the destination inside the active country module", () => {
    countryMock.mockReturnValue("bo");
    const { result } = renderHook(() => useSignOut());

    result.current();

    expect(getPathnameMock).toHaveBeenCalledWith({ href: "/bo", locale: "en" });
  });

  test("leaves the country off the paths that are never country-scoped", () => {
    countryMock.mockReturnValue("bo");
    const { result } = renderHook(() => useSignOut());

    result.current("/auth/sign-in");

    expect(getPathnameMock).toHaveBeenCalledWith({ href: "/auth/sign-in", locale: "en" });
  });
});
