import { useEffect } from "react";

import { describe, expect, it } from "vitest";

import { renderWithProviders } from "@integration/wrappers/render";

import { Link, useLocaleRouter, usePathname, useRouter } from "./navigation-client";

describe("Link", () => {
  it("points at the active country module straight away", async () => {
    const { screen } = await renderWithProviders(<Link href="/reports">Report tool</Link>, {
      pathname: "/en/ECU",
    });

    await expect
      .element(screen.getByRole("link", { name: "Report tool" }))
      .toHaveAttribute("href", "/en/ECU/reports");
  });

  it("stops pointing at a module once it is deactivated", async () => {
    const { screen } = await renderWithProviders(<Link href="/reports">Report tool</Link>, {
      pathname: "/en/ECU",
      countryModules: [],
    });

    await expect
      .element(screen.getByRole("link", { name: "Report tool" }))
      .toHaveAttribute("href", "/en/reports");
  });

  it("leaves the path unprefixed for the Amazon Region", async () => {
    const { screen } = await renderWithProviders(<Link href="/reports">Report tool</Link>, {
      pathname: "/en",
    });

    await expect
      .element(screen.getByRole("link", { name: "Report tool" }))
      .toHaveAttribute("href", "/en/reports");
  });
});

function ReplaceWithLocaleRouter() {
  const router = useLocaleRouter();

  useEffect(() => {
    router.replace({ pathname: "/reports" });
  }, [router]);

  return null;
}

function ReplaceWithCountryRouter() {
  const router = useRouter();

  useEffect(() => {
    router.replace({ pathname: "/reports" });
  }, [router]);

  return null;
}

describe("useLocaleRouter", () => {
  it("navigates out of the active module", async () => {
    const { router } = await renderWithProviders(<ReplaceWithLocaleRouter />, {
      pathname: "/en/ECU/reports",
    });

    expect(router.replace).toHaveBeenCalledWith("/en/reports");
  });

  it("differs from useRouter, which stays inside the active module", async () => {
    const { router } = await renderWithProviders(<ReplaceWithCountryRouter />, {
      pathname: "/en/ECU/reports",
    });

    expect(router.replace).toHaveBeenCalledWith("/en/ECU/reports");
  });
});

function ShowPathname() {
  return <output>{usePathname()}</output>;
}

describe("usePathname", () => {
  it("hides the live module slug from the app", async () => {
    const { screen } = await renderWithProviders(<ShowPathname />, {
      pathname: "/en/ECU/reports",
    });

    await expect.element(screen.getByRole("status")).toHaveTextContent(/^\/reports$/);
  });
});
