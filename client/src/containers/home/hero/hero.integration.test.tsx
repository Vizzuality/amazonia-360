import { describe, expect, it } from "vitest";

import { renderWithProviders } from "@integration/wrappers/render";

import Hero from "./index";

describe("Hero", () => {
  it("renders without accessibility violations", async () => {
    const { screen } = await renderWithProviders(<Hero />);

    await expect(screen).toHaveNoA11yViolations();
  });
});
