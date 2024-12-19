import { cn, getKeys, joinWithAnd, convertHexToRgbaArray, getTextSize } from "./utils";

const mockWindow = jest.spyOn(global, "window", "get") as jest.SpyInstance<
  (Window & typeof globalThis) | undefined,
  [],
  unknown
>;
const mockWindowDocument = jest.spyOn(global.document, "createElement");

describe("utils", () => {
  test("cn merges class names correctly", () => {
    expect(cn("class1", "class2")).toBe("class1 class2");
    expect(cn("class1", undefined, "class2")).toBe("class1 class2");
  });

  test("getKeys gets keys of an object", () => {
    expect(getKeys({ a: 1, b: 2 })).toEqual(["a", "b"]);
  });

  test('joinWithAnd joins strings with "and"', () => {
    expect(joinWithAnd(["a", "b", "c"])).toBe("a, b and c");
    expect(joinWithAnd(["a", "b"])).toBe("a and b");
    expect(joinWithAnd(["a"])).toBe("a");
    expect(joinWithAnd([])).toBe("");
  });

  test("convertHexToRgbaArray converts hex color to RGBA array", () => {
    expect(convertHexToRgbaArray("#ff0000")).toEqual([255, 0, 0, 255]);
    expect(convertHexToRgbaArray("#00ff00", 0.5)).toEqual([0, 255, 0, 127.5]);
  });

  test("getTextSize gets text size", () => {
    mockWindowDocument.mockReturnValue({
      getContext: () => ({
        font: "",
        measureText: () => ({ width: 100 }),
      }),
      remove: jest.fn(),
    } as unknown as HTMLElement);

    const textSize = getTextSize({ text: "hello", maxWidth: 100 });
    expect(textSize.width).toBeGreaterThan(0);
    expect(textSize.height).toBeGreaterThan(0);
  });

  test("getTextSize returns 0 if window is undefined", () => {
    mockWindow.mockReturnValue(undefined);
    const textSize = getTextSize({ text: "hello", maxWidth: 100 });
    expect(textSize.width).toBe(0);
    expect(textSize.height).toBe(0);
  });
});
