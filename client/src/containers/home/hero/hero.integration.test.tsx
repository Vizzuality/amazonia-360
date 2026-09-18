import { describe, expect, it } from "vitest";

import en from "@/i18n/translations/en.json";
import es from "@/i18n/translations/es.json";
import pt from "@/i18n/translations/pt.json";
import { renderWithProviders, type TestLocale } from "@integration/wrappers/render";

import Hero from "./index";

const MESSAGES: Record<TestLocale, Record<string, string>> = { en, es, pt };

describe("Hero", () => {
  it("renders without accessibility violations", async () => {
    const { screen } = await renderWithProviders(<Hero />);

    await expect(screen).toHaveNoA11yViolations();
  });

  for (const locale of ["en", "es", "pt"] as const) {
    it(`renders the localized content for ${locale}`, async () => {
      const messages = MESSAGES[locale];
      const { screen } = await renderWithProviders(<Hero />, { locale });

      await expect
        .element(screen.getByRole("heading", { level: 2 }))
        .toHaveTextContent(messages["landing-hero-title"]);
      await expect
        .element(screen.getByText(messages["landing-hero-buttons-access-the-tool"]))
        .toBeVisible();
    });
  }
});
