import { render, screen } from "@testing-library/react";
import { vi } from "vitest";

import PartnersHero from "./hero";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

describe("PartnersHero", () => {
  it("renders the title as the page heading", () => {
    render(<PartnersHero />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("partners-hero-title");
  });

  it("renders the description", () => {
    render(<PartnersHero />);

    expect(screen.getByText("partners-hero-description")).toBeInTheDocument();
  });
});
