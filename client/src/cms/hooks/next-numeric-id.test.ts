import type { CollectionBeforeValidateHook } from "payload";

import { assignNextNumericId } from "./next-numeric-id";

type HookArgs = Parameters<CollectionBeforeValidateHook>[0];

const run = ({
  data,
  operation = "create",
  highestId,
}: {
  data: Record<string, unknown> | undefined;
  operation?: "create" | "update";
  highestId?: number;
}) => {
  const find = vi.fn().mockResolvedValue({
    docs: highestId === undefined ? [] : [{ id: highestId }],
  });

  const hook = assignNextNumericId("topics");

  return {
    find,
    result: hook({
      data,
      operation,
      req: { payload: { find } },
    } as unknown as HookArgs),
  };
};

describe("assignNextNumericId", () => {
  test("assigns one past the highest existing id", async () => {
    const { result } = run({ data: { name: "New" }, highestId: 163 });

    await expect(result).resolves.toEqual({ name: "New", id: 164 });
  });

  test("starts at 0 on an empty collection", async () => {
    // Ids in this content start at 0 — Topic 0 is the overview Topic.
    const { result } = run({ data: { name: "First" } });

    await expect(result).resolves.toEqual({ name: "First", id: 0 });
  });

  test("respects an explicit id, which is how original ids are preserved", async () => {
    const { result } = run({ data: { id: 42, name: "Kept" }, highestId: 163 });

    await expect(result).resolves.toEqual({ id: 42, name: "Kept" });
  });

  test("keeps id 0 rather than treating it as missing", async () => {
    const { result } = run({ data: { id: 0, name: "Overview" }, highestId: 163 });

    await expect(result).resolves.toEqual({ id: 0, name: "Overview" });
  });

  test("does nothing on update", async () => {
    const { find, result } = run({ data: { name: "Edit" }, operation: "update", highestId: 163 });

    await expect(result).resolves.toEqual({ name: "Edit" });
    expect(find).not.toHaveBeenCalled();
  });

  test("counts drafts when finding the highest id", async () => {
    // A draft occupies its id in the main table. Ignoring drafts would let a
    // later create collide with one.
    const { find, result } = run({ data: { name: "New" }, highestId: 10 });
    await result;

    expect(find).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "topics",
        sort: "-id",
        limit: 1,
        overrideAccess: true,
        draft: true,
      }),
    );
  });
});
