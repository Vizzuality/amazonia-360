import { requiredInDefaultLocale } from "./validation";

type Validate = ReturnType<typeof requiredInDefaultLocale>;

const check = (validate: Validate, value: unknown, locale?: string) =>
  validate(value as never, { req: locale ? { locale } : {} } as never);

describe("requiredInDefaultLocale", () => {
  const validate = requiredInDefaultLocale("Name");

  test("requires a value in English", () => {
    expect(check(validate, "Fires", "en")).toBe(true);
    expect(check(validate, "", "en")).toBe("Name is required in en.");
    expect(check(validate, "   ", "en")).toBe("Name is required in en.");
    expect(check(validate, undefined, "en")).toBe("Name is required in en.");
  });

  test("allows a translation to be left unset", () => {
    // This is what keeps sparse translations sparse. With a plain `required`,
    // saving a record while Spanish is active is rejected outright (verified
    // against Payload 3.79), which pushes editors into copying English across.
    expect(check(validate, undefined, "es")).toBe(true);
    expect(check(validate, "", "pt")).toBe(true);
  });

  test("accepts a real translation", () => {
    expect(check(validate, "Incendios", "es")).toBe(true);
  });

  test("still requires a value when no locale is set on the request", () => {
    expect(check(validate, "", undefined)).toBe("Name is required in en.");
  });

  test("requires a value when reading or writing all locales at once", () => {
    expect(check(validate, "", "all")).toBe("Name is required in en.");
  });

  test("uses the label in the message", () => {
    expect(check(requiredInDefaultLocale("Title"), "", "en")).toBe("Title is required in en.");
  });
});
