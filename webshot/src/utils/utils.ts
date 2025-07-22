/**
 * Namespace containing utility functions for value validation.
 */
export class Value {
  /**
   * Checks if a value is neither null nor undefined.
   *
   * @template T - The type of the value being checked
   * @param a - The value to check
   * @returns A type predicate indicating if the value is valid (not null or undefined)
   *
   * @example
   * ```typescript
   * const value: string | null = getSomeValue();
   * if (Value.isValid(value)) {
   *   // value is typed as string here
   *   console.log(value.length);
   * }
   * ```
   */
  static isValid = <T>(a: T | null | undefined): a is T => a !== undefined && a !== null;
}
