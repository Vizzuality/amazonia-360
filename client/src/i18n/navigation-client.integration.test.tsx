import { describe, expect, it } from "vitest";

import { renderWithProviders } from "@integration/wrappers/render";

import { Link } from "./navigation-client";

describe("Link", () => {
  it("points at the active country module straight away", async () => {
    const { screen } = await renderWithProviders(<Link href="/reports">Report tool</Link>, {
      pathname: "/en/ECU",
    });

    await expect
      .element(screen.getByRole("link", { name: "Report tool" }))
      .toHaveAttribute("href", "/en/ECU/reports");
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
