import {
  findBrokenPopupTokens,
  findLiteralPopupTitles,
  findMissingEnglish,
  findNearDuplicateLegendLabels,
  findUntrimmedNames,
} from "./audit";

describe("findMissingEnglish", () => {
  test("flags records translated into another locale but not English", () => {
    expect(
      findMissingEnglish(
        [
          { id: 78, description_en: "", description_es: "Incendios", description_pt: "Incêndios" },
          { id: 79, description_en: "", description_es: "Biomasa", description_pt: "" },
          { id: 1, description_en: "Fires", description_es: "", description_pt: "" },
        ],
        "description",
      ),
    ).toEqual([78, 79]);
  });

  test("does not flag records empty in every locale", () => {
    expect(
      findMissingEnglish(
        [{ id: 5, description_en: "", description_es: "", description_pt: "" }],
        "description",
      ),
    ).toEqual([]);
  });

  test("treats whitespace-only English as missing", () => {
    expect(
      findMissingEnglish([{ id: 9, description_en: "   ", description_es: "algo" }], "description"),
    ).toEqual([9]);
  });
});

describe("findUntrimmedNames", () => {
  test("flags leading and trailing whitespace", () => {
    expect(
      findUntrimmedNames([
        { id: 3, name_en: "Land Cover\n\n", name_es: "", name_pt: "" },
        { id: 42, name_en: "Corn Production ", name_es: "", name_pt: "" },
        { id: 10, name_en: "ok", name_es: " Zonas", name_pt: "" },
      ]),
    ).toEqual([
      '3:name_en "Land Cover\\n\\n"',
      '42:name_en "Corn Production "',
      '10:name_es " Zonas"',
    ]);
  });

  test("ignores clean names and empty values", () => {
    expect(findUntrimmedNames([{ id: 1, name_en: "Fires", name_es: "", name_pt: "  " }])).toEqual(
      [],
    );
  });
});

describe("findBrokenPopupTokens", () => {
  test("flags a substitution token containing whitespace", () => {
    expect(
      findBrokenPopupTokens([
        { id: 18, resource: { popupTemplate: { title: "{ECOSYNAM }" } } },
        { id: 5, resource: { popupTemplate: { title: "{NOMBCAP}" } } },
      ]),
    ).toEqual(['indicator 18 popup title token "{ECOSYNAM }"']);
  });

  test("copes with indicators that have no popup", () => {
    expect(findBrokenPopupTokens([{ id: 1, resource: {} }, { id: 2 }])).toEqual([]);
  });
});

describe("findLiteralPopupTitles", () => {
  test("flags a hardcoded literal title", () => {
    expect(
      findLiteralPopupTitles([
        { id: 30, resource: { popupTemplate: { title: "Extensión Global de Manglares" } } },
        { id: 5, resource: { popupTemplate: { title: "{NOMBCAP}" } } },
      ]),
    ).toEqual(['indicator 30 popup title is literal text: "Extensión Global de Manglares"']);
  });
});

describe("findNearDuplicateLegendLabels", () => {
  test("flags labels differing only by a hyphen", () => {
    expect(
      findNearDuplicateLegendLabels([
        { id: 1, resource: { legend: { items: [{ label: "Medium High" }] } } },
        { id: 2, resource: { legend: { items: [{ label: "Medium-High" }] } } },
      ]),
    ).toEqual(['legend labels "Medium High" and "Medium-High"']);
  });

  test("does not flag genuinely different labels", () => {
    expect(
      findNearDuplicateLegendLabels([
        { id: 1, resource: { legend: { items: [{ label: "Low" }, { label: "High" }] } } },
      ]),
    ).toEqual([]);
  });
});
