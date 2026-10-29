import {
  AdminUnit,
  belongsToAdminUnit,
  getAdminUnit,
  getAncestorAttributes,
  getCountryWhere,
  getHierarchyLayer,
  isAncestorLayer,
  normalizeName,
} from "./admin-hierarchy";

const BASE = "https://services6.arcgis.com/sROlVM0rATIYgC6a/arcgis/rest/services";
const COUNTRIES = getHierarchyLayer(
  `${BASE}/Political_administrative_division_of_order_0/FeatureServer`,
)!;
const STATES = getHierarchyLayer(
  `${BASE}/Political_administrative_division_of_order_1/FeatureServer`,
)!;
const MUNICIPALITIES = getHierarchyLayer(
  `${BASE}/Political_administrative_division_of_order_2/FeatureServer`,
)!;
const CAPITALS = getHierarchyLayer(
  `${BASE}/Administrative_capitals_at_admin_0_to_2_levels/FeatureServer`,
)!;

const PANDO: AdminUnit = { level: 1, gid0: "BOL", name1: "Pando" };
const FEDERICO_ROMAN: AdminUnit = {
  level: 2,
  gid0: "BOL",
  name1: "Pando",
  name2: "Federico Román",
};

describe("getAdminUnit", () => {
  it("reads a searched State from its attributes", () => {
    expect(
      getAdminUnit("state", { GID_0: "BOL", NAME_0: "Bolivia", NAME_1: "Pando", NAME_2: "x" }),
    ).toEqual(PANDO);
  });

  it("reads a searched Country and Municipality", () => {
    expect(getAdminUnit("country", { GID_0: "BRA", NAME_1: "Acre" })).toEqual({
      level: 0,
      gid0: "BRA",
    });
    expect(
      getAdminUnit("municipality", { GID_0: "BOL", NAME_1: "Pando", NAME_2: "Federico Román" }),
    ).toEqual(FEDERICO_ROMAN);
  });

  it.each(["capital", "city", "protected-area", "indigenous-territory", undefined] as const)(
    "is null for a %s location",
    (type) => {
      expect(getAdminUnit(type, { GID_0: "BOL", NAME_1: "Pando" })).toBeNull();
    },
  );

  it("is null when the attributes can't place the unit", () => {
    expect(getAdminUnit("state", null)).toBeNull();
    expect(getAdminUnit("state", { GID_0: "BOL" })).toBeNull();
    expect(getAdminUnit("municipality", { GID_0: "BOL", NAME_1: "Pando", NAME_2: " " })).toBeNull();
    expect(getAdminUnit("country", { GID_0: "" })).toBeNull();
  });
});

describe("getHierarchyLayer", () => {
  it("recognises the boundary and capitals services whatever the URL's casing", () => {
    expect(COUNTRIES).toEqual({ kind: "admin", level: 0, countryField: "GID_0" });
    expect(STATES).toEqual({ kind: "admin", level: 1, countryField: "GID_0" });
    expect(MUNICIPALITIES).toEqual({ kind: "admin", level: 2, countryField: "GID_0" });
    expect(CAPITALS).toEqual({ kind: "capital", countryField: "ISO" });
    expect(
      getHierarchyLayer(
        "https://services6.arcgis.com/x/ArcGIS/rest/services/Political_administrative_division_of_order_1/FeatureServer/4",
      ),
    ).toEqual(STATES);
  });

  it("leaves every other layer spatial", () => {
    expect(getHierarchyLayer(`${BASE}/Protected_areas/FeatureServer`)).toBeNull();
    expect(getHierarchyLayer(undefined)).toBeNull();
  });
});

describe("normalizeName", () => {
  it("ignores accents, case and stray spaces", () => {
    expect(normalizeName("  Federico   Román ")).toBe(normalizeName("federico roman"));
    expect(normalizeName("Nicolás Suárez")).toBe("nicolas suarez");
  });

  it("treats anything but a string as empty", () => {
    expect(normalizeName(null)).toBe("");
    expect(normalizeName(3)).toBe("");
  });
});

describe("belongsToAdminUnit", () => {
  it("keeps Pando's country and drops the neighbours its outline grazes", () => {
    expect(belongsToAdminUnit({ GID_0: "BOL" }, COUNTRIES, PANDO)).toBe(true);
    expect(belongsToAdminUnit({ GID_0: "BRA" }, COUNTRIES, PANDO)).toBe(false);
    expect(belongsToAdminUnit({ GID_0: "PER" }, COUNTRIES, PANDO)).toBe(false);
  });

  it("keeps Pando itself among the states, not La Paz or Acre", () => {
    expect(belongsToAdminUnit({ GID_0: "BOL", NAME_1: "Pando" }, STATES, PANDO)).toBe(true);
    expect(belongsToAdminUnit({ GID_0: "BOL", NAME_1: "La Paz" }, STATES, PANDO)).toBe(false);
    expect(belongsToAdminUnit({ GID_0: "BRA", NAME_1: "Acre" }, STATES, PANDO)).toBe(false);
  });

  it("keeps Pando's own municipalities", () => {
    const abuna = { GID_0: "BOL", NAME_1: "Pando", NAME_2: "Abuná" };
    const iturralde = { GID_0: "BOL", NAME_1: "La Paz", NAME_2: "Abel Iturralde" };

    expect(belongsToAdminUnit(abuna, MUNICIPALITIES, PANDO)).toBe(true);
    expect(belongsToAdminUnit(iturralde, MUNICIPALITIES, PANDO)).toBe(false);
  });

  it("keeps only the municipality itself when one is selected", () => {
    const self = { GID_0: "BOL", NAME_1: "Pando", NAME_2: "Federico Román" };
    const sibling = { GID_0: "BOL", NAME_1: "Pando", NAME_2: "Abuná" };

    expect(belongsToAdminUnit(self, MUNICIPALITIES, FEDERICO_ROMAN)).toBe(true);
    expect(belongsToAdminUnit(sibling, MUNICIPALITIES, FEDERICO_ROMAN)).toBe(false);
  });

  it("matches capitals by their own spelling of the names", () => {
    const capital = { ISO: "BOL", NAME_1: "Pando", NAME_2: "Federico Roman" };

    expect(belongsToAdminUnit(capital, CAPITALS, FEDERICO_ROMAN)).toBe(true);
    expect(belongsToAdminUnit(capital, CAPITALS, PANDO)).toBe(true);
    expect(belongsToAdminUnit({ ...capital, NAME_1: "Beni" }, CAPITALS, PANDO)).toBe(false);
  });

  it("drops a capital with no country code", () => {
    const capital = { ISO: " ", NAME_1: "Pando", NAME_2: "Federico Roman" };

    expect(belongsToAdminUnit(capital, CAPITALS, PANDO)).toBe(false);
  });
});

describe("isAncestorLayer", () => {
  it("is true for the unit's own level and the levels above it", () => {
    expect(isAncestorLayer(COUNTRIES, FEDERICO_ROMAN)).toBe(true);
    expect(isAncestorLayer(STATES, FEDERICO_ROMAN)).toBe(true);
    expect(isAncestorLayer(MUNICIPALITIES, FEDERICO_ROMAN)).toBe(true);
    expect(isAncestorLayer(MUNICIPALITIES, PANDO)).toBe(false);
  });

  it("is false for capitals, which are never an ancestor", () => {
    expect(isAncestorLayer(CAPITALS, FEDERICO_ROMAN)).toBe(false);
  });
});

describe("getAncestorAttributes", () => {
  it("names the missing ancestor down to the layer's level", () => {
    const unit: AdminUnit = { level: 2, gid0: "BRA", name1: "Bahia", name2: "Barreiras" };

    expect(getAncestorAttributes(COUNTRIES, unit)).toEqual({ GID_0: "BRA" });
    expect(getAncestorAttributes(STATES, unit)).toEqual({ GID_0: "BRA", NAME_1: "Bahia" });
  });
});

describe("getCountryWhere", () => {
  it("filters on the layer's own country field and escapes quotes", () => {
    expect(getCountryWhere(STATES, PANDO)).toBe("GID_0 = 'BOL'");
    expect(getCountryWhere(CAPITALS, { level: 0, gid0: "O'X" })).toBe("ISO = 'O''X'");
  });
});
