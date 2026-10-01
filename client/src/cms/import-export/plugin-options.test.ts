import type { CollectionConfig } from "payload";

import { Indicators } from "@/cms/collections/Indicators";

import { isCatalogueImport } from "./catalogue-import";
import { importExportOptions } from "./plugin-options";
import { IMPORT_ROW_ERRORS } from "./prepare-import-rows";

const entry = (slug: string) =>
  importExportOptions.collections.find((collection) => collection.slug === slug);

describe("import-export plugin options", () => {
  test.each(["topics", "subtopics", "indicators"])(
    "%s imports and exports JSON only, inside the request",
    (slug) => {
      // The catalogue import marker lives on req.context; queued, the job would get a fresh
      // request and every catalogue row would be refused.
      expect(entry(slug)).toMatchObject({
        export: { format: "json", disableJobsQueue: true, disableSave: true },
        import: { disableJobsQueue: true },
      });
    },
  );

  test("users keep their CSV import and export", () => {
    expect(entry("users")?.export).not.toHaveProperty("format");
  });
});

const access = (user: { collection: string } | null) => ({ req: { user } }) as never;

describe.each([
  { name: "imports", override: () => importExportOptions.overrideImportCollection },
  { name: "exports", override: () => importExportOptions.overrideExportCollection },
])("the $name collection", ({ name, override }) => {
  const pluginAfterChange = vi.fn();
  const collection = async () =>
    (await override()({
      collection: {
        slug: name,
        fields: [],
        access: { update: () => false },
        hooks: { afterChange: [pluginAfterChange] },
      },
    })) as CollectionConfig;

  test("is for admins only: a signed-in app user cannot create, read or delete one", async () => {
    const { access: rules } = await collection();

    for (const operation of ["create", "read", "delete"] as const) {
      expect(rules?.[operation]?.(access({ collection: "admins" }))).toBe(true);
      expect(rules?.[operation]?.(access({ collection: "users" }))).toBe(false);
      expect(rules?.[operation]?.(access(null))).toBe(false);
    }
    expect(rules?.update?.(access({ collection: "admins" }))).toBe(false);
  });

  test("keeps the plugin's own hooks", async () => {
    expect((await collection()).hooks?.afterChange).toContain(pluginAfterChange);
  });
});

describe("an import being created", () => {
  const markRequest = async (collectionSlug: string) => {
    const imports = (await importExportOptions.overrideImportCollection({
      collection: { slug: "imports", fields: [] },
    })) as CollectionConfig;
    const req = { context: {} as Record<string, unknown> };

    for (const hook of imports.hooks?.beforeChange ?? []) {
      await hook({ data: { collectionSlug }, operation: "create", req } as never);
    }

    return isCatalogueImport(req as never);
  };

  test.each(["topics", "subtopics", "indicators"])(
    "into %s marks its request as a catalogue import, which is what lets the rows be created",
    async (slug) => {
      expect(await markRequest(slug)).toBe(true);
    },
  );

  test("into users leaves the request alone", async () => {
    expect(await markRequest("users")).toBe(false);
  });
});

describe("a catalogue import batch", () => {
  const STORED = {
    id: "7",
    _status: "published",
    name: { en: "Slope", es: "Pendiente", pt: "Declive" },
    description_short: { en: "Terrain steepness", es: "Inclinación", pt: "Inclinação" },
  };

  const before = (format: string, data: Record<string, unknown>[]) => {
    // Like the Local API, the fake writes the read's locale onto any request it is handed.
    const find = vi.fn(async (args: { locale: string; req?: { locale?: string } }) => {
      if (args.req) args.req.locale = args.locale;
      return { docs: [STORED] };
    });
    const req = {
      locale: "es",
      context: {},
      payload: {
        find,
        config: { localization: { localeCodes: ["en", "es", "pt"], defaultLocale: "en" } },
        collections: { indicators: { config: { fields: Indicators.fields } } },
      },
    };
    const importConfig = entry("indicators")?.import;
    const hook = importConfig && "hooks" in importConfig ? importConfig.hooks.before : undefined;
    if (!hook) throw new Error("indicators has no import before hook");

    return {
      find,
      req,
      run: () =>
        hook({ batchNumber: 1, totalBatches: 1, data, format, originalData: data, req } as never),
    };
  };

  test("refuses a CSV file outright, naming the format to use", async () => {
    await expect(before("csv", [{ id: "7" }]).run()).rejects.toThrow(
      "Catalogue imports take JSON only",
    );
  });

  test("checks each row against what the CMS already holds for its Content Code", async () => {
    const { find, run } = before("json", [
      { id: 7, _status: "published", name: { pt: "Inclinação do terreno" } },
    ]);

    const [row] = (await run()) as Record<string, unknown>[];

    expect(find).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "indicators",
        where: { id: { in: ["7"] } },
        locale: "all",
        draft: true,
      }),
    );
    // Stored Slope is complete in Portuguese, so the new name alone is enough.
    expect(row).toMatchObject({ id: "7", name: { en: undefined, pt: "Inclinação do terreno" } });
    expect(row).not.toHaveProperty(IMPORT_ROW_ERRORS);
  });

  test("leaves the import's locale alone, since the rows are written through the same request", async () => {
    const { req, run } = before("json", [{ id: "7", _status: "draft", order: 2 }]);

    await run();

    expect(req.locale).toBe("es");
  });
});
