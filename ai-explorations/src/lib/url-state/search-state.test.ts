// @vitest-environment jsdom
import { payloadParseSearch, payloadStringifySearch } from "@payloadcms/tanstack-start/shared";

import { act, renderHook } from "@testing-library/react";
import { createSerializer, parseAsString } from "nuqs";
import { describe, expect, it, vi } from "vitest";

import { bboxParser, defaultTopicsConfigParser, TopicView } from "@/lib/url-state/parsers";
import {
  getParsedValue,
  getSerializedValue,
  getUrlStateSearch,
  useSearchState,
} from "@/lib/url-state/search-state";

type Search = Record<string, unknown>;

const navigateMock = vi.hoisted(() => vi.fn());

vi.mock("@tanstack/react-router", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@tanstack/react-router")>()),
  useNavigate: () => navigateMock,
  useSearch: ({ select }: { select: (search: Search) => unknown }) => select({}),
}));

const countryParser = parseAsString;

const BBOX = [-60.1, -10.2, -50.3, 0.4];
const TOPICS: TopicView[] = [
  {
    id: "1",
    topic_id: 1,
    description: "Forest cover, deforestation & fire: a 50% view",
    indicators: [{ id: "7", indicator_id: 7, type: "map", x: 0, y: 0, w: 2, h: 4, opacity: 0.5 }],
  },
];

// The client's nuqs Next adapter renders the address bar with the same `renderQueryString`.
const getClientUrl = createSerializer({
  bbox: bboxParser,
  defaultTopics: defaultTopicsConfigParser,
  country: countryParser,
});

describe("URL state search", () => {
  it("opens a client-made URL with the same state", () => {
    const clientUrl = getClientUrl({ bbox: BBOX, defaultTopics: TOPICS, country: "bolivia" });
    const search = getUrlStateSearch(payloadParseSearch(clientUrl));

    expect(getParsedValue(bboxParser, search.bbox)).toEqual(BBOX);
    expect(getParsedValue(defaultTopicsConfigParser, search.defaultTopics)).toEqual(TOPICS);
    expect(getParsedValue(countryParser, search.country)).toBe("bolivia");
  });

  it("writes a URL the client's parsers decode to the same state", () => {
    const url = payloadStringifySearch({
      bbox: getSerializedValue(bboxParser, BBOX),
      defaultTopics: getSerializedValue(defaultTopicsConfigParser, TOPICS),
      country: getSerializedValue(countryParser, "bolivia"),
    });
    const params = new URLSearchParams(url);

    expect(bboxParser.parse(params.get("bbox") ?? "")).toEqual(BBOX);
    expect(defaultTopicsConfigParser.parse(params.get("defaultTopics") ?? "")).toEqual(TOPICS);
    expect(params.get("country")).toBe("bolivia");
  });

  it("drops a value equal to its default, like nuqs clearOnDefault", () => {
    const defaultCopy = structuredClone(defaultTopicsConfigParser.defaultValue);

    expect(defaultCopy).not.toBe(defaultTopicsConfigParser.defaultValue);
    expect(getSerializedValue(defaultTopicsConfigParser, defaultCopy)).toBeUndefined();
    expect(getSerializedValue(bboxParser, null)).toBeUndefined();
  });

  it("reads the first of repeated keys and drops unparsable items, like nuqs", () => {
    const search = getUrlStateSearch(payloadParseSearch("?bbox=1,2,3,4&bbox=5,6,7,8"));

    expect(getParsedValue(bboxParser, search.bbox)).toEqual([1, 2, 3, 4]);
    expect(getParsedValue(defaultTopicsConfigParser, "{not json")).toEqual([]);
  });

  it("writes its own key and keeps the other search keys and the hash", async () => {
    const { result } = renderHook(() => useSearchState("country", countryParser));

    await act(() => result.current[1]("bolivia"));

    const [{ search, hash, replace }] = navigateMock.mock.calls[0];
    expect(search({ bbox: "1,2,3,4", tab: "map", country: "peru" })).toEqual({
      bbox: "1,2,3,4",
      tab: "map",
      country: "bolivia",
    });
    expect(hash).toBe(true);
    expect(replace).toBe(true);
  });
});
