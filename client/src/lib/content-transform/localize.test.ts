import { localizeConverted, localizeText, readLocaleTexts, seedEnglish } from "./localize";

describe("localizeText", () => {
  test("writes only locales that differ from English", () => {
    expect(
      localizeText({ name_en: "Fires", name_es: "Incendios", name_pt: "Fires" }, "name"),
    ).toEqual({ en: "Fires", es: "Incendios" });
  });

  test("omits empty translations", () => {
    expect(localizeText({ name_en: "ACU", name_es: "", name_pt: "" }, "name")).toEqual({
      en: "ACU",
    });
  });

  test("keeps a translation when English is empty", () => {
    // Indicators 78, 79 and 91 are in this state: translated text exists but
    // English does not, so English users see a blank and cannot fall back.
    expect(
      localizeText(
        { description_en: "", description_es: "Incendios", description_pt: "" },
        "description",
      ),
    ).toEqual({ en: "", es: "Incendios" });
  });

  test("returns undefined when nothing is set anywhere", () => {
    expect(localizeText({ unit_en: "", unit_es: "", unit_pt: "" }, "unit")).toBeUndefined();
    expect(localizeText({}, "unit")).toBeUndefined();
  });

  test("ignores non-string values", () => {
    expect(localizeText({ name_en: "x", name_es: 5, name_pt: null }, "name")).toEqual({ en: "x" });
  });
});

describe("readLocaleTexts", () => {
  test("reads all three locales, defaulting to empty string", () => {
    expect(readLocaleTexts({ description_en: "a", description_pt: "c" }, "description")).toEqual({
      en: "a",
      es: "",
      pt: "c",
    });
  });
});

describe("localizeConverted", () => {
  test("converts English plus only genuinely different locales", () => {
    const result = localizeConverted({
      sourceTexts: { en: "one", es: "uno", pt: "one" },
      convert: (text) => `<${text}>`,
    });

    expect(result).toEqual({ en: "<one>", es: "<uno>" });
  });

  test("returns undefined when every locale is empty", () => {
    expect(
      localizeConverted({ sourceTexts: { en: "", es: "", pt: "" }, convert: (t) => t }),
    ).toBeUndefined();
  });

  test("still converts English when it is empty but a translation exists", () => {
    expect(
      localizeConverted({ sourceTexts: { en: "", es: "hola", pt: "" }, convert: (t) => `[${t}]` }),
    ).toEqual({ en: "[]", es: "[hola]" });
  });

  test("passes the locale to the converter", () => {
    const seen: string[] = [];
    localizeConverted({
      sourceTexts: { en: "a", es: "b", pt: "c" },
      convert: (text, locale) => {
        seen.push(locale);
        return text;
      },
    });

    expect(seen).toEqual(["en", "es", "pt"]);
  });
});

describe("seedEnglish", () => {
  test("seeds a translatable label with English only", () => {
    expect(seedEnglish("Tree Cover")).toEqual({ en: "Tree Cover" });
  });
});
