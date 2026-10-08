import type { Payload } from "payload";

import { seedPreviewUsers } from "./seed-preview-users";

type Call = {
  collection: string;
  id?: string;
  data: Record<string, unknown>;
  [key: string]: unknown;
};

const fakePayload = (existing: Record<string, string[]> = {}) => {
  const created: Call[] = [];
  const updated: Call[] = [];

  const payload = {
    find: async ({
      collection,
      where,
    }: {
      collection: string;
      where: { email: { equals: string } };
    }) => {
      const email = where.email.equals;
      return {
        docs: existing[collection]?.includes(email) ? [{ id: `${collection}:${email}` }] : [],
      };
    },
    create: async (args: Call) => {
      created.push(args);
      return args.data;
    },
    update: async (args: Call) => {
      updated.push(args);
      return {};
    },
  } as unknown as Payload;

  return { payload, created, updated };
};

const EMAILS = ["a@example.test", "b@example.test", "c@example.test"];

describe("seedPreviewUsers", () => {
  test("creates an admin and a verified user per email, without a verification email", async () => {
    const { payload, created } = fakePayload();

    await seedPreviewUsers(payload, EMAILS, "secret");

    expect(created.filter((call) => call.collection === "admins")).toHaveLength(3);
    const users = created.filter((call) => call.collection === "users");
    expect(users).toHaveLength(3);
    for (const user of users) {
      expect(user.data).toMatchObject({ password: "secret", _verified: true });
      expect(user.disableVerificationEmail).toBe(true);
    }
  });

  test("resets the password of a row that exists and does not create it again", async () => {
    const { payload, created, updated } = fakePayload({ admins: ["a@example.test"] });

    await seedPreviewUsers(payload, EMAILS, "new-secret");

    expect(updated).toEqual([
      expect.objectContaining({
        collection: "admins",
        id: "admins:a@example.test",
        data: { password: "new-secret" },
      }),
    ]);
    expect(created.filter((call) => call.collection === "admins")).toHaveLength(2);
  });

  test("verifies an existing user again when it resets the password", async () => {
    const { payload, updated } = fakePayload({ users: ["b@example.test"] });

    await seedPreviewUsers(payload, EMAILS, "secret");

    expect(updated).toEqual([
      expect.objectContaining({
        collection: "users",
        id: "users:b@example.test",
        data: { password: "secret", _verified: true },
      }),
    ]);
  });

  test("looks up emails in lower case", async () => {
    const { payload, created, updated } = fakePayload({ admins: ["a@example.test"] });

    await seedPreviewUsers(payload, ["A@Example.test"], "secret");

    expect(updated).toHaveLength(1);
    expect(created.filter((call) => call.collection === "admins")).toHaveLength(0);
  });
});
