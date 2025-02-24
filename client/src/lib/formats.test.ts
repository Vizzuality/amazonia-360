import { formatNumber, formatPercentage, formatCurrency, formatNumberUnit } from "@/lib/formats";

describe("formats", () => {
  test("formatNumber formats correctly", () => {
    expect(formatNumber(123456.789)).toBe("123K");
    expect(formatNumber(0.005)).toBe("~0");
    expect(formatNumber(undefined)).toBe("");
  });

  test("formatNumber with options formats correctly", () => {
    expect(formatNumber(123456.789, { maximumFractionDigits: 0 })).toBe("123K");
    expect(formatNumber(0.005, { maximumFractionDigits: 0 })).toBe("~0");
  });

  test("formatPercentage formats correctly", () => {
    expect(formatPercentage(0.123456)).toBe("12.35%");
    expect(formatPercentage(0.0005)).toBe("<1%");
    expect(formatPercentage(undefined)).toBe("");
  });

  test("formatPercentage with options formats correctly", () => {
    expect(formatPercentage(0.123456, { maximumFractionDigits: 0 })).toBe("12%");
    expect(formatPercentage(0.0005, { maximumFractionDigits: 0 })).toBe("<1%");
  });

  test("formatCurrency formats correctly", () => {
    expect(formatCurrency(123456.789)).toBe("$123,456.79");
    expect(formatCurrency(0.005)).toBe("~0");
    expect(formatCurrency(undefined)).toBe("");
  });

  test("formatCurrency with options formats correctly", () => {
    expect(formatCurrency(123456.789, { maximumFractionDigits: 0 })).toBe("$123,457");
    expect(formatCurrency(0.005, { maximumFractionDigits: 0 })).toBe("~0");
  });

  test("formatNumberUnit formats correctly", () => {
    expect(formatNumberUnit(123456.789, "unit")).toBe("123K unit");
    expect(formatNumberUnit(1111111111111111, "unit")).toBe("1110T unit");
    expect(formatNumberUnit(1234567891011121, "unit")).toBe("1230T unit");
    expect(formatNumberUnit(0.005, "unit")).toBe("~0 unit");
    expect(formatNumberUnit(undefined, "unit")).toBe("");
  });

  test("formatNumberDigits max significant 3 after formatting and rounded", () => {
    expect(formatNumberUnit(9123456, "unit")).toBe("9.12M unit");
  });
});
