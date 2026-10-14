/**
 * @vitest-environment node
 */

import type { RelationshipField, SelectField } from "payload";

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

import { Partners } from "./Partners";

const noUser = { req: { user: null } } as never;
const admin = { req: { user: { collection: "admins", id: "admin-1" } } } as never;
const signedIn = { req: { user: { collection: "users", id: "user-1" } } } as never;

describe("Partners", () => {
  test("lets anyone read partners", () => {
    expect(Partners.access?.read?.(noUser)).toBe(true);
    expect(Partners.access?.read?.(signedIn)).toBe(true);
    expect(Partners.access?.read?.(admin)).toBe(true);
  });

  test.each(["create", "update", "delete"] as const)("%s is admin-only", (operation) => {
    expect(Partners.access?.[operation]?.(noUser)).toBe(false);
    expect(Partners.access?.[operation]?.(signedIn)).toBe(false);
    expect(Partners.access?.[operation]?.(admin)).toBe(true);
  });

  test("keeps name required and unlocalized", () => {
    expect(findFieldByName(Partners.fields, "name")).toMatchObject({
      type: "text",
      required: true,
    });
    expect(findFieldByName(Partners.fields, "name")?.localized).toBeFalsy();
  });

  test("offers an optional, unlocalized caption label right after name", () => {
    const label = findFieldByName(Partners.fields, "label");

    expect(label?.type).toBe("text");
    expect(label?.required).toBeFalsy();
    expect(label?.localized).toBeFalsy();

    const names = Partners.fields.map((field) => ("name" in field ? field.name : null));
    expect(names.indexOf("label")).toBe(names.indexOf("name") + 1);
  });

  test("keeps tag optional and unlocalized, capped at four characters", () => {
    const tag = findFieldByName(Partners.fields, "tag");

    expect(tag).toMatchObject({ type: "text", maxLength: 4 });
    expect(tag?.required).toBeFalsy();
    expect(tag?.localized).toBeFalsy();
  });

  test("localizes the logo path, so a partner can ship one logo per language", () => {
    expect(findFieldByName(Partners.fields, "logo")).toMatchObject({
      type: "text",
      required: true,
      localized: true,
    });
  });

  test("offers default and large logo sizes, defaulting to default", () => {
    const logoSize = findFieldByName(Partners.fields, "logoSize") as SelectField;

    expect(logoSize.defaultValue).toBe("default");
    expect(
      logoSize.options.map((option) => (typeof option === "string" ? option : option.value)),
    ).toEqual(["default", "large"]);
  });

  test("defaults regional to false", () => {
    expect(findFieldByName(Partners.fields, "regional")).toMatchObject({
      type: "checkbox",
      defaultValue: false,
    });
  });

  test("relates to many country modules", () => {
    const modules = findFieldByName(Partners.fields, "modules") as RelationshipField;

    expect(modules).toMatchObject({
      type: "relationship",
      relationTo: "country-modules",
      hasMany: true,
    });
    expect(modules.required).toBeFalsy();
  });

  test("requires order, defaulting to 0", () => {
    expect(findFieldByName(Partners.fields, "order")).toMatchObject({
      type: "number",
      required: true,
      defaultValue: 0,
    });
  });
});
