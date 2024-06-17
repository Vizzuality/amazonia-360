import { formatNumber, formatPercentage, formatCurrency } from "@/lib/formats";

describe("formats", () => {
  test("formatNumber formats correctly", () => {
    expect(formatNumber(123456.789)).toBe("123,456.79");
    expect(formatNumber(0.005)).toBe("~0");
    expect(formatNumber(undefined)).toBe("");
  });

  test("formatNumber with options formats correctly", () => {
    expect(formatNumber(123456.789, { maximumFractionDigits: 0 })).toBe(
      "123,457",
    );
    expect(formatNumber(0.005, { maximumFractionDigits: 0 })).toBe("~0");
  });

  test("formatPercentage formats correctly", () => {
    expect(formatPercentage(0.123456)).toBe("12.35%");
    expect(formatPercentage(0.0005)).toBe("<1%");
    expect(formatPercentage(undefined)).toBe("");
  });

  test("formatPercentage with options formats correctly", () => {
    expect(formatPercentage(0.123456, { maximumFractionDigits: 0 })).toBe(
      "12%",
    );
    expect(formatPercentage(0.0005, { maximumFractionDigits: 0 })).toBe("<1%");
  });

  test("formatCurrency formats correctly", () => {
    expect(formatCurrency(123456.789)).toBe("$123,456.79");
    expect(formatCurrency(0.005)).toBe("~0");
    expect(formatCurrency(undefined)).toBe("");
  });

  test("formatCurrency with options formats correctly", () => {
    expect(formatCurrency(123456.789, { maximumFractionDigits: 0 })).toBe(
      "$123,457",
    );
    expect(formatCurrency(0.005, { maximumFractionDigits: 0 })).toBe("~0");
  });
});
