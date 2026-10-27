import type { CollectionBeforeChangeHook } from "payload";

import { describe, expect, it } from "vitest";

import { Reports } from "@/cms/collections/Reports";

import { beforeChangeLinkUser } from "./user";

type HookArgs = Parameters<CollectionBeforeChangeHook>[0];

function getLinkedData(user: unknown, data: Record<string, unknown>, operation = "create") {
  return beforeChangeLinkUser({ req: { user }, data, operation } as unknown as HookArgs);
}

const OTHER_OWNER = { relationTo: "users", value: "user-b" };

describe("beforeChangeLinkUser", () => {
  it("makes the signed-in user the owner even when the request names someone else", async () => {
    const data = await getLinkedData({ id: "user-a", collection: "users" }, { user: OTHER_OWNER });

    expect(data.user).toEqual({ relationTo: "users", value: "user-a" });
  });

  it("keeps the given owner for server-side calls without a user", async () => {
    const data = await getLinkedData(undefined, { user: OTHER_OWNER });

    expect(data.user).toEqual(OTHER_OWNER);
  });

  it("keeps the given owner when an admin creates the report", async () => {
    const data = await getLinkedData(
      { id: "admin-1", collection: "admins" },
      { user: OTHER_OWNER },
    );

    expect(data.user).toEqual(OTHER_OWNER);
  });

  it("leaves updates alone", async () => {
    const data = await getLinkedData(
      { id: "user-a", collection: "users" },
      { user: OTHER_OWNER },
      "update",
    );

    expect(data.user).toEqual(OTHER_OWNER);
  });
});

describe("Reports.user field", () => {
  const field = Reports.fields.find((f) => "name" in f && f.name === "user");
  const canUpdate = (field as { access?: { update?: (args: unknown) => boolean } }).access?.update;

  it.each([
    [{ id: "user-a", collection: "users" }, false],
    [{ id: "admin-1", collection: "admins" }, true],
    [null, false],
  ])("lets %j change the owner: %s", (user, expected) => {
    expect(canUpdate?.({ req: { user } })).toBe(expected);
  });
});
