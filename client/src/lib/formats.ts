export const formatNumber = (v?: number, options?: Intl.NumberFormatOptions) => {
  if (v === undefined) return "";

  const f = new Intl.NumberFormat("en-US", {
    style: "decimal",
    // For consistent formatting across all locales, it’s better to use a custom implementation
    notation: "compact",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    // https://www.raymondcamden.com/2023/01/04/using-intl-for-short-number-formatting
    maximumSignificantDigits: 3,
    ...options,
  });

  if (v < 0.01 && v > 0) return "~0";

  return f.format(v);
};

export const formatPercentage = (v?: number, options?: Intl.NumberFormatOptions) => {
  if (v === undefined) return "";

  const f = Intl.NumberFormat("en-US", {
    style: "percent",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    ...options,
  });

  if (v < 0.01 && v > 0) return "<1%";

  return f.format(v);
};

export const formatCurrency = (v?: number, options?: Intl.NumberFormatOptions) => {
  if (v === undefined) return "";

  const f = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    ...options,
  });

  if (v < 0.01 && v > 0) return "~0";

  return f.format(v);
};

export const formatNumberUnit = (v?: number | null, unit?: string) => {
  if (v === undefined || v === null) return "";

  const fv = formatNumber(v);

  if (fv && unit) {
    return `${fv} ${unit}`;
  }

  return fv;
};
