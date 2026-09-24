import { render, screen } from "@testing-library/react";

import { COUNTRIES } from "@/lib/country";

import en from "@/i18n/translations/en.json";
import es from "@/i18n/translations/es.json";
import pt from "@/i18n/translations/pt.json";

import { IndicatorScopeBadge } from "./scope-badge";

describe("IndicatorScopeBadge", () => {
  it("renders the regional badge when the indicator has no country", () => {
    render(<IndicatorScopeBadge country={null} />);

    expect(screen.getByText("country-module-badge-regional")).toBeInTheDocument();
  });

  it("renders the country badge for a scoped indicator", () => {
    render(<IndicatorScopeBadge country="ECU" />);

    expect(screen.getByText("country-module-ECU-badge")).toBeInTheDocument();
  });
});

describe("badge copy", () => {
  const LOCALES = { en, es, pt } as Record<string, Record<string, string>>;
  const KEYS = [
    "country-module-badge-regional",
    ...COUNTRIES.map((c) => `country-module-${c.code}-badge`),
  ];

  // The badge's fixed width is what aligns the names; this only keeps a two-letter
  // abbreviation from ever being added, which no width can rescue.
  it.each(Object.keys(LOCALES))("uses three letters in every %s badge that exists", (locale) => {
    const present = KEYS.filter((key) => key in LOCALES[locale]);

    expect(present).toContain("country-module-ECU-badge");
    present.forEach((key) => expect(LOCALES[locale][key]).toHaveLength(3));
  });
});
