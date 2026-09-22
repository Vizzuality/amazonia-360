import { describe, expect, it } from "vitest";

import { renderWithProviders } from "@integration/wrappers/render";

import CustomReport404 from "./not-found";

describe("CustomReport404", () => {
  it("renders the not-found messaging and a link back to reports", async () => {
    const { screen } = await renderWithProviders(<CustomReport404 />);

    await expect
      .element(screen.getByRole("heading", { name: "404 - REPORT NOT FOUND" }))
      .toBeVisible();
    await expect
      .element(
        screen.getByText(
          "The report you are looking for might have been removed, had its name changed or is temporarily unavailable.",
        ),
      )
      .toBeVisible();
    await expect
      .element(screen.getByRole("link", { name: "Go back to reports" }))
      .toHaveAttribute("href", "/en/reports");
    await expect(screen).toHaveNoA11yViolations();
  });
});
