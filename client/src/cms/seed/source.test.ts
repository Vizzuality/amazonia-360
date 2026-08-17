import { describe, expect, it } from "vitest";

import { isBlank, json, localized, LOCALES, text, TRANSLATION_LOCALES } from "./source";

describe("LOCALES and TRANSLATION_LOCALES", () => {
  it("keeps the exact locale order the seed write sequence depends on", () => {
    // TRANSLATION_LOCALES drives the create-then-update write order in scripts/seed-catalogue.ts
    // (en create, then es, then pt updates). A silent reorder here would invert that sequence
    // with no other test catching it.
    expect(LOCALES).toEqual(["en", "es", "pt"]);
    expect(TRANSLATION_LOCALES).toEqual(["es", "pt"]);
  });
});

describe("isBlank", () => {
  it("treats the source's placeholder blanks as absent", () => {
    expect(isBlank("")).toBe(true);
    expect(isBlank("   ")).toBe(true);
    expect(isBlank("\n\n")).toBe(true);
    expect(isBlank([])).toBe(true);
    expect(isBlank({})).toBe(true);
    expect(isBlank(null)).toBe(true);
    expect(isBlank(undefined)).toBe(true);
  });

  it("preserves falsy values that are real data", () => {
    expect(isBlank(0)).toBe(false);
    expect(isBlank(false)).toBe(false);
    expect(isBlank("0")).toBe(false);
    expect(isBlank([0])).toBe(false);
    expect(isBlank({ a: 1 })).toBe(false);
  });
});

describe("text", () => {
  it("returns undefined for blanks and trims everything else (fix 4)", () => {
    expect(text("")).toBeUndefined();
    expect(text("   ")).toBeUndefined();
    expect(text("Land Cover\n\n")).toBe("Land Cover");
    expect(text("Corn Production ")).toBe("Corn Production");
    expect(text(" Zonas de Influencia Costera")).toBe("Zonas de Influencia Costera");
    expect(text("\nInstalaciones de Generación Eléctrica")).toBe(
      "Instalaciones de Generación Eléctrica",
    );
  });
});

describe("json", () => {
  it("passes non-blank structures through untouched and drops blanks", () => {
    const query = { where: "1=1", outFields: ["*"] };
    expect(json(query)).toBe(query);
    expect(json("")).toBeUndefined();
    expect(json([])).toBeUndefined();
  });
});

describe("localized", () => {
  it("reads the locale-suffixed key and trims it", () => {
    const row = { name_en: "Health ", name_es: "Salud", name_pt: "" };
    expect(localized(row, "name", "en")).toBe("Health");
    expect(localized(row, "name", "es")).toBe("Salud");
    expect(localized(row, "name", "pt")).toBeUndefined();
  });
});
