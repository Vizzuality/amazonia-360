export const useFormatNumber = (options?: Intl.NumberFormatOptions) => {
  return new Intl.NumberFormat("en-US", {
    style: "decimal",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    ...options,
  });
};

export const useFormatPercentage = (options?: Intl.NumberFormatOptions) => {
  return new Intl.NumberFormat("en-US", {
    style: "percent",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    ...options,
  });
};
