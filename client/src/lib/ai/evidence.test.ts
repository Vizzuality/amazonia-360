import { featureEvidence } from "./evidence";

describe("featureEvidence", () => {
  test("counts features and keeps nothing else when the query returns no values", () => {
    expect(
      featureEvidence([{ attributes: { OBJECTID: 1 } }, { attributes: { OBJECTID: 2 } }]),
    ).toEqual({ feature_count: 2 });
  });

  test("sums intersection areas and reports them as a share of the analysis area", () => {
    const evidence = featureEvidence([
      { attributes: { label: "Protected", value: 30, total: 200 } },
      { attributes: { label: "Protected", value: 10, total: 200 } },
      { attributes: { label: "Indigenous", value: 60, total: 200 } },
    ]);

    expect(evidence).toEqual({
      feature_count: 3,
      area_km2: 100,
      area_share: 50,
      classes: [
        { label: "Indigenous", feature_count: 1, area_km2: 60, percentage: 30 },
        { label: "Protected", feature_count: 2, area_km2: 40, percentage: 20 },
      ],
    });
  });

  test("names the features when the layer is a list of named things", () => {
    const evidence = featureEvidence([
      { attributes: { NAME: "Amazon Sustainable Landscapes", OBJECTID: 1 } },
      { attributes: { nombre: "Programa Bioeconomía", OBJECTID: 2 } },
    ]);

    expect(evidence).toEqual({
      feature_count: 2,
      classes: [
        { label: "Amazon Sustainable Landscapes", feature_count: 1 },
        { label: "Programa Bioeconomía", feature_count: 1 },
      ],
    });
  });

  test("prefers an explicit label over a name", () => {
    const evidence = featureEvidence([{ attributes: { NAME: "Ignored", label: "Wetlands" } }]);

    expect(evidence.classes).toEqual([{ label: "Wetlands", feature_count: 1 }]);
  });

  test("caps the class list and says so", () => {
    const evidence = featureEvidence(
      Array.from({ length: 20 }, (_, index) => ({
        attributes: { label: `Class ${index}`, value: index + 1, total: 1000 },
      })),
    );

    expect(evidence.classes).toHaveLength(15);
    expect(evidence.classes_truncated).toBe(true);
    // Ranked by area, so the largest class survives the cap.
    expect(evidence.classes?.[0]).toMatchObject({ label: "Class 19", area_km2: 20 });
  });
});
