import { render } from "@testing-library/react";
import { afterEach, vi } from "vitest";

vi.mock("./activation", () => ({ default: () => <div data-testid="activation" /> }));
vi.mock("./deactivation", () => ({ default: () => <div data-testid="deactivation" /> }));
vi.mock("./dialog", () => ({ default: () => <div data-testid="dialog" /> }));
vi.mock("./banner", () => ({ default: () => <div data-testid="banner" /> }));

import CountryModule from "./index";

afterEach(() => vi.unstubAllEnvs());

describe("CountryModule", () => {
  test("mounts nothing when the flag is off", () => {
    vi.stubEnv("NEXT_PUBLIC_FEATURE_FLAGS", "");

    const { container } = render(<CountryModule />);

    expect(container).toBeEmptyDOMElement();
  });
});
