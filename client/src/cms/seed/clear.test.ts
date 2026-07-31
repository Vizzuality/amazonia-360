import { clearContent } from "./clear";
import { createFakePayload } from "./test-support";

describe("clearContent", () => {
  test("empties every content collection", async () => {
    const { payload, preload, ids } = createFakePayload();
    preload("topics", [{ name: "Fires" }]);
    preload("subtopics", [{ name: "Hotspots" }]);
    preload("indicators", [{ name: "Fire count" }, { name: "Burn area" }]);

    await clearContent({ payload });

    expect(ids("topics")).toEqual([]);
    expect(ids("subtopics")).toEqual([]);
    expect(ids("indicators")).toEqual([]);
  });

  test("reports what it removed", async () => {
    const { payload, preload } = createFakePayload();
    preload("topics", [{ name: "Fires" }]);
    preload("indicators", [{ name: "Fire count" }, { name: "Burn area" }]);

    await expect(clearContent({ payload })).resolves.toEqual({
      topics: 1,
      subtopics: 0,
      indicators: 2,
    });
  });

  test("deletes children before parents", async () => {
    // The relationships are ON DELETE set null, so the other order would not
    // fail — it would leave surviving Indicators pointing at nothing, and a
    // mid-run failure would strand that in the database.
    const { payload, preload, calls } = createFakePayload();
    preload("topics", [{ name: "Fires" }]);
    preload("subtopics", [{ name: "Hotspots" }]);
    preload("indicators", [{ name: "Fire count" }]);

    await clearContent({ payload });

    expect(calls.filter((call) => call.op === "delete").map((call) => call.collection)).toEqual([
      "indicators",
      "subtopics",
      "topics",
    ]);
  });

  test("says what it cleared", async () => {
    const { payload, preload } = createFakePayload();
    preload("topics", [{ name: "Fires" }]);
    const logged: string[] = [];

    await clearContent({ payload, log: (message) => logged.push(message) });

    expect(logged.join("\n")).toContain("cleared: 1 topics, 0 subtopics, 0 indicators");
  });

  test("copes with an already empty database", async () => {
    const { payload } = createFakePayload();

    await expect(clearContent({ payload })).resolves.toEqual({
      topics: 0,
      subtopics: 0,
      indicators: 0,
    });
  });
});
