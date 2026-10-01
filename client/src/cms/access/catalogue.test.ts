import { catalogueAccess } from "./catalogue";

const request = (user: { collection: string } | null, context: Record<string, unknown> = {}) =>
  ({ req: { user, context } }) as never;

const admin = { collection: "admins" };
const appUser = { collection: "users" };

describe("catalogueAccess.create", () => {
  test("lets an admin create while running a catalogue import", () => {
    expect(catalogueAccess.create(request(admin, { catalogueImport: true }))).toBe(true);
  });

  test("refuses an admin outside an import, which also hides Create New in the admin", () => {
    expect(catalogueAccess.create(request(admin))).toBe(false);
  });

  test("refuses anyone who is not an admin, import or not", () => {
    expect(catalogueAccess.create(request(appUser, { catalogueImport: true }))).toBe(false);
    expect(catalogueAccess.create(request(null, { catalogueImport: true }))).toBe(false);
  });
});

describe("catalogueAccess update and delete", () => {
  test("stay with admins, with no import required", () => {
    expect(catalogueAccess.update(request(admin))).toBe(true);
    expect(catalogueAccess.delete(request(admin))).toBe(true);
    expect(catalogueAccess.update(request(appUser))).toBe(false);
    expect(catalogueAccess.delete(request(null))).toBe(false);
  });
});
