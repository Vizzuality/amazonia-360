export const formatNumber = (
  v?: number,
  options?: Intl.NumberFormatOptions,
) => {
  if (v === undefined) return "";

  const f = new Intl.NumberFormat("en-US", {
    style: "decimal",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    ...options,
  });

  if (v < 1) return "~0";

  return f.format(v);
};

export const formatPercentage = (
  v?: number,
  options?: Intl.NumberFormatOptions,
) => {
  if (v === undefined) return "";

  const f = Intl.NumberFormat("en-US", {
    style: "percent",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    ...options,
  });

  if (v < 0.01) return "<1%";

  return f.format(v);
};

export const formatCurrency = (
  v?: number,
  options?: Intl.NumberFormatOptions,
) => {
  if (v === undefined) return "";

  const f = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    ...options,
  });

  if (v < 1) return "~0";

  return f.format(v);
};
