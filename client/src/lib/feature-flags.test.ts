import { afterEach, describe, expect, test, vi } from "vitest";

import { isFeatureEnabled, parseFeatureFlags } from "./feature-flags";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("parseFeatureFlags", () => {
  test("reads a single flag", () => {
    expect(parseFeatureFlags("country-module")).toEqual(["country-module"]);
  });

  test("reads a comma-separated list, ignoring surrounding space", () => {
    expect(parseFeatureFlags("country-module, another-one ,third")).toEqual([
      "country-module",
      "another-one",
      "third",
    ]);
  });

  test("drops empty entries left by stray commas", () => {
    expect(parseFeatureFlags(",country-module,,")).toEqual(["country-module"]);
  });

  test("unset, empty and blank all mean no flags", () => {
    expect(parseFeatureFlags(undefined)).toEqual([]);
    expect(parseFeatureFlags("")).toEqual([]);
    expect(parseFeatureFlags("  ,  ")).toEqual([]);
  });
});

describe("isFeatureEnabled", () => {
  test("is false when the variable is unset", () => {
    vi.stubEnv("NEXT_PUBLIC_FEATURE_FLAGS", "");

    expect(isFeatureEnabled("country-module")).toBe(false);
  });

  test("is true when the list names the flag", () => {
    vi.stubEnv("NEXT_PUBLIC_FEATURE_FLAGS", "country-module");

    expect(isFeatureEnabled("country-module")).toBe(true);
  });

  test("is true when the flag sits among others", () => {
    vi.stubEnv("NEXT_PUBLIC_FEATURE_FLAGS", "something-else, country-module");

    expect(isFeatureEnabled("country-module")).toBe(true);
  });

  // A flag is named in full or not at all: no substring or prefix should ever enable one.
  test("is false for a name that merely contains the flag", () => {
    vi.stubEnv("NEXT_PUBLIC_FEATURE_FLAGS", "country-module-v2");

    expect(isFeatureEnabled("country-module")).toBe(false);
  });
});
