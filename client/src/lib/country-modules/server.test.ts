// @vitest-environment node

const { findMock } = vi.hoisted(() => ({ findMock: vi.fn() }));

vi.mock("server-only", () => ({}));
vi.mock("@/payload.config", () => ({ default: {} }));
vi.mock("payload", () => ({ getPayload: async () => ({ find: findMock }) }));

describe("getActiveModuleSlugs", () => {
  test("asks for the active modules' slugs only, in one flat unpaginated read", async () => {
    const { getActiveModuleSlugs } = await import("./server");
    findMock.mockResolvedValue({ docs: [{ id: "m1", slug: "ECU" }] });

    expect(await getActiveModuleSlugs()).toEqual(["ECU"]);
    expect(findMock).toHaveBeenCalledWith({
      collection: "country-modules",
      where: { active: { equals: true } },
      select: { slug: true },
      depth: 0,
      pagination: false,
    });
  });
});
