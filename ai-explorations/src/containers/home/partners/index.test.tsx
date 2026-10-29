import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import Partners from "./index";

vi.mock("use-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("react-intersection-observer", () => ({
  useInView: () => ({ ref: vi.fn(), inView: true }),
}));

vi.mock("react-markdown", () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/i18n/navigation", () => ({
  LocaleLink: ({ children, ...props }: React.ComponentProps<"a">) => <a {...props}>{children}</a>,
}));

describe("Partners", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("links See all partners to the partners page in the same tab", () => {
    render(<Partners />);

    const link = screen.getByTestId("landing-partners-see-all");
    expect(link).toHaveAttribute("href", "/partners");
    expect(link).not.toHaveAttribute("target");
    expect(link).toHaveTextContent("landing-partners-see-all");
  });

  it("hides See all partners while the country-module flag is off", () => {
    vi.stubEnv("VITE_FEATURE_FLAGS", "");
    render(<Partners />);

    expect(screen.getByAltText("Esri")).toBeInTheDocument();
    expect(screen.queryByTestId("landing-partners-see-all")).not.toBeInTheDocument();
  });
});
