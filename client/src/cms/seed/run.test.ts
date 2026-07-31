import { runSeed } from "./run";
import { createFakePayload } from "./test-support";
import type { ContentDataset } from "./types";

const dataset = (): ContentDataset => ({
  topics: [
    {
      id: 0,
      _status: "published",
      name: { en: "Overview" },
      defaultLayout: [
        { indicatorId: 0, type: "map", x: 0, y: 0, w: 1, h: 1 },
        { indicatorId: 1, type: "chart", x: 1, y: 0, w: 1, h: 1 },
      ],
    },
    { id: 1, _status: "published", name: { en: "Fires" }, defaultLayout: [] },
  ],
  subtopics: [
    { id: 0, _status: "published", topic: 0, name: { en: "Land cover" }, defaultLayout: [] },
    { id: 1, _status: "published", topic: 1, name: { en: "Hotspots" }, defaultLayout: [] },
  ],
  indicators: [
    {
      id: 0,
      _status: "published",
      subtopic: 0,
      order: 1,
      name: { en: "Forest area" },
      visualizationTypes: ["map"],
      dataSource: { kind: "h3", name: "forest", column: "forest_ha" },
    },
    {
      id: 1,
      _status: "published",
      subtopic: 1,
      order: 1,
      name: { en: "Fire count" },
      visualizationTypes: ["chart"],
      dataSource: { kind: "h3", name: "fires", column: "fire_count" },
    },
  ],
});

describe("runSeed", () => {
  test("seeds an empty database and verifies the result", async () => {
    const { payload } = createFakePayload();

    const { report, problems } = await runSeed({ payload, dataset: dataset() });

    expect(report).toEqual({ topics: 2, subtopics: 2, indicators: 2, layoutsAttached: 1 });
    expect(problems).toEqual([]);
  });

  test("refuses a populated database without force", async () => {
    const { payload, preload } = createFakePayload();
    preload("topics", [{ id: 0 }]);

    await expect(runSeed({ payload, dataset: dataset() })).rejects.toThrow(/Refusing to seed/);
  });

  test("points at seed:force, not a flag that payload run would discard", async () => {
    // `payload run` strips every argument after the script path, so `pnpm seed
    // --force` reaches the script with an empty argv and would seed *without*
    // forcing. The override has to be its own script, and the message has to say
    // so — an earlier version told people to use a flag that could never arrive.
    const { payload, preload } = createFakePayload();
    preload("topics", [{ id: 0 }]);

    const message = await runSeed({ payload, dataset: dataset() }).then(
      () => "did not throw",
      (error: Error) => error.message,
    );

    expect(message).toContain("pnpm seed:force");
    // And explains why the obvious guess is not the answer.
    expect(message).toContain("discards arguments");
  });

  describe("force", () => {
    test("seeds over a populated database", async () => {
      const { payload, preload, read } = createFakePayload();
      preload("indicators", [{ id: 0, name: "Edited by hand", _status: "published" }]);

      const { report, problems } = await runSeed({ payload, dataset: dataset(), force: true });

      expect(report.indicators).toBe(2);
      expect(problems).toEqual([]);
      // The hand edit is gone — which is exactly why the guard exists.
      expect(read("indicators", 0).name).toBe("Forest area");
    });

    test("says what it overwrote", async () => {
      const { payload, preload } = createFakePayload();
      preload("topics", [{ id: 0 }]);
      const logged: string[] = [];

      await runSeed({
        payload,
        dataset: dataset(),
        force: true,
        log: (message) => logged.push(message),
      });

      expect(logged.join("\n")).toContain("force: overwriting 1 topics");
    });

    test("stays quiet about overwriting when the database was empty", async () => {
      const { payload } = createFakePayload();
      const logged: string[] = [];

      await runSeed({
        payload,
        dataset: dataset(),
        force: true,
        log: (message) => logged.push(message),
      });

      expect(logged.join("\n")).not.toContain("overwriting");
    });
  });

  test("returns problems rather than throwing when verification fails", async () => {
    // A bad seed must surface as a problem the caller can exit on, naming the
    // check that failed — not as an exception that buries it.
    const content = dataset();
    content.topics[0].defaultLayout.push({
      indicatorId: 404,
      type: "map",
      x: 0,
      y: 1,
      w: 1,
      h: 1,
    });
    const { payload } = createFakePayload();

    const { report, problems } = await runSeed({ payload, dataset: content });

    // The seed itself completed — it is verification that objects.
    expect(report.indicators).toBe(2);
    expect(problems).toContainEqual("layout of 0 -> missing indicator 404");
  });
});
