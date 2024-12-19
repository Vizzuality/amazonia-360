import { shimmer, toBase64, PLACEHOLDER } from "./images";

describe("images", () => {
  test("shimmer generates correct SVG", () => {
    const svg = shimmer(100, 200);
    expect(svg).toContain('<svg width="100" height="200"');
    expect(svg).toContain('<rect width="100" height="200" fill="#004466" />');
    expect(svg).toContain('<rect id="r" width="100" height="600" fill="url(#g)" />');
  });

  test("toBase64 encodes correctly", () => {
    expect(toBase64("hello")).toBe("aGVsbG8=");
  });

  test("PLACEHOLDER generates correct data URL", () => {
    const placeholder = PLACEHOLDER(100, 200);
    expect(placeholder).toMatch(/^data:image\/svg\+xml;base64,/);
  });
});
