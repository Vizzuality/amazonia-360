const API_BASE = "/v1/api";

export type ContentCollection = "topics" | "subtopics" | "indicators";

type PaginatedResponse<T> = {
  docs: T[];
  totalDocs?: number;
  hasNextPage?: boolean;
};

/**
 * What the catalogue held when it moved into the CMS. Editors may add rows, so this is a
 * floor rather than an equality — but it must stay a written-down number: `totalDocs` is
 * counted *after* access control filters drafts out, so an unpublished Indicator would
 * report 163 of 163 and pass a self-referential check without a murmur.
 */
export const MINIMUM_RECORDS: Record<ContentCollection, number> = {
  topics: 9,
  subtopics: 28,
  indicators: 164,
};

/**
 * Subtopics and Topics are read flat: at depth 0 their one relationship comes back as the
 * id the app wants anyway. Indicators need depth 2 to reach the Topic through the Subtopic,
 * and `populate` to stop each of the 164 rows dragging a whole Topic — layout array included
 * — along with it. Depth is always explicit; the config default is 2 and would quietly make
 * the flat reads expensive.
 */
const QUERY_BY_COLLECTION: Record<ContentCollection, Record<string, string>> = {
  topics: { depth: "0" },
  subtopics: { depth: "0" },
  indicators: {
    depth: "2",
    "populate[subtopics][name]": "true",
    "populate[subtopics][description]": "true",
    "populate[subtopics][topic]": "true",
    "populate[topics][name]": "true",
  },
};

export const buildContentUrl = ({
  collection,
  locale,
  baseUrl = API_BASE,
}: {
  collection: ContentCollection;
  locale: string;
  baseUrl?: string;
}): string =>
  `${baseUrl}/${collection}?${new URLSearchParams({
    locale,
    "fallback-locale": "en",
    // 0 means unlimited. Payload caps a response at 10 records otherwise, which would
    // return 10 of 164 Indicators and raise nothing.
    limit: "0",
    ...QUERY_BY_COLLECTION[collection],
  }).toString()}`;

export const assertComplete = <T>(
  collection: ContentCollection,
  response: PaginatedResponse<T>,
): T[] => {
  const { docs, totalDocs, hasNextPage } = response;

  if (!Array.isArray(docs)) {
    throw new Error(`${collection}: response had no docs array`);
  }

  if (hasNextPage) {
    throw new Error(
      `${collection}: response is paginated (${docs.length} of ${totalDocs ?? "?"}). Pagination must be disabled or the catalogue silently loses records.`,
    );
  }

  const minimum = MINIMUM_RECORDS[collection];

  if (docs.length < minimum) {
    throw new Error(
      `${collection}: got ${docs.length} records, expected at least ${minimum}. Records are missing or unpublished.`,
    );
  }

  return docs;
};

export const fetchContent = async <T>({
  collection,
  locale,
  baseUrl,
  fetchImpl = fetch,
}: {
  collection: ContentCollection;
  locale: string;
  baseUrl?: string;
  fetchImpl?: typeof fetch;
}): Promise<T[]> => {
  const response = await fetchImpl(buildContentUrl({ collection, locale, baseUrl }));

  if (!response.ok) {
    throw new Error(`${collection}: request failed with ${response.status}`);
  }

  return assertComplete<T>(collection, (await response.json()) as PaginatedResponse<T>);
};
