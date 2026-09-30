import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";

import { renderWithProviders } from "@integration/wrappers/render";

import LanguageSelector from "./desktop";

describe("LanguageSelector", () => {
  it("renders without accessibility violations", async () => {
    const { screen } = await renderWithProviders(<LanguageSelector />, {
      pathname: "/en/reports/grid",
    });

    await expect(screen).toHaveNoA11yViolations();
  });

  it("shows the globe icon and the short locale label in the trigger", async () => {
    const { screen } = await renderWithProviders(<LanguageSelector />, {
      pathname: "/en/reports/grid",
    });

    const trigger = screen.getByRole("combobox").element();

    expect(trigger.textContent).toBe("EN");
    expect(trigger.querySelectorAll("svg")).toHaveLength(1);
  });

  it("pushes the current path under the picked locale, keeping search params", async () => {
    const { screen, router } = await renderWithProviders(<LanguageSelector />, {
      pathname: "/en/reports/grid",
      searchParams: new URLSearchParams("bbox=1,2,3,4"),
    });

    await userEvent.click(screen.getByRole("combobox"));
    await userEvent.click(screen.getByRole("option", { name: "ES - Español" }));

    expect(router.push).toHaveBeenCalledWith("/es/reports/grid?bbox=1%2C2%2C3%2C4");
  });
});
