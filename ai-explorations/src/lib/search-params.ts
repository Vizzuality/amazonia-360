export function getSingleValue(values: readonly string[]): string | undefined {
  return values.length === 1 ? values[0] : undefined;
}
