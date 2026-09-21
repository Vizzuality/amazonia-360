import axe from "axe-core";
import { expect } from "vitest";

declare module "vitest" {
  interface Assertion<T> {
    toHaveNoA11yViolations(): Promise<T>;
  }
}

const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

function getViolationReport(violations: axe.Result[]): string {
  return violations
    .map((violation) =>
      [
        `[${violation.id}] ${violation.help}`,
        `  Impact: ${violation.impact}`,
        `  Targets: ${violation.nodes.map((node) => node.target).join(", ")}`,
        `  Summary: ${violation.description}`,
        `  Details: ${violation.nodes.map(({ failureSummary }) => failureSummary).join("\n")}`,
        `  Link: ${violation.helpUrl}`,
      ].join("\n"),
    )
    .join("\n\n");
}

expect.extend({
  async toHaveNoA11yViolations(target: { baseElement: HTMLElement }) {
    const { violations } = await axe.run(target.baseElement, {
      runOnly: { type: "tag", values: WCAG_TAGS },
    });

    if (violations.length === 0) {
      return { pass: true, message: () => "Expected accessibility violations but found none" };
    }

    return {
      pass: false,
      message: () =>
        `Expected no accessibility violations but found ${violations.length}:\n\n${getViolationReport(violations)}`,
    };
  },
});
