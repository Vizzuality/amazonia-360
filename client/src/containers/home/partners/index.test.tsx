import { render, screen } from "@testing-library/react";
import { vi } from "vitest";

import Partners from "./index";

vi.mock("next-intl", () => ({
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
  it("links See all partners to the partners page in the same tab", () => {
    render(<Partners />);

    const link = screen.getByTestId("landing-partners-see-all");
    expect(link).toHaveAttribute("href", "/partners");
    expect(link).not.toHaveAttribute("target");
    expect(link).toHaveTextContent("landing-partners-see-all");
  });

  it("does not offer a Become a partner action", () => {
    render(<Partners />);

    expect(screen.queryByText(/become a partner/i)).not.toBeInTheDocument();
  });
});
