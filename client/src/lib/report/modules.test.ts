import type { Report } from "@/payload-types";

import { getReportModuleIds } from "./modules";

const populated = { id: "a" } as Extract<NonNullable<Report["modules"]>[number], object>;

describe("getReportModuleIds", () => {
  it("accepts ids and populated documents", () => {
    expect(getReportModuleIds(["a", populated])).toEqual(["a", "a"]);
  });

  it("returns an empty list for no modules", () => {
    expect(getReportModuleIds(null)).toEqual([]);
    expect(getReportModuleIds(undefined)).toEqual([]);
  });
});
