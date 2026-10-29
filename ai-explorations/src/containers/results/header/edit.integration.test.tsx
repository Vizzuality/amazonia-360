import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";

import { renderWithProviders } from "@integration/wrappers/render";

import EditReport from "./edit";

describe("EditReport", () => {
  it("toggles between Edit report and Close editing when clicked", async () => {
    const { screen } = await renderWithProviders(<EditReport />);

    const button = screen.getByRole("button", { name: "Edit report" });
    await expect.element(button).toBeVisible();
    await expect(screen).toHaveNoA11yViolations();

    await userEvent.click(button);

    await expect.element(screen.getByRole("button", { name: "Close editing" })).toBeVisible();

    await userEvent.click(screen.getByRole("button", { name: "Close editing" }));

    await expect.element(screen.getByRole("button", { name: "Edit report" })).toBeVisible();
  });
});
