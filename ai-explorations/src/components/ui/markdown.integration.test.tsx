import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";

import { Markdown } from "./markdown";

const PAYLOAD =
  '**b**<img src="x" onerror="alert(1)"><script>alert(1)</script><a href="javascript:alert(1)">x</a>';

describe("Markdown", () => {
  it("renders markdown and strips script, event handlers and javascript: links from raw HTML", async () => {
    const screen = await render(<Markdown>{PAYLOAD}</Markdown>);
    const root = screen.container;

    await expect.element(screen.getByText("b")).toBeVisible();
    expect(root.querySelector("strong")).not.toBeNull();
    expect(root.querySelector("script")).toBeNull();
    expect(root.querySelector("[onerror]")).toBeNull();
    expect(root.querySelector('[href^="javascript:" i]')).toBeNull();
  });
});
