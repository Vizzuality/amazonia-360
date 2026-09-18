import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

import { COUNTRIES } from "@/constants/countries";

import { CountriesField } from "./countries-field";

const ORDERED_ISO3 = ["BOL", "BRA", "COL", "ECU", "GUF", "GUY", "PER", "PRY", "SUR", "VEN"];

describe("CountriesField", () => {
  it("renders exactly 10 chips, all unpressed when value is empty", () => {
    render(<CountriesField value={[]} onChange={vi.fn()} />);

    const chips = screen.getAllByRole("button");
    expect(chips).toHaveLength(10);
    chips.forEach((chip) => expect(chip).toHaveAttribute("aria-pressed", "false"));
  });

  it("renders chips in alphabetical order by label", () => {
    render(<CountriesField value={[]} onChange={vi.fn()} />);

    const labels = screen.getAllByRole("button").map((chip) => chip.textContent);
    expect(labels).toEqual(ORDERED_ISO3.map((iso3) => `country-module-${iso3}-name`));
  });

  it("calls onChange with the code added when an unselected chip is clicked", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<CountriesField value={[]} onChange={handleChange} />);

    await user.click(screen.getByRole("button", { name: "country-module-BRA-name" }));

    expect(handleChange).toHaveBeenCalledWith(["BRA"]);
  });

  it("calls onChange with the code removed, leaving the others, when a selected chip is clicked", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<CountriesField value={["BRA", "PER"]} onChange={handleChange} />);

    await user.click(screen.getByRole("button", { name: "country-module-BRA-name" }));

    expect(handleChange).toHaveBeenCalledWith(["PER"]);
  });

  it("marks exactly the chips present in value as pressed", () => {
    render(<CountriesField value={["BRA", "PER"]} onChange={vi.fn()} />);

    const pressed = screen
      .getAllByRole("button", { pressed: true })
      .map((chip) => chip.textContent);
    expect(pressed).toEqual(["country-module-BRA-name", "country-module-PER-name"]);
  });

  it("exposes the label as the group's accessible name and renders the description", () => {
    render(<CountriesField value={[]} onChange={vi.fn()} />);

    expect(screen.getByRole("group", { name: /auth-countries-label/ })).toBeInTheDocument();
    expect(screen.getByText("auth-countries-description")).toBeInTheDocument();
  });
});

describe("CountriesField country label keys", () => {
  const LOCALES = ["en", "es", "pt"] as const;

  it.each(LOCALES)("%s has a name key for every country in COUNTRIES", async (locale) => {
    const messages = (await import(`@/i18n/translations/${locale}.json`)).default as Record<
      string,
      string
    >;

    const missing = COUNTRIES.map(({ iso3 }) => `country-module-${iso3}-name`).filter(
      (key) => !messages[key],
    );

    expect(
      missing,
      `${locale}.json is missing chip labels: ${missing.join(", ")} — the chip would render the raw key`,
    ).toEqual([]);
  });
});
