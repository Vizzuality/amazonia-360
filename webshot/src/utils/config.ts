import config from "config";
import { Value } from "./utils";

/**
 * Config class to get configuration values from the config package
 */
export class Config {
  /**
   * Get a configuration value
   *
   * @param key The configuration key
   * @param defaultValue The default value if the key is not found
   * @returns The configuration value or the default value if the key is not found
   *
   * @throws Error if the key is not found and no default value is provided
   */
  public static get<T>(key: string, defaultValue?: T): T {
    if (config.has(key)) {
      const value = config.get<T>(key);

      if (Value.isValid(value)) {
        return value;
      } else if (Value.isValid(defaultValue)) {
        return defaultValue;
      }
    } else if (Value.isValid(defaultValue)) {
      return defaultValue;
    }

    throw new Error(
      `Config key ${key} is not defined and no default value is provided`,
    );
  }

  /**
   * Get a string configuration value
   *
   * @param key The configuration key
   * @param defaultValue The default value if the key is not found
   * @returns The configuration value or the default value if the key is not found
   *
   * @throws Error if the key is not found and no default value is provided
   * @throws Error if the configuration value is not a string
   */
  public static getString(key: string, defaultValue?: string): string {
    if (config.has(key)) {
      const value = config.get<string>(key);

      if (typeof value === "string") {
        return value;
      }

      throw new Error(`Config key ${key} is not a string`);
    } else if (Value.isValid(defaultValue)) {
      return defaultValue;
    }

    throw new Error(
      `Config key ${key} is not defined and no default value is provided`,
    );
  }

  /**
   * Get a boolean configuration value
   *
   * @param key The configuration key
   * @param defaultValue The default value if the key is not found
   * @returns The configuration value or the default value if the key is not found
   *
   * @throws Error if the key is not found and no default value is provided
   * @throws Error if the configuration value is not a boolean
   */
  public static getBoolean(key: string, defaultValue?: boolean): boolean {
    if (config.has(key)) {
      const value = config.get<boolean>(key);

      if (typeof value === "boolean") {
        return value;
      }

      throw new Error(`Config key ${key} is not a boolean`);
    } else if (Value.isValid(defaultValue)) {
      return defaultValue;
    }

    throw new Error(
      `Config key ${key} is not defined and no default value is provided`,
    );
  }

  /**
   * Get a number configuration value
   *
   * @param key The configuration key
   * @param defaultValue The default value if the key is not found
   * @returns The configuration value or the default value if the key is not found
   *
   * @throws Error if the key is not found and no default value is provided
   * @throws Error if the configuration value is not a number
   */
  public static getNumber(key: string, defaultValue?: number): number {
    if (config.has(key)) {
      const value = config.get<number>(key);

      if (typeof value === "number") {
        return value;
      } else if (typeof Number(value) === "number" && !isNaN(Number(value))) {
        return Number(value);
      }

      throw new Error(`Config key ${key} is not a number`);
    } else if (Value.isValid(defaultValue)) {
      return defaultValue;
    }

    throw new Error(
      `Config key ${key} is not defined and no default value is provided`,
    );
  }

  /**
   * Retrieves a configuration value as either a string array or a single string.
   *
   * This method looks for a string value under the provided key and processes it as follows:
   * - If the value contains commas, it splits the string and returns the resulting array.
   * - If the value has no commas, it returns the single string value.
   *
   * @param {string} key - The configuration key to retrieve
   * @param {string[] | string} [defaultValue] - The default value to return if the key isn't found
   * @returns {string[] | string} An array of strings if commas are present, otherwise a single string
   *
   * @throws {Error} If the key doesn't exist and no default value is provided
   * @throws {Error} If the value exists but is not a string
   *
   * @example
   * // If config has "allowedOrigins=http://localhost:3000,https://example.com"
   * const origins = Config.getStringAsArray("allowedOrigins");
   * // returns ["http://localhost:3000", "https://example.com"]
   *
   * @example
   * // If config has "defaultLanguage=en"
   * const language = Config.getStringAsArray("defaultLanguage");
   * // returns "en"
   */
  public static getStringAsArray(
    key: string,
    defaultValue?: string[] | string,
  ): string[] | string {
    if (config.has(key)) {
      const value = config.get<string>(key);

      if (typeof value === "string") {
        const values = value.split(",");
        return values.length > 1 ? values : values[0];
      }

      throw new Error(`Config key ${key} is not a string`);
    } else if (Value.isValid(defaultValue)) {
      return defaultValue;
    }

    throw new Error(
      `Config key ${key} is not defined and no default value is provided`,
    );
  }

  /**
   * Retrieves and merges values from two config sources into a single array.
   *
   * This method looks for values in two places:
   * 1. An array stored under the provided `arrayKey`
   * 2. A comma-separated string stored under the provided `stringKey`
   *
   * It combines all values found in either source into a single array with duplicates removed.
   * If neither source contains values, returns the provided default value.
   *
   * @template T - The type of elements in the array
   * @param {string} arrayKey - The config key to look for an array of values
   * @param {string} stringKey - The config key to look for a comma-separated string of values
   * @param {T[]} [defaultValue=[]] - Default value to return if no values are found
   * @returns {T[]} An array containing all unique values from both sources, or the default value if no values were found
   *
   * @remarks
   * When retrieving values from the string source, each value is cast to type T using `as unknown as T`.
   * This may cause type safety issues if the string values can't be properly converted to type T.
   */
  public static getMergedArray<T>(
    arrayKey: string,
    stringKey: string,
    defaultValue: T[] = [],
  ): T[] {
    const values: Set<T> = new Set<T>();

    if (config.has(arrayKey)) {
      const value = config.get<T[]>(arrayKey);

      if (Array.isArray(value)) {
        value.forEach((value) => {
          values.add(value);
        });
      } else {
        console.warn(`Config ${arrayKey} is not an array`);
      }
    } else {
      console.warn(`Config ${arrayKey} does not exist`);
    }

    if (config.has(stringKey)) {
      const value = config.get<string>(stringKey);

      if (typeof value === "string") {
        value.split(",").forEach((value) => {
          values.add(value as unknown as T);
        });
      } else {
        console.warn(`Config ${stringKey} is not a string`);
      }
    } else {
      console.warn(`Config ${stringKey} does not exist`);
    }

    return values.size > 0 ? Array.from(values) : defaultValue;
  }
}
