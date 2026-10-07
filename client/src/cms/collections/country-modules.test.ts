/**
 * @vitest-environment node
 */

import type { GroupField, JoinField, RowField, SelectField, TextField } from "payload";

import { vi } from "vitest";

vi.mock("@/env.mjs", () => ({
  env: {
    NEXT_PUBLIC_WEBSHOT_URL: "http://localhost:3003",
    NEXT_PUBLIC_URL: "http://localhost:3000",
    NEXT_PUBLIC_API_URL: "http://localhost:8000",
    NEXT_PUBLIC_API_KEY: "test",
    NEXT_PUBLIC_ARCGIS_API_KEY: "test",
    BASIC_AUTH_ENABLED: "false",
    BASIC_AUTH_USER: "test",
    BASIC_AUTH_PASSWORD: "test",
    PAYLOAD_SECRET: "test",
    DATABASE_URL: "postgresql://test",
    AUTH_SECRET: "test",
    AWS_SES_IAM_USER_ACCESS_KEY_ID: "test",
    AWS_SES_IAM_USER_SECRET_ACCESS_KEY: "test",
    AWS_SES_REGION: "us-east-1",
  },
}));

vi.mock("@/cms/auth/authjs-strategy", () => ({
  createAuthjsStrategy: vi.fn(() => ({
    name: "authjs",
    authenticate: vi.fn(),
  })),
  logoutEndpoint: { path: "/logout", method: "post", handler: vi.fn() },
}));

import { findFieldByName } from "@/cms/test-utils/find-field";

import { CountryModules } from "./CountryModules";

const noUser = { req: { user: null } } as never;
const admin = { req: { user: { collection: "admins", id: "admin-1" } } } as never;
const signedIn = { req: { user: { collection: "users", id: "user-1" } } } as never;

const slugField = findFieldByName(CountryModules.fields, "slug") as TextField;

type ExistingModule = { id: string; slug: string };

function getSlugValidation(
  value: unknown,
  { existing = [], id }: { existing?: ExistingModule[]; id?: string } = {},
) {
  const find = vi.fn(async () => ({ docs: existing }));
  const options = {
    ...slugField,
    id,
    req: { payload: { config: {}, find }, t: (key: string) => key },
  };

  return slugField.validate?.(value as never, options as never);
}

function getDeleteGuard({ published = 0, drafts = 0 } = {}) {
  const count = vi.fn(async () => ({ totalDocs: published }));
  const countVersions = vi.fn(async () => ({ totalDocs: drafts }));
  const req = { payload: { count, countVersions } };
  const run = () => CountryModules.hooks?.beforeDelete?.[0]?.({ id: "module-1", req } as never);

  return { count, countVersions, req, run };
}

const BLOCKED_MESSAGE =
  "This module still has indicators. Deactivate it, or move its indicators to another module, before deleting it.";

describe("CountryModules", () => {
  test("deletes a module that no indicator references, counting inside the request", async () => {
    const { count, countVersions, req, run } = getDeleteGuard();

    await expect(run()).resolves.toBeUndefined();
    expect(count).toHaveBeenCalledWith({
      collection: "indicators",
      where: { module: { equals: "module-1" } },
      req,
    });
    expect(countVersions).toHaveBeenCalledWith({
      collection: "indicators",
      where: { and: [{ latest: { equals: true } }, { "version.module": { equals: "module-1" } }] },
      req,
    });
  });

  test.each([
    { case: "published indicators", counts: { published: 21 } },
    { case: "only draft versions", counts: { drafts: 2 } },
  ])("blocks deleting a module referenced by $case", async ({ counts }) => {
    const { run } = getDeleteGuard(counts);

    await expect(run()).rejects.toMatchObject({ status: 400, message: BLOCKED_MESSAGE });
  });

  test("lets anyone read only active modules, and admins read all of them", () => {
    expect(CountryModules.access?.read?.(noUser)).toEqual({ active: { equals: true } });
    expect(CountryModules.access?.read?.(signedIn)).toEqual({ active: { equals: true } });
    expect(CountryModules.access?.read?.(admin)).toBe(true);
  });

  test.each(["create", "update", "delete"] as const)("%s is admin-only", (operation) => {
    expect(CountryModules.access?.[operation]?.(noUser)).toBe(false);
    expect(CountryModules.access?.[operation]?.(signedIn)).toBe(false);
    expect(CountryModules.access?.[operation]?.(admin)).toBe(true);
  });

  test("makes slug unique", () => {
    expect(slugField.unique).toBe(true);
  });

  test.each(["ECU", "ecuador-amazonia", "BRA-2"])("accepts %s as a slug", async (value) => {
    await expect(getSlugValidation(value)).resolves.toBe(true);
  });

  test("rejects a slug another module uses in a different letter case", async () => {
    await expect(
      getSlugValidation("ecu", { existing: [{ id: "module-1", slug: "ECU" }] }),
    ).resolves.toBe('Another module already uses "ecu" (letter case is ignored).');
  });

  test("lets a module keep or recase its own slug on update", async () => {
    await expect(
      getSlugValidation("ecu", { existing: [{ id: "module-1", slug: "ECU" }], id: "module-1" }),
    ).resolves.toBe(true);
  });

  test("ignores like matches that only contain the slug", async () => {
    await expect(
      getSlugValidation("ECU", { existing: [{ id: "module-2", slug: "ECU-north" }] }),
    ).resolves.toBe(true);
  });

  test.each(["ECU/2", "ecu amazonia", "ecu_amazonia", "ecuador.", "Ecuadór"])(
    "rejects %s, which is not letters, numbers and hyphens",
    async (value) => {
      await expect(getSlugValidation(value)).resolves.toBe(
        "Use only letters, numbers and hyphens.",
      );
    },
  );

  test("still rejects an empty slug through Payload's required check", async () => {
    await expect(getSlugValidation("")).resolves.toBe("validation:required");
    await expect(getSlugValidation(undefined)).resolves.toBe("validation:required");
  });

  test.each(["en", "PT", "reports", "Partners", "AUTH", "admin", "V1", "local-api"])(
    "rejects the reserved slug %s regardless of case",
    async (value) => {
      await expect(getSlugValidation(value)).resolves.toBe(
        `"${value}" is a reserved path and cannot be used as a slug.`,
      );
    },
  );

  test("offers the eight Amazonian countries as country options", () => {
    const country = findFieldByName(CountryModules.fields, "country") as SelectField;

    expect(country.required).toBe(true);
    expect(
      country.options.map((option) => (typeof option === "string" ? option : option.value)),
    ).toEqual(["BRA", "COL", "PER", "VEN", "ECU", "BOL", "GUY", "SUR"]);
  });

  test("defaults active to false so a new module stays hidden", () => {
    expect(findFieldByName(CountryModules.fields, "active")).toMatchObject({
      type: "checkbox",
      defaultValue: false,
    });
  });

  test("localizes the copy, but not the slug, tag or country", () => {
    for (const name of ["name", "moduleName", "partnersDescription"]) {
      expect(findFieldByName(CountryModules.fields, name)?.localized, name).toBe(true);
    }

    for (const name of ["slug", "tag", "country"]) {
      expect(findFieldByName(CountryModules.fields, name)?.localized, name).toBeFalsy();
    }

    expect(findFieldByName(CountryModules.fields, "name")?.required).toBe(true);
    expect(findFieldByName(CountryModules.fields, "moduleName")?.required).toBe(true);
    expect(findFieldByName(CountryModules.fields, "partnersDescription")?.type).toBe("textarea");
  });

  test("caps tag at four characters", () => {
    expect(findFieldByName(CountryModules.fields, "tag")).toMatchObject({
      type: "text",
      required: true,
      maxLength: 4,
    });
  });

  test("stores bbox as four optional numbers", () => {
    const bbox = findFieldByName(CountryModules.fields, "bbox") as GroupField;
    const [row] = bbox.fields as RowField[];

    expect(bbox).toMatchObject({ type: "group" });
    expect(bbox.required).toBeFalsy();
    expect(row.fields).toMatchObject(
      ["xmin", "ymin", "xmax", "ymax"].map((name) => ({ name, type: "number" })),
    );
  });

  test("requires order, defaulting to 0", () => {
    expect(findFieldByName(CountryModules.fields, "order")).toMatchObject({
      type: "number",
      required: true,
      defaultValue: 0,
    });
  });

  test.each([
    { name: "partners", collection: "partners", on: "modules", defaultLimit: 100 },
    { name: "indicators", collection: "indicators", on: "module", defaultLimit: 500 },
  ])("joins $collection on $on, sorted by order", ({ name, collection, on, defaultLimit }) => {
    const join = findFieldByName(CountryModules.fields, name) as unknown as JoinField;

    expect(join).toMatchObject({ type: "join", collection, on, defaultLimit });
    expect(join.defaultSort).toBe("order");
  });
});
