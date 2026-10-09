import type { Partner } from "@/lib/country-modules";

import { getPartnerFixture } from "@integration/fixtures/country-modules";

import { getPartnerRows, getPartnersHref } from "./partners";

function getPartners(count: number): Partner[] {
  return Array.from({ length: count }, (_, index) =>
    getPartnerFixture({ id: `p${index}`, regional: true }),
  );
}

describe("getPartnersHref", () => {
  it("carries the module slug", () => {
    expect(getPartnersHref("ECU")).toEqual({
      pathname: "/partners",
      query: { country: "ECU" },
    });
  });

  it("omits the slug when there is none", () => {
    expect(getPartnersHref(null)).toEqual({ pathname: "/partners" });
  });
});

describe("getPartnerRows", () => {
  it("groups six partners into the 1-2-2-1 design rows", () => {
    const rows = getPartnerRows(getPartners(6));

    expect(rows.map((row) => row.map(({ id }) => id))).toEqual([
      ["p0"],
      ["p1", "p2"],
      ["p3", "p4"],
      ["p5"],
    ]);
  });

  it("repeats the pattern and leaves a short last row", () => {
    expect(getPartnerRows(getPartners(9)).map((row) => row.length)).toEqual([1, 2, 2, 1, 1, 2]);
    expect(getPartnerRows(getPartners(4)).map((row) => row.length)).toEqual([1, 2, 1]);
  });

  it("returns no rows without partners", () => {
    expect(getPartnerRows([])).toEqual([]);
  });
});
