import { mountMarkdownEditor, type RoundTrip } from "./round-trip.test-utils";

describe("MarkdownEditor", () => {
  let roundTrip: RoundTrip;

  beforeEach(async () => {
    roundTrip = await mountMarkdownEditor();
  });

  test("keeps hard line breaks", async () => {
    expect(await roundTrip("Line one\\\nLine two")).toEqual({ markdown: "Line one\\\nLine two" });
  });

  test("reads <https://…> autolinks as links rather than failing to parse", async () => {
    expect(await roundTrip("See <https://example.org>")).toEqual({
      markdown: "See [https://example.org](https://example.org)",
    });
  });

  test("leaves a bare URL as text, which is how the site renders it", async () => {
    expect(await roundTrip("See https://example.org")).toEqual({
      markdown: "See https://example.org",
    });
  });

  test("drops strikethrough, which the site would print as tildes", async () => {
    expect(await roundTrip("Some ~~struck~~ text")).toEqual({ markdown: "Some struck text" });
  });
});
